from sqlalchemy import select, create_engine
from sqlalchemy.orm import sessionmaker
from db_setup import Setup
import os

# Set url from env variable
DATABASE_URL = os.getenv("CONF_TOOL_DB_URL")

# Create engine
engine = create_engine(DATABASE_URL)

Session = sessionmaker(bind=engine)
session = Session()

stmt = select(Setup.setup_name)

result = session.execute(stmt)

users = result.scalars().all()

print(users)


def test_fetch():
    assert session.execute(stmt)


session.close()
