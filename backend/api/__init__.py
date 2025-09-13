# This file allows importing all namespaces from one location

from .api_camera import camera_ns
from .api_detector import detector_ns
from .api_setup import setup_ns
from .api_team_detector import team_detector_ns
from .api_field import field_ns
from .api_camera_undistortion import undistortion_ns
from .api_camera_crop import crop_ns
from .api_camera_homography import point_ns
from .api_camera_pitch import point_ns
from .api_undistort_points import undistort_points_ns
from .api_setup_all_config import setup_ns
from .api_user import user_ns
from .api_camera_config_path import cam_cfg_path_ns

__all__ = ["camera_ns", "detector_ns", "setup_ns", "team_detector_ns", "field_ns",
           "crop_ns", "point_ns", "undistortion_ns", "undistort_points_ns", "user_ns", "cam_cfg_path_ns"]
