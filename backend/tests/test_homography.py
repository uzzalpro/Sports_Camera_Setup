import uuid
from http import HTTPStatus


def test_put_and_get_homography_points(client):
    # Create Setup
    response = client.post("/api/setup", data={"setup_name": "Homography Test Setup"})
    setup_id = uuid.UUID(response.get_data(as_text=True).strip().strip('"'))

    # Create Camera under Setup
    camera_data = {"camera_name": "Homography Test Camera"}
    response = client.post(f"/api/setup/{setup_id}/camera", json=camera_data)
    camera_id = uuid.UUID(response.get_data(as_text=True).strip().strip('"'))

    # Homography points payload with 4 points each
    homography_points = [
        {  # source points keyed by index as string
            "1": {"x": 10, "y": 20},
            "2": {"x": 30, "y": 40},
            "3": {"x": 50, "y": 60},
            "4": {"x": 70, "y": 80},
        },
        {  # destination points keyed by index as string
            "1": {"x": 90, "y": 100},
            "2": {"x": 110, "y": 120},
            "3": {"x": 130, "y": 140},
            "4": {"x": 150, "y": 160},
        }
    ]

    # PUT homography points
    response = client.put(f"/api/camera/{camera_id}/homography", json=homography_points)
    assert response.status_code == HTTPStatus.OK
    assert response.get_json() == "Homography points updated"

    # GET camera data back (assuming GET returns homography points in camera)
    response = client.get(f"/api/camera/{camera_id}")
    assert response.status_code == HTTPStatus.OK
    data = response.get_json()

    source_points = data.get("source_points")
    destination_points = data.get("destination_points")

    assert source_points is not None and len(source_points) == 4
    assert destination_points is not None and len(destination_points) == 4

    assert source_points["1"]["x"] == 10
    assert source_points["2"]["y"] == 40
    assert destination_points["1"]["x"] == 90
    assert destination_points["2"]["y"] == 120
