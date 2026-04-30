from flask import Flask, jsonify
from flask_cors import CORS
from .models import db
from .extensions import ma
from .blueprints.auth_users import auth_users_bp
from .blueprints.field_contractors import field_contractors_bp
from .blueprints.tickets import tickets_bp
from .blueprints.work_orders import work_orders_bp
from .blueprints.inspections import inspections_bp
from .blueprints.drive_time import drive_time_bp
from .blueprints.ai import ai_bp


def create_app(config_name):

    app = Flask(__name__)
    app.config.from_object(f'config.{config_name}')

    CORS(app)

    db.init_app(app)
    ma.init_app(app)

    app.register_blueprint(auth_users_bp, url_prefix='/auth')
    app.register_blueprint(field_contractors_bp, url_prefix='/contractors')
    app.register_blueprint(tickets_bp, url_prefix='/tickets')
    app.register_blueprint(work_orders_bp, url_prefix='/api/work-orders')
    app.register_blueprint(inspections_bp, url_prefix='/inspections')
    app.register_blueprint(drive_time_bp, url_prefix='/drive-time')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')

    @app.route('/')
    def health_check():
        return jsonify({
            'status': 'ok',
            'message': 'TR42 Contractor API is running',
            'endpoints': [
                '/auth',
                '/contractors',
                '/tickets',
                '/api/work-orders',
                '/inspections',
                '/drive-time',
                '/api/ai'
            ]
        }), 200

    return app
