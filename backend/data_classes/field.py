from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from flask_restx import Namespace, fields
from .base import Base
from .configurable import Configurable
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .setup import Setup

field_ns = Namespace("field", description="Operations related to fields")

# Field model
field_model = field_ns.model(
    "Field",
    {
        "pitch_width": fields.Integer(required=True, description="Width of the pitch"),
        "pitch_height": fields.Integer(required=True, description="Height of the pitch"),
        "left_top_x": fields.Integer(required=True, description="Top left x coordinate"),
        "left_top_y": fields.Integer(required=True, description="Top left y coordinate"),
        "right_bottom_x": fields.Integer(required=True, description="Bottom right x coordinate"),
        "right_bottom_y": fields.Integer(required=True, description="Bottom right y coordinate"),
        "path": fields.String(required=True),
    }
)

# Field parser
field_patch_parser = (
    field_ns.parser()
    .add_argument("pitch_width", type=int, required=False, help="Width of the pitch")
    .add_argument("pitch_height", type=int, required=False, help="Height of the pitch")
    .add_argument("left_top_x", type=int, required=False, help="Top left x coordinate")
    .add_argument("left_top_y", type=int, required=False, help="Top left y coordinate")
    .add_argument("right_bottom_x", type=int, required=False, help="Bottom right x coordinate")
    .add_argument("right_bottom_y", type=int, required=False, help="Bottom right y coordinate")
    .add_argument("path", type=str, required=False)
)


# Field class table definition
class Field(Base, Configurable):
    __tablename__ = "fields"

    # Table columns
    field_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pitch_width: Mapped[int] = mapped_column(default=0)
    pitch_height: Mapped[int] = mapped_column(default=0)
    left_top_x: Mapped[int] = mapped_column(default=0)
    left_top_y: Mapped[int] = mapped_column(default=0)
    right_bottom_x: Mapped[int] = mapped_column(default=0)
    right_bottom_y: Mapped[int] = mapped_column(default=0)
    path: Mapped[str] = mapped_column(default="")

    id_field = "field_id"
    model_fields = list(field_model.keys())

    # Relationships
    setup: Mapped["Setup"] = relationship(back_populates="field")

    def __init__(self, pitch_width: int = 0, pitch_height: int = 0, left_top_x: int = 0, left_top_y: int = 0,
                right_bottom_x: int = 0, right_bottom_y: int = 0, path: str = ""):
        # Initialize fields
        self.pitch_width = pitch_width
        self.pitch_height = pitch_height
        self.left_top_x = left_top_x
        self.left_top_y = left_top_y
        self.right_bottom_x = right_bottom_x
        self.right_bottom_y = right_bottom_y
        self.path = path
