import uuid
from http import HTTPStatus


def test_post_detector(client):
    # Create a new detector via POST
    response = client.post("/api/detector")
    assert response.status_code == HTTPStatus.CREATED

    # The response should be a UUID string (strip quotes)
    detector_id_str = response.get_data(as_text=True).strip().strip('"')
    uuid.UUID(detector_id_str)  # should not raise


def test_get_detectors(client):
    # Create a detector first so GET has something to return
    post_resp = client.post("/api/detector")
    assert post_resp.status_code == HTTPStatus.CREATED

    # Now GET all detectors
    get_resp = client.get("/api/detector")
    assert get_resp.status_code == HTTPStatus.OK

    detectors_list = get_resp.get_json()
    assert isinstance(detectors_list, list)

    # Each element is expected to be a dict with an 'id' key containing UUID string
    for detector_item in detectors_list:
        detector_id_str = detector_item['id'] if isinstance(detector_item, dict) else detector_item
        uuid.UUID(detector_id_str)  # should not raise


def test_patch_detector(client):
    # Create a detector to update
    post_resp = client.post("/api/detector")
    detector_id_str = post_resp.get_data(as_text=True).strip().strip('"')
    detector_id = uuid.UUID(detector_id_str)

    # Update config
    patch_data = {
        "model_name": "yolo",
        "image_size": 2,
    }

    # Now patch that detector (example payload)
    patch_resp = client.patch(f"/api/detector/{detector_id}", data=patch_data)
    assert patch_resp.status_code == HTTPStatus.OK

    # Try to verify (optional if GET by id is unsupported)
    get_resp = client.get("/api/detector")
    assert get_resp.status_code == HTTPStatus.OK
    all_detectors = get_resp.get_json()

    # Find our detector
    updated = next((d for d in all_detectors if str(d["id"]) == str(detector_id)), None)
    assert updated is not None
    for key, value in patch_data.items():
        assert updated["config"][key] == value
