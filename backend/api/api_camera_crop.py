from flask import request
from flask_restx import Resource
from data_classes import Crop, Camera
from database.session import start_session
from http import HTTPStatus
from data_classes.crop import crop_model, crop_ns


# Handles PUT for crop coordinates of a specific cam
@crop_ns.route('/camera/<uuid:camera_id>/crop')
class CropRes(Resource):
    @crop_ns.response(HTTPStatus.OK, "Crop points correctly put", crop_model)
    @crop_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @crop_ns.response(HTTPStatus.BAD_REQUEST, "Missing required fields or fields have incorrect types")
    @crop_ns.response(HTTPStatus.UNPROCESSABLE_ENTITY, "Provided data is invalid")
    @crop_ns.response(HTTPStatus.LOCKED, "Crop points don't exist")
    # Updates the crop point values of the currently selected camera in the database
    def put(self, camera_id):
        session_db = start_session()
        camera: Camera = session_db.query(Camera).filter_by(camera_id=camera_id).first()

        crops = camera.crops
        for crop in crops:
            session_db.delete(crop)

        data = request.get_json()
        for crop in data:
            session_db.add(Crop(
                camera_id=camera_id,
                top_left_x=crop["top_left_x"],
                top_left_y=crop["top_left_y"],
                bottom_right_x=crop["bottom_right_x"],
                bottom_right_y=crop["bottom_right_y"]
            ))

        session_db.commit()
        session_db.close()
        return "Crops updated"
