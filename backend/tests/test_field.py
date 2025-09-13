import uuid
from http import HTTPStatus


def test_post_field(client):
    # Create a new field via POST
    response = client.post("/api/field")
    assert response.status_code == HTTPStatus.CREATED

    # The response should be a UUID string
    field_id_str = response.get_data(as_text=True).strip().strip('"')
    uuid.UUID(field_id_str)  # should not raise


def test_get_fields(client):
    # Create a field first
    post_resp = client.post("/api/field")
    assert post_resp.status_code == HTTPStatus.CREATED

    # Now GET all fields
    get_resp = client.get("/api/field")
    assert get_resp.status_code == HTTPStatus.OK

    fields_list = get_resp.get_json()
    assert isinstance(fields_list, list)

    # Each element should be a dict with a UUID string
    for field_item in fields_list:
        field_id_str = field_item['id'] if isinstance(field_item, dict) else field_item
        uuid.UUID(field_id_str)  # should not raise


def test_patch_field(client):
    # Create a field to update
    post_resp = client.post("/api/field")
    field_id_str = post_resp.get_data(as_text=True).strip().strip('"')
    field_id = uuid.UUID(field_id_str)

    # Update some field values
    patch_data = {
        "pitch_width": 100,
        "pitch_height": 200,
        "left_top_x": 10,
        "left_top_y": 20,
        "right_bottom_x": 300,
        "right_bottom_y": 400
    }

    # PATCH request (must use data= for form and correct headers)
    patch_resp = client.patch(f"/api/field/{field_id}", data=patch_data)
    assert patch_resp.status_code == HTTPStatus.OK

    # GET all and find the updated one
    get_resp = client.get("/api/field")
    assert get_resp.status_code == HTTPStatus.OK
    all_fields = get_resp.get_json()

    # Find our updated field by ID
    updated = next((f for f in all_fields if str(f.get("id", f)) == str(field_id)), None)
    assert updated is not None

    # Find our detector
    updated = next((d for d in all_fields if str(d["id"]) == str(field_id)), None)
    assert updated is not None
    for key, value in patch_data.items():
        assert updated["config"][key] == value
