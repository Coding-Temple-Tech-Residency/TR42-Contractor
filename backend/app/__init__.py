from flask import Flask
from flask_cors import CORS
from .models import db
from .extensions import ma
from .blueprints.auth_users import auth_users_bp
from .blueprints.field_contractors import field_contractors_bp


def create_app(config_name):

    app = Flask(__name__)
    app.config.from_object(f'config.{config_name}')

    # CORS: allow Expo web dev origins and native app requests (no Origin header)
    CORS(app, origins=[
        'http://localhost:8081',
        'http://127.0.0.1:8081',
        'http://localhost:19006',
        'http://127.0.0.1:19006',
    ], supports_credentials=False)

    db.init_app(app)
    ma.init_app(app)

    app.register_blueprint(auth_users_bp, url_prefix='/api/auth')
    app.register_blueprint(field_contractors_bp, url_prefix='/api/contractors')


    return app