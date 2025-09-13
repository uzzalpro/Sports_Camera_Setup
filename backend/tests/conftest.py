import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from data_classes.base import Base
from main import app as flask_app
import test_session as db_module  # Adjust to your actual import path

TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def engine():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    yield engine
    engine.dispose()


@pytest.fixture(scope="session")
def tables(engine):
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture(scope="function")
def db_session(engine, tables):
    connection = engine.connect()
    transaction = connection.begin()
    session_factory = sessionmaker(bind=connection)
    session = scoped_session(session_factory)
    yield session
    transaction.rollback()
    connection.close()
    session.remove()


@pytest.fixture()
def client(db_session, monkeypatch):
    # Patch your app's DB session factory to use the test session
    monkeypatch.setattr(db_module, "start_session", lambda: db_session)

    flask_app.config["TESTING"] = True

    with flask_app.test_client() as client:
        yield client
