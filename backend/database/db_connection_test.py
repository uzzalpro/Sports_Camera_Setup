# This script simply tests the connection with the postgres database
# you can adjust the variables depending on the database server

from sqlalchemy import create_engine
import os

# Set url from env variable
DATABASE_URL = os.getenv("CONF_TOOL_DB_URL")

# Create engine object used for connecting with the db
engine = create_engine(DATABASE_URL)


# Test if connection was succesful
def test_connection():
    assert engine.connect(), "Unable to connect to the db"
