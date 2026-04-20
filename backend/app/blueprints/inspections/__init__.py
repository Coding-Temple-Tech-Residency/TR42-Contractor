from flask import Blueprint

inspections_bp = Blueprint('inspections_bp', __name__)

from . import routes
