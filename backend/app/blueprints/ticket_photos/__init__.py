from flask import Blueprint

ticket_photos_bp = Blueprint('ticket_photos_bp', __name__)

from . import routes
