from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from typing import TYPE_CHECKING
from .base import Base
from .point import Point
from flask_restx import Namespace, fields
from .undistortion import undistortion_model
from .point import point_model


if TYPE_CHECKING:
    from .camera import Camera
    from .undistortion import Undistortion
    from .destination_points import DestinationPoints
    from .source_points import SourcePoints


projection_ns = Namespace("projection", description="Operations related to projections")

projection_patch_model = projection_ns.model(
    "ProjectionUpdate",
    {
        "projection_id": fields.String(required=True, description="Projection ID"),
        "camera_id": fields.String(required=True, description="Camera ID"),
        "projection_name": fields.String(required=True, description="Projection name (for dropdown)"),
    }
)

# projection page parser for  config
projection_patch_parser = (
    projection_ns.parser()
    .add_argument("projection_name", type=str, required=False, help="New name for the camera")
)

class Projection(Base):
    __tablename__ = "projections"

    projection_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    camera_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cameras.camera_id", ondelete="CASCADE"))
    projection_name: Mapped[str] = mapped_column(default="Default Projection")

    # Relationship → one projection for multiple configs
    camera: Mapped["Camera"] = relationship(back_populates="projections")

    # Link calibration tables (one-to-one or one-to-many)
    undistortion: Mapped["Undistortion"] = relationship(back_populates="projection", cascade="delete", uselist=False)
    source_points: Mapped[list["SourcePoints"]] = relationship(back_populates="projection", cascade="delete")
    destination_points: Mapped[list["DestinationPoints"]] = relationship(back_populates="projection", cascade="delete")

    def __init__(self, camera_id: uuid.UUID, name: str = "Default Projection"):
        self.camera_id = camera_id
        self.name = name
    

    def get_projection_config(self):
        # Undistortion parameters (safe fetch)
        undistortion_params = {}
        if self.undistortion:
            undistortion_params = {
                field: getattr(self.undistortion, field)
                for field in undistortion_model.keys()
            }

        # Source points (safe fetch)
        src_pts = {}
        if self.source_points:
            src_pts = {
                str(spt.index): {field: getattr(spt, field) for field in point_model.keys()}
                for spt in self.source_points
            }

        # Destination points (safe fetch)
        dst_pts = {}
        if self.destination_points:
            dst_pts = {
                str(dpt.index): {field: getattr(dpt, field) for field in point_model.keys()}
                for dpt in self.destination_points
            }

        return {
            "undistortion": undistortion_params,
            "source_points": src_pts,
            "destination_points": dst_pts,
        }


    def get_projection_info(self):
        return {
            "projection_id": str(self.projection_id),
            "camera_id": str(self.camera_id),
            "name": self.name,
        }

