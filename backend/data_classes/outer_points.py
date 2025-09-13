from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from typing import TYPE_CHECKING
from .base import Base
from .point import Point

if TYPE_CHECKING:
    from .camera import Camera


# OuterPoints class table definition
class OuterPoints(Base, Point):
    __tablename__ = "outer_points"

    # Table columns
    outer_point_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    camera_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cameras.camera_id", ondelete="CASCADE"))
    index: Mapped[int] = mapped_column(nullable=False, index=True)

    # Relationships
    camera: Mapped["Camera"] = relationship(back_populates="outer_points")

    def __init__(self, camera_id: uuid.UUID, index: int, x: float, y: float):
        # Initialize fields
        self.camera_id = camera_id
        self.index = index
        self.x = x
        self.y = y
