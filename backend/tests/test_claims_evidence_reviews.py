import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.main import app, load_data


client = TestClient(app)
PRODUCTION_REVIEWS = Path(__file__).resolve().parents[1] / "data" / "reviews.json"


@pytest.fixture(autouse=True)
def isolated_review_storage(tmp_path, monkeypatch):
    before = PRODUCTION_REVIEWS.read_bytes() if PRODUCTION_REVIEWS.exists() else None
    monkeypatch.setenv("NEXUS_REVIEWS_FILE", str(tmp_path / "reviews.json"))
    yield tmp_path / "reviews.json"
    after = PRODUCTION_REVIEWS.read_bytes() if PRODUCTION_REVIEWS.exists() else None
    assert after == before


def test_claims_matrix_includes_review_metadata_without_changing_core_fields():
    response = client.get("/api/claims-matrix")
    assert response.status_code == 200
    rows = response.json()["claims_matrix"]
    assert len(rows) == 3
    for row in rows:
        assert isinstance(row["reason"], str) and row["reason"]
        assert isinstance(row["benchmark"], str) and row["benchmark"]
        assert isinstance(row["missing_evidence"], list) and row["missing_evidence"]
        assert isinstance(row["next_review_action"], str) and row["next_review_action"]
        assert row["scope"] == "Aggregate across all loaded entities; this is a predefined demo claim, not a submitted claim."
        assert row["status"] in {"SUPPORTED", "CONTRADICTED", "UNVERIFIABLE"}
        assert "evidence" in row and "declared" in row and "demonstrated" in row
    assert any("Closure time is not triage" in item for item in rows[1]["missing_evidence"])
    assert any("Alert absence does not prove monitoring absence" in item for item in rows[0]["missing_evidence"])


def test_evidence_records_resolves_explicit_reference_graph_and_safe_json():
    alerts, cases, _ = load_data()
    case = cases.iloc[0]
    response = client.post(
        "/api/evidence/records",
        json={"entity_id": case["entity_id"], "evidence": {"case_id": case["case_id"]}},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["truncated"] is False
    assert {row["case_id"] for row in body["records"]["cases"]} == {case["case_id"]}
    assert case["alert_id"] in {row["alert_id"] for row in body["records"]["alerts"]}
    assert all(row["entity_id"] == case["entity_id"] for row in body["records"]["alerts"])
    json.dumps(body, allow_nan=False)


def test_evidence_records_enforces_entity_scope_and_does_not_attach_entity_wide_data():
    alerts, _, _ = load_data()
    alert = alerts.iloc[0]
    other_entity = next(value for value in alerts["entity_id"].unique() if value != alert["entity_id"])

    isolated = client.post(
        "/api/evidence/records",
        json={"entity_id": other_entity, "evidence": {"alert_id": alert["alert_id"]}},
    )
    assert isolated.status_code == 200
    assert all(not rows for rows in isolated.json()["records"].values())
    assert "in-scope" in " ".join(isolated.json()["limitations"])

    no_refs = client.post(
        "/api/evidence/records",
        json={"entity_id": alert["entity_id"], "evidence": {"severity": "Critical"}},
    )
    assert no_refs.status_code == 200
    assert all(not rows for rows in no_refs.json()["records"].values())
    assert "entity-wide records were not attached" in " ".join(no_refs.json()["limitations"])


def test_review_roundtrip_appends_history(isolated_review_storage):
    first = {"finding_id": "FND-TEST-1", "status": "confirm", "comment": "Verified against the case log."}
    second = {"finding_id": "FND-TEST-1", "status": "need-more-info", "comment": "Need actor audit events."}
    assert client.post("/api/findings/review", json=first).status_code == 200
    assert client.post("/api/findings/review", json=second).status_code == 200

    response = client.get("/api/findings/reviews", params={"finding_id": "FND-TEST-1"})
    assert response.status_code == 200
    reviews = response.json()["reviews"]
    assert [review["status"] for review in reviews] == ["confirm", "need-more-info"]
    assert all(review["timestamp"] for review in reviews)
    assert len(json.loads(isolated_review_storage.read_text(encoding="utf-8"))) == 2


@pytest.mark.parametrize(
    "payload",
    [
        {"finding_id": "", "status": "confirm", "comment": "reason"},
        {"finding_id": "FND-1", "status": "approved", "comment": "reason"},
        {"finding_id": "FND-1", "status": "dismiss", "comment": "   "},
        {"finding_id": "X" * 201, "status": "confirm", "comment": "reason"},
        {"finding_id": "FND-1", "status": "confirm", "comment": "X" * 4001},
    ],
)
def test_review_validation(payload):
    assert client.post("/api/findings/review", json=payload).status_code == 422


def test_corrupt_review_storage_is_reported_and_never_overwritten(isolated_review_storage):
    corrupt = b"{not valid json"
    isolated_review_storage.write_bytes(corrupt)

    post = client.post(
        "/api/findings/review",
        json={"finding_id": "FND-1", "status": "dismiss", "comment": "Evidence disproves it."},
    )
    get = client.get("/api/findings/reviews", params={"finding_id": "FND-1"})
    assert post.status_code == 500
    assert get.status_code == 500
    assert isolated_review_storage.read_bytes() == corrupt
