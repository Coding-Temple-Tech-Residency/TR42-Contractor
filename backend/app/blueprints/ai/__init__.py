from flask import Blueprint

ai_bp = Blueprint('ai_bp', __name__)

from . import routes
