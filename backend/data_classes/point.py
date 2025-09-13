from sqlalchemy.orm import Mapped, mapped_column
from flask_restx import Namespace, fields

point_ns = Namespace("points", description="Operations related to 2D points")

# Point model for homography and pitch marking
point_model = point_ns.model(
    "Point",
    {
        "x": fields.Float(required=True, description="X coordinate"),
        "y": fields.Float(required=True, description="Y coordinate")
    }
)


class Point:
    x: Mapped[float] = mapped_column(default=0)
    y: Mapped[float] = mapped_column(default=0)

    def update_point(self, data):
        # Updates the source point values of the camera
        for field in point_model.keys():
            value = data[field]
            if value is not None:
                setattr(self, field, value)
