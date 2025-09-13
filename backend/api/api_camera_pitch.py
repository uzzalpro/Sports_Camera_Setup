from flask import request
from flask_restx import Resource
from data_classes import InnerPoints, OuterPoints, Camera
from database.session import start_session
from http import HTTPStatus
from data_classes.point import point_model, point_ns


# Handles PUT for pitch inner- outerfield points of a specific cam
@point_ns.route('/camera/<uuid:camera_id>/pitch')
class PitchRes(Resource):
    @point_ns.response(HTTPStatus.OK, "Pitch points correctly put", point_model)
    @point_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @point_ns.response(HTTPStatus.BAD_REQUEST, "Missing required fields or fields have incorrect types")
    @point_ns.response(HTTPStatus.UNPROCESSABLE_ENTITY, "Provided data is invalid")
    @point_ns.response(HTTPStatus.LOCKED, "Pitch points don't exist")
    # Updates the inner- and outerfield point values of the currently selecte camera in the database
    def put(self, camera_id):
        session_db = start_session()
        camera: Camera = session_db.query(Camera).filter_by(camera_id=camera_id).first()

        inner_points = camera.inner_points
        for point in inner_points:
            session_db.delete(point)

        outer_points = camera.outer_points
        for point in outer_points:
            session_db.delete(point)

        data = request.get_json()

        inner_data = data[0]
        outer_data = data[1]

        index = 1
        for point in inner_data:
            session_db.add(InnerPoints(
                camera_id=camera_id,
                index=index,
                x=point["x"],
                y=point["y"]
            ))
            index += 1

        index = 1
        for point in outer_data:
            session_db.add(OuterPoints(
                camera_id=camera_id,
                index=index,
                x=point["x"],
                y=point["y"]
            ))
            index += 1

        session_db.commit()
        session_db.close()
        return "Pitch points updated"
