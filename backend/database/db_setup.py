# This script is used to make the tables and their columns of the database
# This should only be run once and serves more as documentation then use

from sqlalchemy import create_engine
from data_classes.base import Base
from settings import DATABASE_URL

# Create engine
engine = create_engine(DATABASE_URL)

# Create tables in database
Base.metadata.create_all(engine)
