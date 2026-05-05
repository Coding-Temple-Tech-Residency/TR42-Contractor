from flask import Blueprint

photos_bp = Blueprint('photos_bp', __name__)

from . import routes  # noqa: E402, F401  — register routes on the blueprint
