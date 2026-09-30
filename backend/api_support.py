"""Support code for evidence review APIs.

This module deliberately accepts data frames supplied by ``main``.  It never
opens a caller-provided path, and review storage can be redirected in tests via
``NEXUS_REVIEWS_FILE``.
"""

from __future__ import annotations

import json
import math
import os
import tempfile
import threading
from contextlib import contextmanager
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple

import pandas as pd


MAX_EVIDENCE_ROWS = 200
MAX_REFERENCE_IDS = 100
REVIEW_STATUSES = {"confirm", "dismiss", "need-more-info"}
_review_lock = threading.RLock()


@contextmanager
def _locked_storage(path: Path):
    """Serialize review access across threads and server worker processes."""
    path.parent.mkdir(parents=True, exist_ok=True)
    lock_path = path.with_name(f".{path.name}.lock")
    with _review_lock:
        with lock_path.open("a+b") as lock_handle:
            lock_handle.seek(0, os.SEEK_END)
            if lock_handle.tell() == 0:
                lock_handle.write(b"\0")
                lock_handle.flush()
            lock_handle.seek(0)
            if os.name == "nt":
                import msvcrt

                msvcrt.locking(lock_handle.fileno(), msvcrt.LK_LOCK, 1)
            else:
                import fcntl

                fcntl.flock(lock_handle.fileno(), fcntl.LOCK_EX)
            try:
                yield
            finally:
                lock_handle.seek(0)
                if os.name == "nt":
                    msvcrt.locking(lock_handle.fileno(), msvcrt.LK_UNLCK, 1)
                else:
                    fcntl.flock(lock_handle.fileno(), fcntl.LOCK_UN)


def json_safe(value: Any) -> Any:
    """Convert pandas/numpy values into strict JSON-compatible Python values."""
    if value is None:
        return None
    if isinstance(value, (datetime, date, pd.Timestamp)):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(key): json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [json_safe(item) for item in value]
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    if hasattr(value, "item"):
        try:
            return json_safe(value.item())
        except (TypeError, ValueError):
            pass
    if isinstance(value, float) and not math.isfinite(value):
        return None
    return value


def _records(frame: Optional[pd.DataFrame]) -> List[Dict[str, Any]]:
    if frame is None or frame.empty:
        return []
    return [json_safe(record) for record in frame.to_dict(orient="records")]


def _values(evidence: Dict[str, Any], singular: Iterable[str], plural: Iterable[str]) -> Tuple[Set[str], List[str]]:
    values: Set[str] = set()
    limitations: List[str] = []
    for key in singular:
        if key not in evidence:
            continue
        raw = evidence[key]
        if isinstance(raw, str) and raw.strip():
            values.add(raw.strip())
        else:
            limitations.append(f"Ignored malformed {key}; expected a non-empty string.")
    for key in plural:
        if key not in evidence:
            continue
        raw = evidence[key]
        if not isinstance(raw, list):
            limitations.append(f"Ignored malformed {key}; expected a list of strings.")
            continue
        if len(raw) > MAX_REFERENCE_IDS:
            limitations.append(f"Only the first {MAX_REFERENCE_IDS} values from {key} were considered.")
        for item in raw[:MAX_REFERENCE_IDS]:
            if isinstance(item, str) and item.strip():
                values.add(item.strip())
            else:
                limitations.append(f"Ignored a malformed value in {key}.")
    return values, limitations


def _in(frame: pd.DataFrame, column: str, values: Set[str]) -> pd.DataFrame:
    if frame is None or frame.empty or column not in frame.columns or not values:
        return frame.iloc[0:0].copy() if frame is not None else pd.DataFrame()
    return frame[frame[column].astype(str).isin(values)].copy()


def _scope(frame: Optional[pd.DataFrame], entity_id: Optional[str]) -> pd.DataFrame:
    if frame is None:
        return pd.DataFrame()
    if not entity_id or entity_id == "ALL" or "entity_id" not in frame.columns:
        return frame.copy()
    return frame[frame["entity_id"].astype(str) == entity_id].copy()


