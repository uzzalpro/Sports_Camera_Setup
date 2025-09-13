import uuid
from http import HTTPStatus


def test_update_and_get_camera(client):
    # Create Setup
    response = client.post("/api/setup", data={"setup_name": "Update Camera Setup"})
    raw_setup_id = response.get_data(as_text=True).strip().strip('"')
    setup_id = uuid.UUID(raw_setup_id)

    # Create Camera - use correct URL and correct key "name"
    camera_data = {
        "camera_name": "Camera to Update"
    }
    response = client.post(f"/api/setup/{setup_id}/camera", json=camera_data)
    raw_camera_id = response.get_data(as_text=True).strip().strip('"')
    camera_id = uuid.UUID(raw_camera_id)

    # Update Camera
    patch_data = {
        "resolution_width": 1280,
        "resolution_height": 720,
        "position": "Back",
        "cropping_type": "TypeB",
        "time_correction": 5,
    }
    response = client.patch(f"/api/camera/{camera_id}", json=patch_data)
    assert response.status_code == HTTPStatus.OK
    assert response.get_json() == "Camera updated"  # Fixed to parse JSON string

    # Get the updated Camera config
    response = client.get(f"/api/camera/{camera_id}")
    assert response.status_code == HTTPStatus.OK
    config = response.get_json().get("config")
    assert config["resolution_width"] == 1280
    assert config["resolution_height"] == 720
    assert config["position"] == "Back"
    assert config["cropping_type"] == "TypeB"
    assert config["time_correction"] == 5


def test_delete_camera(client):
    # Create Setup
    response = client.post("/api/setup", data={"setup_name": "Delete Camera Setup"})
    raw_setup_id = response.get_data(as_text=True).strip().strip('"')
    setup_id = uuid.UUID(raw_setup_id)

    # Create Camera - correct URL and correct key "name"
    camera_data = {
        "camera_name": "Camera to Delete"
    }
    response = client.post(f"/api/setup/{setup_id}/camera", json=camera_data)
    raw_camera_id = response.get_data(as_text=True).strip().strip('"')
    camera_id = uuid.UUID(raw_camera_id)

    # Delete Camera
    response = client.delete(f"/api/camera/{camera_id}")
    assert response.status_code == HTTPStatus.NO_CONTENT
    assert response.get_data(as_text=True) == ""  # Fixed to expect empty body on 204 No Content

    # Verify camera is deleted by attempting to get it
    response = client.get(f"/api/camera/{camera_id}")
    assert response.status_code == HTTPStatus.NOT_FOUND
