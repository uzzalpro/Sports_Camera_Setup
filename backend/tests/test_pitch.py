import uuid
from http import HTTPStatus


def test_put_and_get_pitch_points(client):
    # Create Setup
    response = client.post("/api/setup", data={"setup_name": "Pitch Test Setup"})
    setup_id = uuid.UUID(response.get_data(as_text=True).strip().strip('"'))

    # Create Camera under Setup
    camera_data = {"camera_name": "Pitch Test Camera"}
    response = client.post(f"/api/setup/{setup_id}/camera", json=camera_data)
    camera_id = uuid.UUID(response.get_data(as_text=True).strip().strip('"'))

    # Pitch points payload: list of two lists: inner points and outer points
    pitch_points = [
        [  # inner points
            {"x": 1, "y": 2},
            {"x": 3, "y": 4},
        ],
        [  # outer points
            {"x": 5, "y": 6},
            {"x": 7, "y": 8},
        ],
    ]

    # PUT pitch points
    response = client.put(f"/api/camera/{camera_id}/pitch", json=pitch_points)
    assert response.status_code == HTTPStatus.OK
    assert response.get_json() == "Pitch points updated"

    # GET camera data back (assuming GET returns pitch points in camera)
    response = client.get(f"/api/camera/{camera_id}")
    assert response.status_code == HTTPStatus.OK
    data = response.get_json()

    inner_points = data.get("inner_points")
    outer_points = data.get("outer_points")
    assert inner_points is not None and len(inner_points) == 2
    assert outer_points is not None and len(outer_points) == 2

    assert inner_points[0]["x"] == 1
    assert inner_points[1]["y"] == 4
    assert outer_points[0]["x"] == 5
    assert outer_points[1]["y"] == 8
