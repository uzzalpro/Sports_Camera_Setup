from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from flask_restx import Namespace, fields
from typing import TYPE_CHECKING
from .base import Base

if TYPE_CHECKING:
    # from .camera import Camera
    from .projection import Projection

undistortion_ns = Namespace("undistortion", description="Operations related to undistortion")

# Undistortion model for undistortion parameters
undistortion_model = undistortion_ns.model(
    "Undistortion",
    {
        "x": fields.Float(required=True, description="Focal Point X"),
        "y": fields.Float(required=True, description="Focal Point Y"),
        "w": fields.Float(required=True, description="Focal Length Width"),
        "h": fields.Float(required=True, description="Focal Length Height"),
        "k1": fields.Float(required=True, description="K1 undistortion parameter"),
        "k2": fields.Float(required=True, description="K2 undistortion parameter"),
        "p1": fields.Float(required=True, description="P1 undistortion parameter"),
        "p2": fields.Float(required=True, description="P2 undistortion parameter"),
        "k3": fields.Float(required=True, description="K3 undistortion parameter"),
        "zoom": fields.Float(required=True, description="Zoom undistortion parameter")
    }
)


# Undistortion class table definition
class Undistortion(Base):
    __tablename__ = "undistortions"

    # Table columns
    undistortion_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # camera_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cameras.camera_id", ondelete="CASCADE"))
    projection_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projections.projection_id", ondelete="CASCADE"))

    x: Mapped[float] = mapped_column(default=50)
    y: Mapped[float] = mapped_column(default=50)
    w: Mapped[float] = mapped_column(default=50)
    h: Mapped[float] = mapped_column(default=50)
    k1: Mapped[float] = mapped_column(default=0)
    k2: Mapped[float] = mapped_column(default=0)
    p1: Mapped[float] = mapped_column(default=0)
    p2: Mapped[float] = mapped_column(default=0)
    k3: Mapped[float] = mapped_column(default=0)
    zoom: Mapped[float] = mapped_column(default=0)

    # Relationships
    # camera: Mapped["Camera"] = relationship(back_populates="undistortion")
    projection: Mapped["Projection"] = relationship(back_populates="undistortion")


    def __init__(self, camera_id: uuid.UUID, x: float = 50, y: float = 50, w: float = 50,
                h: float = 50, k1: float = 0, k2: float = 0, p1: float = 0, p2: float = 0, k3: float = 0, zoom: float = 0):
        # Initialize fields
        self.camera_id = camera_id
        self.x = x
        self.y = y
        self.w = w
        self.h = h
        self.k1 = k1
        self.k2 = k2
        self.p1 = p1
        self.p2 = p2
        self.k3 = k3
        self.zoom = zoom

    def update_undistortion_parameters(self, data):
        # Update undistortion parameters of the camera
        for field in undistortion_model.keys():
            setattr(self, field, data[field])
