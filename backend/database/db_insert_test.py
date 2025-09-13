# This is a test script for inserting values/rows in a certain table of the database

from sqlalchemy import create_engine, insert
from sqlalchemy.orm import sessionmaker
from db_setup import User
import bcrypt
import getpass
import os

# Set url from env variable
DATABASE_URL = os.getenv("CONF_TOOL_DB_URL")

# Create engine object used for connecting with the db
engine = create_engine(DATABASE_URL)
# Creating a session class used for interacting with the databse
Session = sessionmaker(bind=engine)
session = Session()

# # for single user
# stmt = insert(User).values(email="jeffdebroeck@gmail.com", username="jeff", password="jeff1234")

# # for multiple users
# users_to_insert = [
#     {"email": "jeffdebroeck@gmail.com", "username": "Jeff", "password": "jeff1234"},
#     {"email": "jasonstatham@gmail.com", "username": "Jason", "password": "jason4567"},
#     {"email": "valery@gmail.com", "username": "Val", "password": "Val8910"}
# ]

# stmt = insert(User).values(users_to_insert)

# Get the info from the user as an input
email = input("Input an email\n")
username = input("Input a username\n")
password = getpass.getpass("Input a password\n")  # Getpass is used to hide the inputfield

# Hashing the password
bytes = password.encode('utf-8')
salt = bcrypt.gensalt()  # Generate salt
hash = bcrypt.hashpw(bytes, salt)  # Hash and salt password

stmt = insert(User).values(email=email, username=username, password=hash)

session.execute(stmt)

session.commit()

# Close session
session.close()
