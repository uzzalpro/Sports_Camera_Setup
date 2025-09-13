from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from flask_restx import Namespace
import uuid
from .base import Base

user_ns = Namespace("user", description="Login and register operation")

# User parser for user data
user_post_parser = (
    user_ns.parser()
    .add_argument("email", type=str, required=True, help="Email of the user")
    .add_argument("username", type=str, required=True, help="Username of the user")
    .add_argument("password", type=str, required=True, help="Password of the user")
)


# User class table definition
class User(Base):
    __tablename__ = 'users'

    # Table columns
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(unique=True)
    username: Mapped[str] = mapped_column(unique=True, nullable=False)
    password: Mapped[bytes] = mapped_column(nullable=False)

    def __init__(self, email: str, username: str, password: bytes):
        # Initialize fields
        self.email = email
        self.username = username
        self.password = password
