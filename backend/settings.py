# This file contains configuration for environment variables and the secret key

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

DATABASE_URL = os.getenv("CONF_TOOL_DB_URL")
SECRET_KEY = "test-test-test"
