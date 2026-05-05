import os


class _PhotoUploadDefaults:
    """Photo upload limits shared by every environment.

    The three limits work together as defense in depth:
      MAX_CONTENT_LENGTH    Flask 413s the request BEFORE our route runs.
      MAX_PHOTO_BYTES       Inner bound the photo route re-checks itself.
      MAX_PHOTOS_PER_TICKET Per-ticket cap so a contractor can't pile on
                            indefinitely.

    Photo bytes themselves live in the ticket_photo.photo_content (bytea)
    column per the team's storage decision. No external storage backend
    config needed.
    """
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024   # 10 MB cap on a single request
    MAX_PHOTO_BYTES = 10 * 1024 * 1024      # matches MAX_CONTENT_LENGTH today
    MAX_PHOTOS_PER_TICKET = 20


class DevelopmentConfig(_PhotoUploadDefaults):
    # Read DATABASE_URL from env (Supabase / shared Postgres) and fall back to a
    # local sqlite file when unset. The postgres:// to postgresql:// swap matches
    # SQLAlchemy's required dialect prefix.
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 'sqlite:///app.db'
    ).replace('postgres://', 'postgresql://', 1)
    DEBUG = True
    CACHE_TYPE =  "SimpleCache"
    CACHE_DEFAULT_TIMEOUT = 300

class TestingConfig(_PhotoUploadDefaults):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///testing.db'
    DEBUG = True
    CACHE_TYPE = "SimpleCache"

class ProductionConfig(_PhotoUploadDefaults):
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', '').replace('postgres://', 'postgresql://', 1)
    SECRET_KEY = os.environ.get('SECRET_KEY')
    DEBUG = False
    CACHE_TYPE = "SimpleCache"
    CACHE_DEFAULT_TIMEOUT = 300