def resolve_evidence_records(
    evidence: Dict[str, Any],
    entity_id: Optional[str],
    alerts: Optional[pd.DataFrame],
    cases: Optional[pd.DataFrame],
    assets: Optional[pd.DataFrame],
    events: Optional[pd.DataFrame],
) -> Dict[str, Any]:
    """Resolve an evidence graph anchored only by explicitly supported IDs."""
    alert_ids, limitations = _values(evidence, ("alert_id",), ("alert_ids", "missed_alert_ids"))
    case_ids, case_limitations = _values(evidence, ("case_id", "confirmed_incident_case"), ("case_ids",))
    asset_ids, asset_limitations = _values(evidence, ("asset_id",), ())
    limitations.extend(case_limitations)
    limitations.extend(asset_limitations)

    empty = {"alerts": [], "cases": [], "assets": [], "events": []}
    if not alert_ids and not case_ids and not asset_ids:
        limitations.append(
            "No supported explicit evidence IDs were supplied; entity-wide records were not attached."
        )
        return {"records": empty, "limitations": limitations, "truncated": False}

    scoped_alerts = _scope(alerts, entity_id)
    scoped_cases = _scope(cases, entity_id)
    scoped_assets = _scope(assets, entity_id)

    selected_cases = _in(scoped_cases, "case_id", case_ids)
    selected_alerts = _in(scoped_alerts, "alert_id", alert_ids)
    selected_assets = _in(scoped_assets, "asset_id", asset_ids)

    # Expand only from records reached by an explicit reference.
    linked_alert_ids = set(selected_cases.get("alert_id", pd.Series(dtype=str)).dropna().astype(str))
    selected_alerts = pd.concat([
        selected_alerts,
        _in(scoped_alerts, "alert_id", linked_alert_ids),
        _in(scoped_alerts, "asset_id", asset_ids),
    ]).drop_duplicates() if not scoped_alerts.empty else scoped_alerts

    reached_alert_ids = set(selected_alerts.get("alert_id", pd.Series(dtype=str)).dropna().astype(str))
    selected_cases = pd.concat([
        selected_cases,
        _in(scoped_cases, "alert_id", reached_alert_ids),
    ]).drop_duplicates() if not scoped_cases.empty else scoped_cases

    reached_asset_ids = set(selected_alerts.get("asset_id", pd.Series(dtype=str)).dropna().astype(str))
    selected_assets = pd.concat([
        selected_assets,
        _in(scoped_assets, "asset_id", reached_asset_ids),
    ]).drop_duplicates() if not scoped_assets.empty else scoped_assets

    selected_events = _in(events if events is not None else pd.DataFrame(), "alert_id", reached_alert_ids)

    requested = alert_ids | case_ids | asset_ids
    found = (
        set(selected_alerts.get("alert_id", pd.Series(dtype=str)).dropna().astype(str))
        | set(selected_cases.get("case_id", pd.Series(dtype=str)).dropna().astype(str))
        | set(selected_assets.get("asset_id", pd.Series(dtype=str)).dropna().astype(str))
    )
    missing = sorted(requested - found)
    if missing:
        scope_text = f" within entity {entity_id}" if entity_id and entity_id != "ALL" else ""
        limitations.append(f"No matching in-scope record was found for: {', '.join(missing)}{scope_text}.")

    frames = {
        "alerts": selected_alerts,
        "cases": selected_cases,
        "assets": selected_assets,
        "events": selected_events,
    }
    truncated = any(len(frame) > MAX_EVIDENCE_ROWS for frame in frames.values())
    if truncated:
        limitations.append(f"Results are limited to {MAX_EVIDENCE_ROWS} rows per record type.")
    return {
        "records": {name: _records(frame.head(MAX_EVIDENCE_ROWS)) for name, frame in frames.items()},
        "limitations": limitations,
        "truncated": truncated,
    }


def reviews_path() -> Path:
    configured = os.environ.get("NEXUS_REVIEWS_FILE")
    if configured:
        return Path(configured)
    return Path(__file__).resolve().parent / "data" / "reviews.json"


def _read_reviews_unlocked(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    try:
        with path.open("r", encoding="utf-8") as handle:
            reviews = json.load(handle)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise ValueError("Review storage is corrupted; it was not modified.") from exc
    if not isinstance(reviews, list) or not all(isinstance(review, dict) for review in reviews):
        raise ValueError("Review storage has an invalid format; it was not modified.")
    return reviews


def read_reviews(finding_id: Optional[str] = None) -> List[Dict[str, Any]]:
    path = reviews_path()
    with _locked_storage(path):
        reviews = _read_reviews_unlocked(path)
    if finding_id is not None:
        reviews = [review for review in reviews if review.get("finding_id") == finding_id]
    return reviews


def append_review(finding_id: str, status: str, comment: str) -> Dict[str, Any]:
    if status not in REVIEW_STATUSES:
        raise ValueError("Invalid review status.")
    review = {
        "finding_id": finding_id,
        "status": status,
        "comment": comment,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    path = reviews_path()
    with _locked_storage(path):
        reviews = _read_reviews_unlocked(path)
        reviews.append(review)
        path.parent.mkdir(parents=True, exist_ok=True)
        descriptor, temporary_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=str(path.parent))
        try:
            with os.fdopen(descriptor, "w", encoding="utf-8", newline="") as handle:
                json.dump(reviews, handle, indent=2, allow_nan=False)
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temporary_name, path)
        except Exception:
            try:
                os.unlink(temporary_name)
            except FileNotFoundError:
                pass
            raise
    return review
