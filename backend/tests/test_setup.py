# test_setup_api.py
import uuid
from http import HTTPStatus
import datetime
from data_classes.setup import Setup


def test_create_and_get_setup(client):
    response = client.post("/api/setup", json={"setup_name": "Test Setup"})
    assert response.status_code == HTTPStatus.CREATED
    raw_id = response.get_data(as_text=True).strip().strip('"')
    setup_id = uuid.UUID(raw_id)

    response = client.get("/api/setup")
    assert response.status_code == HTTPStatus.OK
    setups = response.get_json()
    assert any(s["setup_id"] == str(setup_id) and s["setup_name"] == "Test Setup" for s in setups)


def test_update_setup_directly(db_session):
    # create setup with ORM, e.g.:
    new_setup = Setup(setup_name="Config Setup")
    db_session.add(new_setup)
    db_session.commit()

    # update with datetime objects directly
    new_setup.device_type = "Drone"
    new_setup.timestamp_start = datetime.datetime.fromisoformat("2024-01-01T00:00:00")
    new_setup.timestamp_end = datetime.datetime.fromisoformat("2024-01-01T01:00:00")
    new_setup.debug_visualize = True
    db_session.commit()

    # query and assert updated values
    updated = db_session.query(Setup).filter_by(setup_id=new_setup.setup_id).one()
    assert updated.device_type == "Drone"
    assert updated.debug_visualize is True
