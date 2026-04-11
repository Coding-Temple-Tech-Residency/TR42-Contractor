from flask import Blueprint

tickets_bp = Blueprint('tickets_bp', __name__)

from . import routes