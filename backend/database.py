import os
import threading
from typing import Optional

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.exc import SQLAlchemyError


class DatabaseConfigurationError(RuntimeError):
    """Raised when the database cannot be configured safely."""


_engine: Optional[Engine] = None
_engine_pid: Optional[int] = None
_engine_lock = threading.Lock()


def _database_url():
    raw_url = os.getenv("DATABASE_URL")
    if not raw_url:
        raise DatabaseConfigurationError("Database configuration is unavailable")

    try:
        url = make_url(raw_url)
    except SQLAlchemyError as exc:
        raise DatabaseConfigurationError("Database configuration is invalid") from exc

    if url.get_backend_name() == "postgresql" and "sslmode" not in url.query:
        url = url.set(query={**url.query, "sslmode": "require"})
    return url


def get_engine() -> Engine:
    """Return the single lazily-created SQLAlchemy engine for this process."""
    global _engine, _engine_pid

    pid = os.getpid()
    if _engine is not None and _engine_pid == pid:
        return _engine

    with _engine_lock:
        if _engine is not None and _engine_pid == pid:
            return _engine

        if _engine is not None:
            _engine.dispose()

        try:
            _engine = create_engine(
                _database_url(),
                pool_size=15,
                max_overflow=10,
                pool_timeout=30,
                pool_pre_ping=True,
                pool_recycle=300,
                connect_args={"connect_timeout": 15},
            )
        except DatabaseConfigurationError:
            raise
        except (ModuleNotFoundError, SQLAlchemyError) as exc:
            raise DatabaseConfigurationError("Database configuration is invalid") from exc

        _engine_pid = pid
        return _engine


def dispose_engine() -> None:
    """Dispose the process engine and clear the shared reference."""
    global _engine, _engine_pid

    with _engine_lock:
        if _engine is not None:
            _engine.dispose()
        _engine = None
        _engine_pid = None
