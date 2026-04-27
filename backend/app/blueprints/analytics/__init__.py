from flask import Blueprint

analytics_bp = Blueprint('analytics_bp', __name__)

from . import routes
