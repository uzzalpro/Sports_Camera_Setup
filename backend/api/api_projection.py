from flask_restx import Resource
from data_classes import Projection
from data_classes.projection import projection_patch_model, projection_patch_parser, projection_ns
from database.session import start_session
from http import HTTPStatus
from flask import request, Response

# --- LIST + CREATE by camera ---
@projection_ns.route('/camera/<uuid:camera_id>/projections')
class ProjectionListRes(Resource):
    def get(self, camera_id):
        """List all projections for a camera (for dropdown)"""
        s = start_session()
        items = (
            s.query(Projection)
             .filter_by(camera_id=camera_id)
             .order_by(Projection.name.asc())
             .all()
        )
        data = [p.get_projection_info() for p in items]
        s.close()
        return data, HTTPStatus.OK

    def post(self, camera_id):
        """Create a projection under a camera (optionally with a name)"""
        s = start_session()
        payload = request.get_json(force=True) or {}
        name = payload.get("name", "New Projection")

        # create
        proj = Projection(camera_id=camera_id, name=name)
        s.add(proj)
        s.flush()  # get projection_id

        # seed defaults if empty
        # _seed_projection_defaults(s, proj)

        s.commit()
        out = proj.get_projection_info()
        s.close()
        return out, HTTPStatus.CREATED


# def _seed_projection_defaults(s, proj: "Projection"):
#     # create undistortion if missing
#     if not proj.undistortion:
#         s.add(Undistortion(projection_id=proj.projection_id))

#     # 4 source/destination points (indexes 0..3) if missing
#     if not proj.source_points:
#         for i in range(4):
#             s.add(SourcePoints(projection_id=proj.projection_id, index=i, x=0.0, y=0.0))

#     if not proj.destination_points:
#         for i in range(4):
#             s.add(DestinationPoints(projection_id=proj.projection_id, index=i, x=0.0, y=0.0))
