from flask import request, jsonify
from flask_restx import Namespace, Resource
from http import HTTPStatus
import numpy as np
import cv2

undistort_points_ns = Namespace("undistort_points", description="Using the openCv undistortPoints function")


@undistort_points_ns.route('/undistort_points')
class UndistortPointsRes(Resource):
    @undistort_points_ns.response(HTTPStatus.CREATED, "Points send for undistortPoints")
    @undistort_points_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @undistort_points_ns.response(HTTPStatus.BAD_REQUEST, "Missing required fields or fields have incorrect types")
    @undistort_points_ns.response(HTTPStatus.UNPROCESSABLE_ENTITY, "Provided data is invalid")
    # Apply undistortPoints to a set of points and return them
    def post(self):
        data = request.get_json()

        points = np.array(data["points"], dtype=np.float64).reshape(-1, 1, 2)
        cam_matrix = np.array(data["camMatrix"], dtype=np.float64).reshape(3, 3)
        dis_coeffs = np.array(data["distCoeffs"], dtype=np.float64).reshape(1, -1)
        zoom = float(data["zoom"])

        imgW, imgH = int(data["imageWidth"]), int(data["imageHeight"])

        undist_cam, _ = cv2.getOptimalNewCameraMatrix(cam_matrix, dis_coeffs, (imgW, imgH), zoom, (imgW, imgH))

        undist_cam = np.array(undist_cam, dtype=np.float64)

        # undistortedPoints = cv2.undistortPoints(points, cam_matrix, dis_coeffs, P=cam_matrix)
        undistortedPoints = cv2.undistortPoints(points, cam_matrix, dis_coeffs, None, None, undist_cam)

        undistorted_list = undistortedPoints.reshape(-1, 2).tolist()

        return jsonify({
            "undistorted_points": undistorted_list,
            "undist_cam": undist_cam.tolist()
        })
