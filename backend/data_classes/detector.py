from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from flask_restx import Namespace, fields
from .base import Base
from .configurable import Configurable
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .setup import Setup

detector_ns = Namespace("detector")

# Detector model
detector_model = detector_ns.model(
    "UpdateDetector",
    {
        "model_name": fields.String(required=True, description="Model of the detector"),
        "image_size": fields.Integer(required=True, description="Size of the detector image")
    }
)

# Detector parser
detector_patch_parser = (
    detector_ns.parser()
    .add_argument("model_name", type=str, required=False, help="Model of the detector")
    .add_argument("image_size", type=int, required=False, help="Size of the detector image")
)


# Detector class table definition
class Detector(Base, Configurable):
    __tablename__ = "detectors"

    # Table columns
    detector_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_name: Mapped[str] = mapped_column(default="")
    image_size: Mapped[int] = mapped_column(default=0)

    id_field = "detector_id"
    model_fields = list(detector_model.keys())

    # Relationships
    setup: Mapped["Setup"] = relationship(back_populates="detector")

    def __init__(self, detector_model: str = "", image_size: int = 0):
        # Initialize fields
        self.detector_model = detector_model
        self.image_size = image_size
