from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
# from .undistortion import undistortion_model
from flask_restx import Namespace, fields
from typing import TYPE_CHECKING
from .base import Base
from .point import point_model
from .crop import crop_model


if TYPE_CHECKING:
    from .setup import Setup
    # from .undistortion import Undistortion
    # from .destination_points import DestinationPoints
    # from .source_points import SourcePoints
    from .crop import Crop
    from .inner_points import InnerPoints
    from .outer_points import OuterPoints
    from .projection import Projection

camera_ns = Namespace("camera_page", description="Operations related to the camera page")

# Camera patch model for cam config
camera_patch_model = camera_ns.model(
    "CameraUpdate",
    {
        "resolution_width": fields.Integer(description="Width of the camera resolution"),
        "resolution_height": fields.Integer(description="Height of the camera resolution"),
        "position": fields.String(description="Position of the camera"),
        "cropping_type": fields.String(description="Type of cropping for the camera"),
        "time_correction": fields.Float(description="Correction of time-sync"),
        "path": fields.String(description="path to the video files")
    }
)

# Camera page parser for cam config
camera_patch_parser = (
    camera_ns.parser()
    .add_argument("camera_name", type=str, required=False, help="New name for the camera")
    .add_argument("resolution_width", type=int, required=False)
    .add_argument("resolution_height", type=int, required=False)
    .add_argument("position", type=str, required=False)
    .add_argument("cropping_type", type=str, required=False)
    .add_argument("time_correction", type=float, required=False)
    .add_argument("path", type=str, required=False)
    .add_argument("config_img_path", type=str, required=False)
)

# Camera parser for camera names
camera_post_parser = (
    camera_ns.parser()
    .add_argument("camera_name", type=str, required=True, help="Name of the camera")
)

# Camera model for camera names
camera_list_model = camera_ns.model(
    "CameraList",
    {
        "camera_id": fields.String(required=True, description="Id of the camera as a string"),
        "camera_name": fields.String(required=True, description="New name for renaming the camera")
    }
)

# Camera parser for config_img_path
camera_config_img_path_parser = (
    camera_ns.parser()
    .add_argument("config_img_path", type=str, required=True)
)


# Camera class table definition
class Camera(Base):
    __tablename__ = "cameras"

    # Table columns
    camera_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    setup_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("setups.setup_id", ondelete="CASCADE"))
    camera_name: Mapped[str] = mapped_column()
    resolution_width: Mapped[int] = mapped_column(default=0)
    resolution_height: Mapped[int] = mapped_column(default=0)
    position: Mapped[str] = mapped_column(default="")
    cropping_type: Mapped[str] = mapped_column(default="")
    time_correction: Mapped[float] = mapped_column(default=0)
    path: Mapped[str] = mapped_column(default="")
    config_img_path: Mapped[str] = mapped_column(default="")

    # Relationships
    setup: Mapped["Setup"] = relationship(back_populates="cameras")
    projections: Mapped[list["Projection"]] = relationship(back_populates="camera", cascade="delete")

    # undistortion: Mapped["Undistortion"] = relationship(back_populates="camera", cascade="delete", uselist=False)
    # source_points: Mapped[list["SourcePoints"]] = relationship(back_populates="camera", cascade="delete")
    # destination_points: Mapped[list["DestinationPoints"]] = relationship(back_populates="camera", cascade="delete")
    crops: Mapped[list["Crop"]] = relationship(back_populates="camera", cascade="delete")
    inner_points: Mapped[list["InnerPoints"]] = relationship(back_populates="camera", cascade="delete")
    outer_points: Mapped[list["OuterPoints"]] = relationship(back_populates="camera", cascade="delete")

    def __init__(self, camera_name=None, setup_id=None, resolution_width=0, resolution_height=0,
                position="", cropping_type="", time_correction=0, path="", config_img_path=""):
        # Initialize fields
        self.camera_name = camera_name
        self.setup_id = setup_id
        self.resolution_width = resolution_width
        self.resolution_height = resolution_height
        self.position = position
        self.cropping_type = cropping_type
        self.time_correction = time_correction
        self.path = path
        self.config_img_path = config_img_path

    def get_cam_id_name(self):
        # Return the id and name of the camera
        cam_id_name = {
            field: str(getattr(self, field)) if isinstance(getattr(self, field), uuid.UUID) else getattr(self, field)
            for field in camera_list_model.keys()
        }

        return cam_id_name

    def update_config_img_path(self, data):
        # Update the config img path
        self.config_img_path = data

    def get_config_img_path(self):
        # Return the config img path
        return self.config_img_path

    def update_cam_config(self, data):
        # Update camera config fields that have a value
        for field, value in data.items():
            if value is not None:
                setattr(self, field, value)

    def get_cam_config(self):
        # Return cam config and camera components data

        # Fetch the general camera config using dynamic field names
        cam_config = {
            field: getattr(self, field)
            for field in camera_patch_model.keys()
        }

        # # Fetch camera undistortion parameters
        # undistortion_params = {
        #     field: getattr(self.undistortion, field)
        #     for field in undistortion_model.keys()
        # }

        # # Fetch camera homography source points
        # src_pts = {
        #     str(spt.index): {field: getattr(spt, field) for field in point_model.keys()}
        #     for spt in self.source_points
        # }

        # # Fetch camera homography destination points
        # dst_pts = {
        #     str(dpt.index): {field: getattr(dpt, field) for field in point_model.keys()}
        #     for dpt in self.destination_points
        # }

        # Fetch camera crop coordinates
        crops = [
            {field: getattr(crop, field) for field in crop_model.keys()}
            for crop in self.crops
        ]

        # Fetch innerfield point coordinates
        inn_pts = [
            {field: getattr(ipt, field) for field in point_model.keys()}
            for ipt in self.inner_points
        ]

        # Fetch outerfield point coordinates
        out_pts = [
            {field: getattr(opt, field) for field in point_model.keys()}
            for opt in self.outer_points
        ]

        # Combine all the configurations
        all_config = {
            "config": cam_config,
            # "undistortion": undistortion_params,
            # "source_points": src_pts,
            # "destination_points": dst_pts,
            "crops": crops,
            "innerPoints": inn_pts,
            "outerPoints": out_pts,
            # "destination_points": dst_pts
        }

        return all_config
