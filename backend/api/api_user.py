from flask_restx import Resource
from flask import request, make_response
from data_classes import User
from database.session import start_session
from http import HTTPStatus
from data_classes.user import user_ns, user_post_parser
from settings import SECRET_KEY
import bcrypt
import jwt
import datetime


@user_ns.route("/user")
class UserRes(Resource):
    @user_ns.response(HTTPStatus.CREATED, "User data correctly created")
    @user_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @user_ns.response(HTTPStatus.BAD_REQUEST, "Missing required fields or fields have incorrect types")
    @user_ns.response(HTTPStatus.UNPROCESSABLE_ENTITY, "Provided data is invalid")
    @user_ns.expect(user_post_parser)
    # Insert a user with their data in the users table
    def post(self):
        session_db = start_session()
        args = user_post_parser.parse_args()
        # Hash the password
        bytes = args["password"].encode('utf-8')
        salt = bcrypt.gensalt()
        hash = bcrypt.hashpw(bytes, salt)

        new_user: User = User(
            email=args["email"],
            username=args["username"],
            password=hash
        )
        session_db.add(new_user)
        session_db.commit()
        session_db.close()
        return "User Added", HTTPStatus.CREATED


@user_ns.route("/user/login")
class UserLogin(Resource):
    @user_ns.response(HTTPStatus.OK, "User correctly logged in")
    @user_ns.response(HTTPStatus.UNAUTHORIZED, "Token is invalid")
    @user_ns.response(HTTPStatus.BAD_REQUEST, "Missing fields or typed them incorrectly")
    @user_ns.response(HTTPStatus.LOCKED, "User data doesn't exist")
    @user_ns.response(HTTPStatus.NOT_FOUND, "User data not found")
    # Returns access token as a cookie if given username and password match
    def post(self):
        session_db = start_session()
        data = request.get_json()

        user: User = session_db.query(User).filter_by(username=data["username"]).first()

        # Check if user password matches with given password
        if bcrypt.checkpw(data["password"].encode("utf-8"), user.password):
            # Make an authorization token from userdata
            token = jwt.encode({
                'sub': data["username"],
                'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
            }, SECRET_KEY, algorithm='HS256')

            resp = make_response({"msg": "Logged in"})

            resp.set_cookie('access_token', token, httponly=True, secure=True, samesite='Strict')
            return resp, HTTPStatus.OK
