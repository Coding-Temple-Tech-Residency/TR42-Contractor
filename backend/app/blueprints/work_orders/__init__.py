from flask import Blueprint

work_orders_bp = Blueprint('work_orders_bp', __name__)

from . import routes
