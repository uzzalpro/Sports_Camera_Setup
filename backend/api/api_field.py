from flask_restx import Resource
from data_classes.field import Field, field_model, field_ns, field_patch_parser
from database.session import start_session
from http import HTTPStatus


# Handles POST and GET for field route
@field_ns.route("/field")
class FieldRes(Resource):
    @field_ns.response(HTTPStatus.CREATED, "Field correctly created", field_model)
    @field_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @field_ns.response(HTTPStatus.BAD_REQUEST, "Missing required fields or fields have incorrect types")
    @field_ns.response(HTTPStatus.UNPROCESSABLE_ENTITY, "Provided data is invalid")
    # Insert a field row in the fields table and return its id
    def post(self):
        session_db = start_session()
        new_field: Field = Field()
        session_db.add(new_field)
        session_db.commit()
        field_id = new_field.field_id
        session_db.close()
        return str(field_id), HTTPStatus.CREATED

    @field_ns.response(HTTPStatus.OK, "Fields correctly loaded", field_model)
    @field_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @field_ns.response(HTTPStatus.BAD_REQUEST, "Missing fields or typed them incorrectly")
    @field_ns.response(HTTPStatus.LOCKED, "Field don't exist")
    @field_ns.response(HTTPStatus.NOT_FOUND, "Fields not found")
    # Fetch every field data in the database as a list
    def get(self):
        session_db = start_session()
        fields: Field = session_db.query(Field).all()

        fields_data = [field.get_config_id() for field in fields]

        session_db.close()
        return fields_data, HTTPStatus.OK


# Handles PATCH and GET for config values of a specific detector
@field_ns.route("/field/<uuid:field_id>")
class UpdateField(Resource):
    @field_ns.response(HTTPStatus.OK, "Detector config correctly updated", field_model)
    @field_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @field_ns.response(HTTPStatus.BAD_REQUEST, "Missing required fields or fields have incorrect types")
    @field_ns.response(HTTPStatus.UNPROCESSABLE_ENTITY, "Provided data is invalid")
    @field_ns.response(HTTPStatus.LOCKED, "Detector config doesn't exist")
    @field_ns.response(HTTPStatus.NOT_FOUND, "Detector config not found")
    # Update field config values of currently selected detector
    def patch(self, field_id):
        session_db = start_session()
        field: Field = session_db.query(Field).filter_by(field_id=field_id).first()
        args = field_patch_parser.parse_args()

        field.update_config(args)

        session_db.commit()
        session_db.close()
        return "Field config updated", HTTPStatus.OK

    @field_ns.response(HTTPStatus.NO_CONTENT, "Field deleted", field_model)
    @field_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @field_ns.response(HTTPStatus.BAD_REQUEST, "Missing fields or typed them incorrectly")
    @field_ns.response(HTTPStatus.LOCKED, "Field doesn't exist")
    @field_ns.response(HTTPStatus.NOT_FOUND, "Field not found")
    # Deleted currently selected camera
    def delete(self, field_id):
        session_db = start_session()
        field: Field = session_db.query(Field).filter_by(field_id=field_id).first()
        session_db.delete(field)
        session_db.commit()
        session_db.close()
        return "Field deleted", HTTPStatus.NO_CONTENT
