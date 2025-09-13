import uuid
from http import HTTPStatus


def test_put_and_get_crop_points(client):
    # Create Setup
    response = client.post("/api/setup", data={"setup_name": "Crop Test Setup"})
    setup_id = uuid.UUID(response.get_data(as_text=True).strip().strip('"'))

    # Create Camera under Setup
    camera_data = {"camera_name": "Crop Test Camera"}
    response = client.post(f"/api/setup/{setup_id}/camera", json=camera_data)
    camera_id = uuid.UUID(response.get_data(as_text=True).strip().strip('"'))

    # Crop points payload
    crop_points = [
        {"top_left_x": 10, "top_left_y": 20, "bottom_right_x": 100, "bottom_right_y": 200},
        {"top_left_x": 110, "top_left_y": 120, "bottom_right_x": 200, "bottom_right_y": 300},
    ]

    # PUT crop points (correct URL)
    response = client.put(f"/api/camera/{camera_id}/crop", json=crop_points)
    assert response.status_code == HTTPStatus.OK
    assert response.get_json() == "Crops updated"

    # GET crop points back
    response = client.get(f"/api/camera/{camera_id}")
    assert response.status_code == HTTPStatus.OK
    crops = response.get_json().get("crops")
    assert crops is not None
    assert len(crops) == 2
    assert crops[0]["top_left_x"] == 10
    assert crops[1]["bottom_right_y"] == 300
