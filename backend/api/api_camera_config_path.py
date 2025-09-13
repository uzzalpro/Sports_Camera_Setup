from azure.storage.blob import BlobServiceClient
from azure.core.exceptions import ResourceExistsError
from flask_restx import Resource, Namespace
from flask import request, Response
from database.session import start_session
from data_classes import Camera
from data_classes.camera import camera_config_img_path_parser
import os
from http import HTTPStatus

STORAGE_ACCOUNT_CONNECTION = os.getenv('STORAGE_ACCOUNT_CONNECTION')
STORAGE_ACCOUNT_CONTAINER = os.getenv('STORAGE_ACCOUNT_CONTAINER')


blob_service_client = BlobServiceClient.from_connection_string(STORAGE_ACCOUNT_CONNECTION)
container_client = blob_service_client.get_container_client(STORAGE_ACCOUNT_CONTAINER)

def ensure_container():
    try:
        container_client.create_container()
    except ResourceExistsError:
        pass
    except Exception as e:
        print("Container creation failed:", e)



cam_cfg_path_ns = Namespace("cam_cfg_path", description="Fetching and Uploading Blob images")


@cam_cfg_path_ns.route("/camera/<uuid:camera_id>/cam_cfg_path")
class CamCfgPathRes(Resource):
    @cam_cfg_path_ns.response(HTTPStatus.CREATED, "Setup name correctly created")
    @cam_cfg_path_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @cam_cfg_path_ns.response(HTTPStatus.BAD_REQUEST, "Missing required fields or fields have incorrect types")
    @cam_cfg_path_ns.response(HTTPStatus.UNPROCESSABLE_ENTITY, "Provided data is invalid")
    @cam_cfg_path_ns.expect(camera_config_img_path_parser)
    # Updates the camera config img path and saves a blob for the img

    def post(self, camera_id):
        session_db = start_session()
        camera = session_db.query(Camera).filter_by(camera_id=camera_id).first()

        image = request.files["image"]
        setup_name = request.form.get("setup")
        camera_name = request.form.get("camera")
        config_path = setup_name.lower().replace(" ", "_") + "/" + camera_name.lower().replace(" ", "_")
        camera.update_config_img_path(config_path)

        ensure_container()  # Make sure the container exists

        try:
            blob_client = container_client.get_blob_client(config_path)
            blob_client.upload_blob(image.stream, overwrite=True)

            session_db.commit()
            session_db.close()
            return {"message": "Image uploaded successfully"}, 201

        except Exception as e:
            session_db.close()
            return {"error": f"Blob upload failed: {str(e)}"}, 500



        # session_db.commit()
        # session_db.close()
        # return "Cam config img path uploaded"

    @cam_cfg_path_ns.response(HTTPStatus.OK, "Camera config path correctly loaded")
    @cam_cfg_path_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @cam_cfg_path_ns.response(HTTPStatus.BAD_REQUEST, "Missing fields or typed them incorrectly")
    @cam_cfg_path_ns.response(HTTPStatus.LOCKED, "Camera config path doesn't exist")
    @cam_cfg_path_ns.response(HTTPStatus.NOT_FOUND, "Camera config path not found")
    # Get the image blob using camera config img path
    def get(self, camera_id):
        session_db = start_session()
        camera: Camera = session_db.query(Camera).filter_by(camera_id=camera_id).first()

        config_path = camera.config_img_path
        if camera.config_img_path != "":

            # Download the correct blob
            blob_client = blob_service_client.get_blob_client(container=STORAGE_ACCOUNT_CONTAINER, blob=config_path)
            data = blob_client.download_blob().readall()

            session_db.close()
            return Response(
                data,
                mimetype='image/png',
                headers={"Content-Disposition": 'inline'}
            )
