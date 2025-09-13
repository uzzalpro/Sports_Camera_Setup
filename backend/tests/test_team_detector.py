import uuid
from http import HTTPStatus


def test_post_team_detector(client):
    # Create a new detector via POST
    response = client.post("/api/team-detector")
    assert response.status_code == HTTPStatus.CREATED

    # The response should be a UUID string (strip quotes)
    team_detector_id_str = response.get_data(as_text=True).strip().strip('"')
    uuid.UUID(team_detector_id_str)  # should not raise


def test_get_team_detectors(client):
    # Create a detector first so GET has something to return
    post_resp = client.post("/api/team-detector")
    assert post_resp.status_code == HTTPStatus.CREATED

    # Now GET all detectors
    get_resp = client.get("/api/team-detector")
    assert get_resp.status_code == HTTPStatus.OK

    team_detectors_list = get_resp.get_json()
    assert isinstance(team_detectors_list, list)

    # Each element is expected to be a dict with an 'id' key containing UUID string
    for team_detector_item in team_detectors_list:
        team_detector_id_str = team_detector_item['id'] if isinstance(team_detector_item, dict) else team_detector_item
        uuid.UUID(team_detector_id_str)  # should not raise


def test_patch_team_detector(client):
    # Create a new team detector
    post_resp = client.post("/api/team-detector")
    assert post_resp.status_code == HTTPStatus.CREATED

    # Extract UUID from response
    team_detector_id_str = post_resp.get_data(as_text=True).strip().strip('"')
    team_detector_id = uuid.UUID(team_detector_id_str)

    # Define values to patch
    patch_data = {
        "type": "YOLOv5",
        "model_name": "model-v1.2",
        "use_hsl": True,
        "old_dual_head": True
    }

    # Send PATCH request
    patch_resp = client.patch(
        f"/api/team-detector/{team_detector_id}",
        data=patch_data  # form-data format
    )
    assert patch_resp.status_code == HTTPStatus.OK

    # Fetch all team detectors
    get_resp = client.get("/api/team-detector")
    assert get_resp.status_code == HTTPStatus.OK
    all_detectors = get_resp.get_json()

    # Locate the updated detector
    updated = next((d for d in all_detectors if str(d["id"]) == str(team_detector_id)), None)
    assert updated is not None

    # Validate the config fields were updated correctly
    for key, value in patch_data.items():
        assert updated["config"][key] == value
