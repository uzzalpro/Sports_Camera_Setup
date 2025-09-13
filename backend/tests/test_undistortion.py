import uuid
from http import HTTPStatus


def test_put_undistortion_params(client):
    # Create Setup
    response = client.post("/api/setup", data={"setup_name": "Undistortion Test Setup"})
    setup_id = uuid.UUID(response.get_data(as_text=True).strip().strip('"'))

    # Create Camera under Setup
    camera_data = {"camera_name": "Undistortion Test Camera"}
    response = client.post(f"/api/setup/{setup_id}/camera", json=camera_data)
    camera_id = uuid.UUID(response.get_data(as_text=True).strip().strip('"'))

    # Undistortion parameters payload
    undistortion_payload = {
        "x": 55.0,
        "y": 45.0,
        "w": 60.0,
        "h": 65.0,
        "k1": 0.01,
        "k2": -0.01,
        "k3": 0.001,
        "p1": 0.002,
        "p2": -0.002,
        "zoom": 1.5
    }

    # PUT undistortion parameters
    response = client.put(f"/api/camera/{camera_id}/undistortion", json=undistortion_payload)
    assert response.status_code == HTTPStatus.OK
    assert response.get_json() == "Undistortion params updated"

    # GET camera data back (assuming GET returns undistortion data under camera)
    response = client.get(f"/api/camera/{camera_id}")
    assert response.status_code == HTTPStatus.OK
    data = response.get_json()

    undistortion_data = data.get("undistortion")
    assert undistortion_data is not None

    for key, value in undistortion_payload.items():
        assert key in undistortion_data
        assert undistortion_data[key] == value
