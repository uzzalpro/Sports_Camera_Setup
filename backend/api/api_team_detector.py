from flask_restx import Resource
from data_classes.team_detector import TeamDetector, team_detector_model, team_detector_ns, team_detector_patch_parser
from database.session import start_session
from http import HTTPStatus


# Handles POST and GET for team detector route
@team_detector_ns.route("/team-detector")
class TeamDetectorRes(Resource):
    @team_detector_ns.response(HTTPStatus.CREATED, "Team detector correctly created", team_detector_model)
    @team_detector_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @team_detector_ns.response(HTTPStatus.BAD_REQUEST, "Missing required fields or fields have incorrect types")
    @team_detector_ns.response(HTTPStatus.UNPROCESSABLE_ENTITY, "Provided data is invalid")
    # Insert a team detector row in the team_detectors table
    def post(self):
        session_db = start_session()
        new_team_detector: TeamDetector = TeamDetector()
        session_db.add(new_team_detector)
        session_db.commit()
        team_detector_id = new_team_detector.team_detector_id
        session_db.close()
        return str(team_detector_id), HTTPStatus.CREATED

    @team_detector_ns.response(HTTPStatus.OK, "Team detectors correctly loaded", team_detector_model)
    @team_detector_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @team_detector_ns.response(HTTPStatus.BAD_REQUEST, "Missing fields or typed them incorrectly")
    @team_detector_ns.response(HTTPStatus.LOCKED, "Team detector don't exist")
    @team_detector_ns.response(HTTPStatus.NOT_FOUND, "Team detectors not found")
    # Fetch every team detector data in the database as a list
    def get(self):
        session_db = start_session()
        team_detectors: TeamDetector = session_db.query(TeamDetector).all()

        team_detectors_data = [team_detector.get_config_id() for team_detector in team_detectors]

        session_db.close()
        return team_detectors_data, HTTPStatus.OK


# Handles PATCH and GET for config values of a specific team detector
@team_detector_ns.route("/team-detector/<uuid:team_detector_id>")
class UpdateTeamDetector(Resource):
    @team_detector_ns.response(HTTPStatus.OK, "Team detector config correctly updated", team_detector_model)
    @team_detector_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @team_detector_ns.response(HTTPStatus.BAD_REQUEST, "Missing required fields or fields have incorrect types")
    @team_detector_ns.response(HTTPStatus.UNPROCESSABLE_ENTITY, "Provided data is invalid")
    @team_detector_ns.response(HTTPStatus.LOCKED, "Team detector config doesn't exist")
    @team_detector_ns.response(HTTPStatus.NOT_FOUND, "Team detector config not found")    # Insert team detector config values in row of currently selected team detector
    # Update team detector config values of currently selected team detector
    def patch(self, team_detector_id):
        session_db = start_session()
        team_detector: TeamDetector = session_db.query(TeamDetector).filter_by(team_detector_id=team_detector_id).first()
        args = team_detector_patch_parser.parse_args()

        team_detector.update_config(args)

        session_db.commit()
        session_db.close()
        return "Team Detector config updated", HTTPStatus.OK

    @team_detector_ns.response(HTTPStatus.NO_CONTENT, "Team detector deleted", team_detector_model)
    @team_detector_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @team_detector_ns.response(HTTPStatus.BAD_REQUEST, "Missing fields or typed them incorrectly")
    @team_detector_ns.response(HTTPStatus.LOCKED, "Team detector doesn't exist")
    @team_detector_ns.response(HTTPStatus.NOT_FOUND, "Team detector not found")
    # Deleted currently selected camera
    def delete(self, team_detector_id):
        session_db = start_session()
        team_detector: TeamDetector = session_db.query(TeamDetector).filter_by(team_detector_id=team_detector_id).first()
        session_db.delete(team_detector)
        session_db.commit()
        session_db.close()
        return "Team detector deleted", HTTPStatus.NO_CONTENT
