from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from data_classes.base import Base

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

Base.metadata.create_all(bind=engine)


def start_session():
    return SessionLocal()
