from flask_restx import Resource
from data_classes.setup import setup_ns
from http import HTTPStatus
from database.session import start_session
from data_classes import Setup, Detector, TeamDetector, Field, Camera


@setup_ns.route("/setup/<uuid:setup_id>/all-config")
class SetupAllConfig(Resource):
    # Return all the config info from a certain setup as a JSON
    @setup_ns.response(HTTPStatus.OK, "Setup all config correctly loaded")
    @setup_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @setup_ns.response(HTTPStatus.BAD_REQUEST, "Missing fields or typed them incorrectly")
    @setup_ns.response(HTTPStatus.LOCKED, "Setup all config don't exist")
    @setup_ns.response(HTTPStatus.NOT_FOUND, "Setup all config not found")
    def get(self, setup_id):
        session_db = start_session()

        all_config = {}

        setup: Setup = session_db.query(Setup).filter_by(setup_id=setup_id).first()

        cameras: Camera = setup.cameras
        camera_list = []

        for camera in cameras:
            camera_all_config = {
                "id": str(camera.camera_id),
                "resolution": [camera.resolution_width, camera.resolution_height],
                "position": camera.position,
                "field": {
                    "line_points": [[point.x, point.y] for point in camera.inner_points],
                    "outer_points": [[point.x, point.y] for point in camera.outer_points]
                },
                "homography": {
                    "source": {
                        "points": [[point.x, point.y] for point in camera.source_points]
                    },
                    "destination": {
                        "points": [[point.x, point.y] for point in camera.destination_points]
                    },
                },
                "distortion": {
                    "center": [camera.undistortion.x, camera.undistortion.y],
                    "length": [camera.undistortion.w, camera.undistortion.h],
                    "param": [camera.undistortion.k1, camera.undistortion.k2, camera.undistortion.k3,
                            camera.undistortion.p1, camera.undistortion.p2],
                    "zoom": camera.undistortion.zoom
                },
                "cropping": {
                    "type": camera.cropping_type,
                    "crops_xyxy": [
                        [[crop.top_left_x, crop.top_left_y], [crop.bottom_right_x, crop.bottom_right_y]]
                        for crop in camera.crops
                    ]
                },
                "path": camera.path,
                "time_format": "%Y%m%d-%H%M%S",
                "time_correction": camera.time_correction
            }
            camera_list.append(camera_all_config)

        all_config["cameras"] = camera_list

        detector: Detector = setup.detector
        all_config["detector"] = detector.get_config_id()["config"] if detector is not None else {}

        all_config["device"] = setup.device_type

        field: Field = setup.field
        all_config["field_model"] = {
            "dimensions": [field.pitch_width, field.pitch_height],
            "path": [field.path],
            "left_top_corner": [field.left_top_x, field.left_top_y],
            "right_bottom_corner": [field.right_bottom_x, field.right_bottom_y]
        } if field is not None else {}

        all_config["output"] = {
            "path": setup.output_path,
            "extract_data_path": setup.extract_data_path,
            "fps": setup.output_fps
        }
        all_config["timestamps"] = {
            "start": str(setup.timestamp_start),
            "end": str(setup.timestamp_end),
            "format": "%Y-%m-%d %H:%M:%S"
        }
        all_config["debug"] = {
            "visualize": setup.debug_visualize
        }

        all_config["stop_team_after"] = setup.stop_team_after
        all_config["tracker_type"] = setup.tracker_type

        team_detector: TeamDetector = setup.team_detector
        all_config["team_detector"] = team_detector.get_config_id()["config"] if team_detector is not None else {}

        return all_config
