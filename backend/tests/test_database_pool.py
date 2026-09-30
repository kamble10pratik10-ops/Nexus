from concurrent.futures import ThreadPoolExecutor
from unittest.mock import MagicMock

import pandas as pd
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from backend import database, main


@pytest.fixture
def isolated_engine(monkeypatch):
    monkeypatch.setattr(database, '_engine', None)
    monkeypatch.setattr(database, '_engine_pid', None)
    monkeypatch.setenv('DATABASE_URL', 'postgresql://test:test@localhost/test')
    factory = MagicMock()
    monkeypatch.setattr(database, 'create_engine', factory)
    return factory


def test_concurrent_calls_share_one_bounded_pool(isolated_engine):
    with ThreadPoolExecutor(max_workers=16) as executor:
        engines = list(executor.map(lambda _: database.get_engine(), range(100)))
    isolated_engine.assert_called_once()
    assert all(engine is engines[0] for engine in engines)
    options = isolated_engine.call_args.kwargs
    assert options['pool_size'] == 3
    assert options['max_overflow'] == 0
    assert options['pool_timeout'] == 10
    assert options['pool_pre_ping'] is True
    assert isolated_engine.call_args.args[0].query['sslmode'] == 'require'
    database.dispose_engine()
    engines[0].dispose.assert_called_once()


def test_loaders_release_connections(monkeypatch):
    engine = MagicMock()
    monkeypatch.setattr(main, 'get_engine', lambda: engine)
    def read_table(name, connection):
        assert connection is engine.connect.return_value.__enter__.return_value
        if name == 'alerts':
            return pd.DataFrame({'created_at': ['2026-01-01'], 'closed_at': ['2026-01-02']})
        return pd.DataFrame()
    monkeypatch.setattr(main.pd, 'read_sql_table', read_table)
    main.load_data()
    main.load_assets()
    assert engine.connect.return_value.__exit__.call_count == 2


def test_database_errors_are_sanitized_503(monkeypatch):
    engine = MagicMock()
    engine.connect.side_effect = OperationalError('private-url', {}, Exception('secret'))
    monkeypatch.setattr(main, 'get_engine', lambda: engine)
    for loader in (main.load_data, main.load_assets):
        with pytest.raises(HTTPException) as error:
            loader()
        assert error.value.status_code == 503
        assert error.value.detail == 'Database service unavailable'
    client = TestClient(main.app)
    assert client.get('/health').status_code == 200
    response = client.get('/health/ready')
    assert response.status_code == 503
    assert 'secret' not in response.text


def test_readiness_returns_connection(monkeypatch):
    engine = MagicMock()
    monkeypatch.setattr(main, 'get_engine', lambda: engine)
    assert TestClient(main.app).get('/health/ready').status_code == 200
    engine.connect.return_value.__exit__.assert_called_once()


def test_shutdown_disposes_engine(monkeypatch):
    dispose = MagicMock()
    monkeypatch.setattr(main, 'dispose_engine', dispose)
    with TestClient(main.app):
        pass
    dispose.assert_called_once()
