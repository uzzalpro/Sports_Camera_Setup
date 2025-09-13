import sys
import os

# Add the backend root directory to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from data_classes.base import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
import test_session as db_module  # your actual import path for start_session
from main import app as flask_app

TEST_DATABASE_URL = "sqlite:///./test.db"  # Use a file DB so server can share it across requests

# Setup engine and session factory
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
Base.metadata.create_all(engine)
session_factory = sessionmaker(bind=engine)
test_session = scoped_session(session_factory)

# Patch the DB session provider in your app module
db_module.start_session = lambda: test_session

flask_app.config["TESTING"] = True
flask_app.config["DEBUG"] = False

if __name__ == "__main__":
    # Run the Flask app on localhost:5001
    flask_app.run(host="localhost", port=5001)
