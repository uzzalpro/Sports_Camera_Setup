from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from flask_restx import Namespace, fields
from .base import Base
from .configurable import Configurable
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .setup import Setup

team_detector_ns = Namespace("team_detector")

# Team detector model
team_detector_model = team_detector_ns.model(
    "UpdateTeamDetector",
    {
        "type": fields.String(required=True, description="Type of the team detector"),
        "model_name": fields.String(required=True, description="Name of the team detector model"),
        "use_hsl": fields.Boolean(required=True, description="Option to use HSL for the team detector"),
        "old_dual_head": fields.Boolean(required=True, description="Option to use the old dual head for the team detector")
    }
)

# Team detector parser
team_detector_patch_parser = (
    team_detector_ns.parser()
    .add_argument("type", type=str, required=False, help="Type of the team detector")
    .add_argument("model_name", type=str, required=False, help="Name of the team detector model")
    .add_argument("use_hsl", type=bool, required=False, help="Option to use HSL for the team detector")
    .add_argument("old_dual_head", type=bool, required=False, help="Option to use the old dual head for the team detector")
)


# TeamDetector class table definition
class TeamDetector(Base, Configurable):
    __tablename__ = "team_detectors"

    # Table columns
    team_detector_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type: Mapped[str] = mapped_column(default="")
    model_name: Mapped[str] = mapped_column(default="")
    use_hsl: Mapped[bool] = mapped_column(default=False)
    old_dual_head: Mapped[bool] = mapped_column(default=False)
    id_field = "team_detector_id"
    model_fields = list(team_detector_model.keys())

    # Relationships
    setup: Mapped["Setup"] = relationship(back_populates="team_detector")

    def __init__(self, type: str = "", model_name: str = "", use_hsl: bool = False, old_dual_head: bool = False):
        # Initialize fields
        self.type = type
        self.model_name = model_name
        self.use_hsl = use_hsl
        self.old_dual_head = old_dual_head
