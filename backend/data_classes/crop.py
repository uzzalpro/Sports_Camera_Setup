from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from flask_restx import Namespace, fields
from typing import TYPE_CHECKING
from .base import Base

if TYPE_CHECKING:
    from .camera import Camera

crop_ns = Namespace("crop", description="PUT requests for crop coordinates")

# Model for crop points
crop_model = crop_ns.model(
    "Crop",
    {
        "top_left_x": fields.Float(required=True, description="x coordinate of the top left corner"),
        "top_left_y": fields.Float(required=True, description="y coordinate of the top left corner"),
        "bottom_right_x": fields.Float(required=True, description="x coordinate of the bottom right corner"),
        "bottom_right_y": fields.Float(required=True, description="y coordinate of the bottom right corner")
    }
)


# Crop class table definition
class Crop(Base):
    __tablename__ = "crops"

    # Table columns
    crop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    camera_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cameras.camera_id", ondelete="CASCADE"))
    top_left_x: Mapped[float] = mapped_column()
    top_left_y: Mapped[float] = mapped_column()
    bottom_right_x: Mapped[float] = mapped_column()
    bottom_right_y: Mapped[float] = mapped_column()

    # Relationships
    camera: Mapped["Camera"] = relationship(back_populates="crops")

    def __init__(self, camera_id: uuid.UUID, top_left_x: float, top_left_y: float, bottom_right_x: float, bottom_right_y: float):
        # Initialize fields
        self.camera_id = camera_id
        self.top_left_x = top_left_x
        self.top_left_y = top_left_y
        self.bottom_right_x = bottom_right_x
        self.bottom_right_y = bottom_right_y
