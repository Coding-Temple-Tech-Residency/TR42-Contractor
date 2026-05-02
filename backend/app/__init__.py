from flask import Flask
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
from .blueprints.photos import photos_bp
from .util.storage import FilesystemStorage, SupabaseStorage


def create_app(config_name):

    app = Flask(__name__)
    app.config.from_object(f'config.{config_name}')

    CORS(app)

    db.init_app(app)
    ma.init_app(app)

    # Photo storage backend toggle. Local dev uses filesystem (no creds
    # needed); prod uses Supabase Storage (Render's container disk is
    # ephemeral, so anything FilesystemStorage writes there vanishes on
    # the next deploy). Routes read this via current_app.config['PHOTO_STORAGE'].
    backend = app.config.get('PHOTO_STORAGE_BACKEND', 'filesystem').lower()
    if backend == 'supabase':
        app.config['PHOTO_STORAGE'] = SupabaseStorage(
            url=app.config['SUPABASE_URL'],
            service_key=app.config['SUPABASE_SERVICE_KEY'],
            bucket=app.config['SUPABASE_PHOTO_BUCKET'],
        )
    elif backend == 'filesystem':
        app.config['PHOTO_STORAGE'] = FilesystemStorage(app.config['UPLOAD_ROOT'])
    else:
        raise RuntimeError(
            f"unknown PHOTO_STORAGE_BACKEND={backend!r}; "
            "expected 'filesystem' or 'supabase'"
        )

    app.register_blueprint(auth_users_bp, url_prefix='/auth')
    app.register_blueprint(field_contractors_bp, url_prefix='/contractors')
    app.register_blueprint(tickets_bp, url_prefix='/tickets')
    app.register_blueprint(work_orders_bp, url_prefix='/api/work-orders')
    app.register_blueprint(inspections_bp, url_prefix='/inspections')
    app.register_blueprint(drive_time_bp, url_prefix='/drive-time')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(photos_bp, url_prefix='/api/photos')

    return app
