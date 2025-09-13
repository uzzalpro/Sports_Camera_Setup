from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from typing import TYPE_CHECKING
from .base import Base
from .point import Point

if TYPE_CHECKING:
    # from .camera import Camera
    from .projection import Projection


# DestinationPoints class table definition
class DestinationPoints(Base, Point):
    __tablename__ = "destination_points"

    # Table columns
    destination_point_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # camera_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cameras.camera_id", ondelete="CASCADE"))
    projection_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projections.projection_id", ondelete="CASCADE"))

    index: Mapped[int] = mapped_column(nullable=False, index=True)

    # Relationships
    # camera: Mapped["Camera"] = relationship(back_populates="destination_points")
    projection: Mapped["Projection"] = relationship(back_populates="source_points")

    def __init__(self, camera_id: uuid.UUID, index: int, x: float = 0, y: float = 0):
        # Initialize fields
        self.camera_id = camera_id
        self.index = index
        self.x = x
        self.y = y
