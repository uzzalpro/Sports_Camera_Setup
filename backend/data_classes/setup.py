from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from typing import TYPE_CHECKING
from flask_restx import Namespace, fields
import uuid
from datetime import datetime
from .base import Base

if TYPE_CHECKING:
    from .camera import Camera
    from .detector import Detector
    from .team_detector import TeamDetector
    from .field import Field

setup_ns = Namespace("setup", description="Operations related to setups")

# Setup parser for setup names
setup_post_parser = (
    setup_ns.parser()
    .add_argument("setup_name", type=str, required=True, help="Name of the setup")
)

# Setup parser for setup config
setup_patch_parser = (
    setup_ns.parser()
    .add_argument("setup_name", type=str, required=False, help="New name for renaming the setup")
    .add_argument("detector_id", type=uuid.UUID, required=False, help="Id of the detector assigned to the setup")
    .add_argument("team_detector_id", type=uuid.UUID, required=False, help="Id of the team detector assigned to the setup")
    .add_argument("field_id", type=uuid.UUID, required=False, help="Id of the field assigned to the setup")
    .add_argument("device_type", type=str, required=False)
    .add_argument("timestamp_start", type=str, required=False)
    .add_argument("timestamp_end", type=str, required=False)
    .add_argument("extract_data_path", type=str, required=False)
    .add_argument("stop_team_after", type=int, required=False)
    .add_argument("tracker_type", type=str, required=False)
    .add_argument("output_fps", type=int, required=False)
    .add_argument("output_path", type=str, required=False)
    .add_argument("debug_visualize", type=bool, required=False)
)

# Setup model for setup config
setup_patch_model = setup_ns.model(
    "UpdateSetup",
    {
        "device_type": fields.String(description="Type of the device"),
        "timestamp_start": fields.String(description="Timestamp at start"),
        "timestamp_end": fields.String(description="Timestamp at end"),
        "extract_data_path": fields.String(description="Path to extract data to"),
        "stop_team_after": fields.Integer(description="When to stop the team"),
        "tracker_type": fields.String(description="Type of the Tracker"),
        "output_fps": fields.Integer(description="FPS of the output"),
        "output_path": fields.String(),
        "debug_visualize": fields.Boolean(description="Visualize debug option")
    }
)

# Setup model for setup names
setup_list_model = setup_ns.model(
    "SetupList",
    {
        "setup_id": fields.String(required=True, description="Id of the setup as a string"),
        "setup_name": fields.String(required=True, description="Name of the setup")
    }
)


# Setup class table definition
class Setup(Base):
    __tablename__ = "setups"

    # Table columns
    setup_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    setup_name: Mapped[str] = mapped_column()
    device_type: Mapped[str] = mapped_column(default="")
    timestamp_start: Mapped[datetime] = mapped_column(default=datetime.now)
    timestamp_end: Mapped[datetime] = mapped_column(default=datetime.now)
    debug_visualize: Mapped[bool] = mapped_column(default=False)
    extract_data_path: Mapped[str] = mapped_column(default="")
    stop_team_after: Mapped[int] = mapped_column(default="0")
    tracker_type: Mapped[str] = mapped_column(default="")
    output_fps: Mapped[int] = mapped_column(default=0)
    output_path: Mapped[str] = mapped_column(default="")
    detector_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("detectors.detector_id", ondelete="SET NULL"), unique=True, nullable=True)
    team_detector_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("team_detectors.team_detector_id", ondelete="SET NULL"), unique=True, nullable=True)
    field_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("fields.field_id", ondelete="SET NULL"), unique=True, nullable=True)

    # Relationships
    cameras: Mapped[list["Camera"]] = relationship(back_populates="setup", cascade="delete")
    detector: Mapped["Detector"] = relationship(back_populates="setup")
    team_detector: Mapped["TeamDetector"] = relationship(back_populates="setup")
    field: Mapped["Field"] = relationship(back_populates="setup")

    def __init__(self, setup_name: str, device_type: str = None, timestamp_start: datetime = None,
                timestamp_end: datetime = None, debug_visualize: bool = False, extract_data_path: str = None,
                stop_team_after: int = None, tracker_type: str = None, output_fps: int = None, output_path: str = None,
                detector_id: uuid.UUID = None, team_detector_id: uuid.UUID = None, field_id: uuid.UUID = None):
        # Initialize fields
        self.setup_name = setup_name
        self.device_type = device_type
        self.timestamp_start = timestamp_start
        self.timestamp_end = timestamp_end
        self.debug_visualize = debug_visualize
        self.extract_data_path = extract_data_path
        self.stop_team_after = stop_team_after
        self.tracker_type = tracker_type
        self.output_fps = output_fps
        self.output_path = output_path
        self.detector_id = detector_id
        self.team_detector_id = team_detector_id
        self.field_id = field_id

    def get_setup_id_name(self):
        # Return the id and name of the setup
        setup_id_name = {
            field: str(getattr(self, field)) if isinstance(getattr(self, field), uuid.UUID) else getattr(self, field)
            for field in setup_list_model.keys()
        }

        return setup_id_name

    def update_setup_config(self, data):
        # Update setup config fields that have a value
        for field, value in data.items():
            if value is not None:
                setattr(self, field, value)

    def get_setup_config(self):
        # Return the setup config
        setup_config = {
            field: getattr(self, field).isoformat() if isinstance(getattr(self, field), datetime) else getattr(self, field)
            for field in setup_patch_model.keys()
        }

        return setup_config
