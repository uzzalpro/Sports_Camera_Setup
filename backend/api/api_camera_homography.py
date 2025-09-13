from flask_restx import Resource
from http import HTTPStatus
from data_classes.point import point_model, point_ns
from database.session import start_session
from data_classes import Projection
from flask import request


# Handles PUT for homography source- and destination points of a specific camera
# @point_ns.route('/camera/<uuid:camera_id>/homography')
@point_ns.route('/projection/<uuid:projection_id>/homography')
class HomographyRes(Resource):
    @point_ns.response(HTTPStatus.OK, "Homography points correctly put", point_model)
    @point_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @point_ns.response(HTTPStatus.BAD_REQUEST, "Missing required fields or fields have incorrect types")
    @point_ns.response(HTTPStatus.UNPROCESSABLE_ENTITY, "Provided data is invalid")
    @point_ns.response(HTTPStatus.LOCKED, "Homography points don't exist")
    # Updates the homography point values of the currently selected camera in the database
    def put(self, projection_id):
        session_db = start_session()
        # camera: Camera = session_db.query(Camera).filter_by(camera_id=camera_id).first()
        projection: Projection = session_db.query(Projection).filter_by(projection_id=projection_id).first()

        # data = request.get_json()

        # for src_pt in camera.source_points:
        #     src_pt.update_point(data[0][str(src_pt.index)])

        # for dst_pt in camera.destination_points:
        #     dst_pt.update_point(data[1][str(dst_pt.index)])
        data = request.get_json()

        # data[0] → source_points, data[1] → destination_points
        for src_pt in projection.source_points:
            src_pt.update_point(data[0][str(src_pt.index)])

        for dst_pt in projection.destination_points:
            dst_pt.update_point(data[1][str(dst_pt.index)])


        session_db.commit()
        session_db.close()
        return "Homography points updated", HTTPStatus.OK
