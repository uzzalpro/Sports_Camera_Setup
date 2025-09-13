from flask_restx import Resource
from data_classes.detector import Detector, detector_model, detector_ns, detector_patch_parser
from database.session import start_session
from http import HTTPStatus


# Handles POST and GET for detector route
@detector_ns.route("/detector")
class DetectorRes(Resource):
    @detector_ns.response(HTTPStatus.CREATED, "Detector correctly created", detector_model)
    @detector_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @detector_ns.response(HTTPStatus.BAD_REQUEST, "Missing required fields or fields have incorrect types")
    @detector_ns.response(HTTPStatus.UNPROCESSABLE_ENTITY, "Provided data is invalid")
    # Insert a detector row in the detectors table and return its id
    def post(self):
        session_db = start_session()
        new_detector: Detector = Detector()
        session_db.add(new_detector)
        session_db.commit()
        detector_id = new_detector.detector_id
        session_db.close()
        return str(detector_id), HTTPStatus.CREATED

    @detector_ns.response(HTTPStatus.OK, "Detectors correctly loaded", detector_model)
    @detector_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @detector_ns.response(HTTPStatus.BAD_REQUEST, "Missing fields or typed them incorrectly")
    @detector_ns.response(HTTPStatus.LOCKED, "Detector don't exist")
    @detector_ns.response(HTTPStatus.NOT_FOUND, "Detectors not found")
    # Fetch every detector data in the database as a list
    def get(self):
        session_db = start_session()
        detectors: Detector = session_db.query(Detector).all()

        detectors_data = [detector.get_config_id() for detector in detectors]

        session_db.close()
        return detectors_data, HTTPStatus.OK


# Handles PATCH and GET for config values of a specific detector
@detector_ns.route("/detector/<uuid:detector_id>")
class UpdateDetector(Resource):
    @detector_ns.response(HTTPStatus.OK, "Detector config correctly updated", detector_model)
    @detector_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @detector_ns.response(HTTPStatus.BAD_REQUEST, "Missing required fields or fields have incorrect types")
    @detector_ns.response(HTTPStatus.UNPROCESSABLE_ENTITY, "Provided data is invalid")
    @detector_ns.response(HTTPStatus.LOCKED, "Detector config doesn't exist")
    @detector_ns.response(HTTPStatus.NOT_FOUND, "Detector config not found")
    # Update detector config values of currently selected detector
    def patch(self, detector_id):
        session_db = start_session()
        detector: Detector = session_db.query(Detector).filter_by(detector_id=detector_id).first()
        args = detector_patch_parser.parse_args()

        detector.update_config(args)

        session_db.commit()
        session_db.close()
        return "Detector config updated", HTTPStatus.OK

    @detector_ns.response(HTTPStatus.NO_CONTENT, "Detector deleted", detector_model)
    @detector_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @detector_ns.response(HTTPStatus.BAD_REQUEST, "Missing fields or typed them incorrectly")
    @detector_ns.response(HTTPStatus.LOCKED, "Detector doesn't exist")
    @detector_ns.response(HTTPStatus.NOT_FOUND, "Detector not found")
    # Deleted currently selected camera
    def delete(self, detector_id):
        session_db = start_session()
        detector: Detector = session_db.query(Detector).filter_by(detector_id=detector_id).first()
        session_db.delete(detector)
        session_db.commit()
        session_db.close()
        return "Detector deleted", HTTPStatus.NO_CONTENT
