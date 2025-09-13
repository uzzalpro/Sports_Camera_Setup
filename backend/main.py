from flask import Flask, jsonify
from flask_cors import CORS
from settings import SECRET_KEY
from flask_restx import Api
from api import setup_ns, detector_ns, team_detector_ns, camera_ns, field_ns, point_ns, undistortion_ns, crop_ns, undistort_points_ns, user_ns, cam_cfg_path_ns
import os

app = Flask(__name__)
app.secret_key = SECRET_KEY
app.json.sort_keys = False  # Prevents json from being alphabetically sorted

# CORS allows communication between different origins (localhost:5000 & localhost:3000)
# supports_credentials includes cookies or other credentials
CORS(app, supports_credentials=True)

api = Api(app)  # Initializes API

# Add different API namespaces to main backend file
api.add_namespace(setup_ns, path="/api")
api.add_namespace(detector_ns, path="/api")
api.add_namespace(team_detector_ns, path="/api")
api.add_namespace(camera_ns, path="/api")
api.add_namespace(field_ns, path="/api")
api.add_namespace(point_ns, path="/api")
api.add_namespace(undistortion_ns, path="/api")
api.add_namespace(crop_ns, path="/api")
api.add_namespace(undistort_points_ns, path="/api")
api.add_namespace(user_ns, path="/api")
api.add_namespace(cam_cfg_path_ns, path="/api")

# ==========================
# Error Handlers
# ==========================
@app.errorhandler(404)
def not_found_error(error):
    """Handler for 404 Not Found errors."""
    return jsonify({"error": "Resource not found"}), 404


@app.errorhandler(500)
def internal_server_error(error):
    """Handler for 500 Internal Server Error."""
    return jsonify({"error": "Internal server error"}), 500



if __name__ == "__main__":
    host = os.getenv("FLASK_HOST")
    app.run(debug=True, host=host, port=5000)
