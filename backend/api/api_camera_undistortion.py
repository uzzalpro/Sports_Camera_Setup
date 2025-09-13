from flask_restx import Resource
from http import HTTPStatus
from data_classes.undistortion import undistortion_model, undistortion_ns
from database.session import start_session
from data_classes import Projection
from flask import request


# Handles PUT for undistortion parameters of a specific camera
# @undistortion_ns.route('/camera/<uuid:camera_id>/undistortion')
@undistortion_ns.route('/projection/<uuid:projection_id>/undistortion')
class UndistortionRes(Resource):
    @undistortion_ns.response(HTTPStatus.OK, "Undistortion parameters correctly put", undistortion_model)
    @undistortion_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @undistortion_ns.response(HTTPStatus.BAD_REQUEST, "Missing required fields or fields have incorrect types")
    @undistortion_ns.response(HTTPStatus.UNPROCESSABLE_ENTITY, "Provided data is invalid")
    @undistortion_ns.response(HTTPStatus.LOCKED, "Undistortion parameters don't exist")
    # Updates the undistortion values of the currently selected camera in de database
    def put(self, projection_id):
        session_db = start_session()
        data = request.get_json()
        # camera: Camera = session_db.query(Camera).filter_by(camera_id=camera_id).first()
        projection: Projection = session_db.query(Projection).filter_by(projection_id=projection_id).first()

        projection.undistortion.update_undistortion_parameters(data)

        session_db.commit()
        session_db.close()
        return "Undistortion params updated", HTTPStatus.OK
