from flask import Blueprint

drive_time_bp = Blueprint('drive_time_bp', __name__)

from . import routes
