from flask_restx import Resource
from data_classes import Camera
from data_classes.camera import camera_patch_model, camera_patch_parser, camera_ns
from database.session import start_session
from http import HTTPStatus


# Handles GET, PATCH and DELETE for one specific camera
@camera_ns.route('/camera/<uuid:camera_id>')
class CameraRes(Resource):
    @camera_ns.response(HTTPStatus.OK, "Camera config correctly updated", camera_patch_model)
    @camera_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @camera_ns.response(HTTPStatus.BAD_REQUEST, "Missing required fields or fields have incorrect types")
    @camera_ns.response(HTTPStatus.UNPROCESSABLE_ENTITY, "Provided data is invalid")
    @camera_ns.response(HTTPStatus.LOCKED, "Camera config doesn't exist")
    @camera_ns.response(HTTPStatus.NOT_FOUND, "Camera config not found")
    @camera_ns.expect(camera_patch_parser)
    # Updates camera values of the currently selected camera
    def patch(self, camera_id):
        session_db = start_session()
        camera: Camera = session_db.query(Camera).filter_by(camera_id=camera_id).first()
        args = camera_patch_parser.parse_args()

        camera.update_cam_config(args)

        session_db.commit()
        session_db.close()
        return "Camera updated", HTTPStatus.OK

    @camera_ns.response(HTTPStatus.NO_CONTENT, "Camera deleted", camera_patch_model)
    @camera_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @camera_ns.response(HTTPStatus.BAD_REQUEST, "Missing fields or typed them incorrectly")
    @camera_ns.response(HTTPStatus.LOCKED, "Camera doesn't exist")
    @camera_ns.response(HTTPStatus.NOT_FOUND, "Camera not found")
    # Deleted currently selected camera
    def delete(self, camera_id):
        session_db = start_session()
        camera: Camera = session_db.query(Camera).filter_by(camera_id=camera_id).first()
        session_db.delete(camera)
        session_db.commit()
        session_db.close()
        return "Camera deleted", HTTPStatus.NO_CONTENT

    @camera_ns.response(HTTPStatus.OK, "Camera config correctly loaded", camera_patch_model)
    @camera_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @camera_ns.response(HTTPStatus.BAD_REQUEST, "Missing fields or typed them incorrectly")
    @camera_ns.response(HTTPStatus.LOCKED, "Camera config doesn't exist")
    @camera_ns.response(HTTPStatus.NOT_FOUND, "Camera config not found")
    # Fetches and returns camera config values from the currently selected camera
    def get(self, camera_id):
        session_db = start_session()

        # Fetch general cam config data
        camera: Camera = session_db.query(Camera).filter_by(camera_id=camera_id).first()

        if camera is None:
            return "Camera not found", HTTPStatus.NOT_FOUND

        all_cam_config = camera.get_cam_config()

        session_db.close()
        return all_cam_config, HTTPStatus.OK
