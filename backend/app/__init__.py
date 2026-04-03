from flask import Flask
from .models import db
from .extensions import ma
from .blueprints.auth_users import auth_users_bp
from .blueprints.field_contractors import field_contractors_bp
from .blueprints.work_orders import work_orders_bp


def create_app(config_name):

    app = Flask(__name__)
    app.config.from_object(f'config.{config_name}')
    
    db.init_app(app)
    ma.init_app(app)

    app.register_blueprint(auth_users_bp, url_prefix='/auth')
    app.register_blueprint(field_contractors_bp, url_prefix='/contractors')
    app.register_blueprint(work_orders_bp, url_prefix='/api/work-orders')

   
    return app
