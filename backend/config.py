import os

class DevelopmentConfig:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///app.db'
    DEBUG = True
    CACHE_TYPE =  "SimpleCache"
    CACHE_DEFAULT_TIMEOUT = 300
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024
    FIELD_PHOTO_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads', 'ticket_photos')
    ALLOWED_FIELD_PHOTO_MIME_TYPES = {'image/jpeg', 'image/png', 'image/heic'}

class TestingConfig:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///testing.db'
    DEBUG = True
    CACHE_TYPE = "SimpleCache"
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024
    FIELD_PHOTO_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads', 'ticket_photos')
    ALLOWED_FIELD_PHOTO_MIME_TYPES = {'image/jpeg', 'image/png', 'image/heic'}

class ProductionConfig:
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', '').replace('postgres://', 'postgresql://', 1)
    SECRET_KEY = os.environ.get('SECRET_KEY')
    DEBUG = False
    CACHE_TYPE = "SimpleCache"
    CACHE_DEFAULT_TIMEOUT = 300
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024
    FIELD_PHOTO_UPLOAD_DIR = os.environ.get(
        'FIELD_PHOTO_UPLOAD_DIR',
        os.path.join(os.path.dirname(__file__), 'uploads', 'ticket_photos')
    )
    ALLOWED_FIELD_PHOTO_MIME_TYPES = {'image/jpeg', 'image/png', 'image/heic'}
