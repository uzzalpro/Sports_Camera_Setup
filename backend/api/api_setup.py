from flask_restx import Resource
from data_classes import Setup, Camera, Undistortion, SourcePoints, DestinationPoints
from database.session import start_session
from data_classes.setup import setup_list_model, setup_patch_model, setup_ns, setup_patch_parser, setup_post_parser
from data_classes.camera import camera_post_parser, camera_list_model
from http import HTTPStatus

# ============================
# ROUTE: /setup
# ============================
@setup_ns.route("/setup")
class SetupList(Resource):
    @setup_ns.response(HTTPStatus.CREATED, "Setup name created", setup_list_model)
    @setup_ns.response(HTTPStatus.CONFLICT, "Setup name already exists")
    @setup_ns.response(HTTPStatus.BAD_REQUEST, "Invalid or missing setup name")
    @setup_ns.expect(setup_post_parser)
    def post(self):
        """Create a new setup entry with a unique name."""
        session_db = start_session()
        args = setup_post_parser.parse_args()
        setup_name = args.get("setup_name", "").strip()

        # Validate setup name
        if not setup_name:
            session_db.close()
            return {"error": "Setup name is required"}, HTTPStatus.BAD_REQUEST

        # Check for duplicates
        existing = session_db.query(Setup).filter_by(setup_name=setup_name).first()
        if existing:
            session_db.close()
            return {"message": "Setup name already exists"}, HTTPStatus.CONFLICT

        # Create and insert new setup
        new_setup = Setup(setup_name=setup_name)
        session_db.add(new_setup)
        session_db.commit()
        setup_id = new_setup.setup_id
        session_db.close()

        return {"setup_id": str(setup_id)}, HTTPStatus.CREATED

    @setup_ns.response(HTTPStatus.OK, "List of setups returned", setup_list_model)
    def get(self):
        """Get all setups with ID and name."""
        session_db = start_session()
        setups = session_db.query(Setup).all()
        setups_data = [s.get_setup_id_name() for s in setups]
        session_db.close()
        return setups_data, HTTPStatus.OK

# ============================
# ROUTE: /setup/<uuid:setup_id>
# ============================
@setup_ns.route("/setup/<uuid:setup_id>")
class UpdateSetup(Resource):
    @setup_ns.response(HTTPStatus.OK, "Setup config updated", setup_patch_model)
    @setup_ns.response(HTTPStatus.NOT_FOUND, "Setup not found")
    @setup_ns.expect(setup_patch_parser)
    def patch(self, setup_id):
        """Update config values of a specific setup."""
        session_db = start_session()
        setup = session_db.query(Setup).filter_by(setup_id=setup_id).first()

        if not setup:
            session_db.close()
            return {"message": "Setup not found"}, HTTPStatus.NOT_FOUND

        args = setup_patch_parser.parse_args()
        setup.update_setup_config(args)

        session_db.commit()
        session_db.close()
        return {"message": "Setup config updated"}, HTTPStatus.OK

    @setup_ns.response(HTTPStatus.OK, "Setup config returned", setup_patch_model)
    @setup_ns.response(HTTPStatus.NOT_FOUND, "Setup not found")
    def get(self, setup_id):
        """Get config values of a specific setup."""
        session_db = start_session()
        setup = session_db.query(Setup).filter_by(setup_id=setup_id).first()

        if not setup:
            session_db.close()
            return {"message": "Setup not found"}, HTTPStatus.NOT_FOUND

        setup_config = setup.get_setup_config()
        session_db.close()
        return setup_config, HTTPStatus.OK

    @setup_ns.response(HTTPStatus.OK, "Setup and related data deleted")
    @setup_ns.response(HTTPStatus.NOT_FOUND, "Setup not found")
    @setup_ns.response(HTTPStatus.INTERNAL_SERVER_ERROR, "Error during deletion")
    def delete(self, setup_id):
        """Delete a setup along with its cameras, undistortions, and point mappings."""
        session_db = start_session()
        setup = session_db.query(Setup).filter_by(setup_id=setup_id).first()

        if not setup:
            session_db.close()
            return {"message": "Setup not found"}, HTTPStatus.NOT_FOUND

        try:
            # Delete child records manually (cascade not assumed)
            for camera in setup.cameras:
                session_db.query(Undistortion).filter_by(camera_id=camera.camera_id).delete()
                session_db.query(SourcePoints).filter_by(camera_id=camera.camera_id).delete()
                session_db.query(DestinationPoints).filter_by(camera_id=camera.camera_id).delete()
                session_db.delete(camera)

            session_db.delete(setup)
            session_db.commit()

            session_db.close()
            return {"message": "Setup deleted successfully"}, HTTPStatus.OK

        except Exception as e:
            session_db.rollback()
            session_db.close()
            return {"error": f"Deletion failed: {str(e)}"}, HTTPStatus.INTERNAL_SERVER_ERROR

# ============================
# ROUTE: /setup/<uuid:setup_id>/camera
# ============================
@setup_ns.route("/setup/<uuid:setup_id>/camera")
class CameraRes(Resource):
    @setup_ns.response(HTTPStatus.CREATED, "Camera created", camera_list_model)
    @setup_ns.response(HTTPStatus.BAD_REQUEST, "Missing camera name")
    @setup_ns.response(HTTPStatus.NOT_FOUND, "Setup not found")
    @setup_ns.expect(camera_post_parser)
    def post(self, setup_id):
        """Add a camera to a setup and initialize child tables."""
        session_db = start_session()
        args = camera_post_parser.parse_args()
        camera_name = args.get("camera_name", "").strip()

        if not camera_name:
            session_db.close()
            return {"error": "Camera name is required"}, HTTPStatus.BAD_REQUEST

        setup = session_db.query(Setup).filter_by(setup_id=setup_id).first()
        if not setup:
            session_db.close()
            return {"message": "Setup not found"}, HTTPStatus.NOT_FOUND

        # Add new camera
        new_camera = Camera(camera_name=camera_name, setup_id=setup_id)
        session_db.add(new_camera)
        session_db.flush()  # Get generated camera_id
        camera_id = new_camera.camera_id

        # Add related rows
        session_db.add(Undistortion(camera_id=camera_id))
        for i in range(4):
            session_db.add(SourcePoints(camera_id=camera_id, index=i + 1))
            session_db.add(DestinationPoints(camera_id=camera_id, index=i + 1))

        session_db.commit()
        session_db.close()
        return {"camera_id": str(camera_id)}, HTTPStatus.CREATED

    @setup_ns.response(HTTPStatus.OK, "Cameras fetched", camera_list_model)
    @setup_ns.response(HTTPStatus.NOT_FOUND, "Setup not found")
    def get(self, setup_id):
        """Get all cameras associated with a setup."""
        session_db = start_session()
        setup = session_db.query(Setup).filter_by(setup_id=setup_id).first()

        if not setup:
            session_db.close()
            return {"message": "Setup not found"}, HTTPStatus.NOT_FOUND

        cameras_data = [cam.get_cam_id_name() for cam in setup.cameras]
        session_db.close()
        return cameras_data, HTTPStatus.OK
