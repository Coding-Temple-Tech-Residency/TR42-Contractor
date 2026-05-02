import os

# Upload root for FilesystemStorage. Resolved relative to backend/ so the path
# travels with the repo in dev and is overridable via env in prod.
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_UPLOAD_ROOT = os.path.join(BACKEND_DIR, 'uploads')


class _PhotoUploadDefaults:
    """Photo-upload settings shared by every environment.

    The three limits work together as defense-in-depth:
      MAX_CONTENT_LENGTH    Flask 413s the request BEFORE our route runs.
      MAX_PHOTO_BYTES       Inner bound the photo route re-checks itself.
      MAX_PHOTOS_PER_TICKET Per-ticket cap so a contractor can't pile on
                            indefinitely.

    Storage backend is selectable via PHOTO_STORAGE_BACKEND:
      - 'filesystem' (default for dev/test): writes to UPLOAD_ROOT
      - 'supabase'   (default for prod):     uses SupabaseStorage; requires
                                             SUPABASE_URL + SUPABASE_SERVICE_KEY
    """
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024   # 10 MB cap on a single request
    MAX_PHOTO_BYTES = 10 * 1024 * 1024      # matches MAX_CONTENT_LENGTH today
    MAX_PHOTOS_PER_TICKET = 20
    UPLOAD_ROOT = os.environ.get('UPLOAD_ROOT', DEFAULT_UPLOAD_ROOT)

    # Storage backend toggle. Default is filesystem (safe for local dev).
    # ProductionConfig overrides this to 'supabase' so a missing-creds boot
    # fails loudly instead of silently writing to ephemeral container disk.
    PHOTO_STORAGE_BACKEND = os.environ.get('PHOTO_STORAGE_BACKEND', 'filesystem')

    # Supabase Storage credentials (only required when PHOTO_STORAGE_BACKEND
    # is 'supabase'). NEVER expose SUPABASE_SERVICE_KEY to the mobile client.
    SUPABASE_URL = os.environ.get('SUPABASE_URL')
    SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
    SUPABASE_PHOTO_BUCKET = os.environ.get('SUPABASE_PHOTO_BUCKET', 'ticket-photos')


class DevelopmentConfig(_PhotoUploadDefaults):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///app.db'
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
    # Prod defaults to Supabase Storage. If env vars aren't set, app boot
    # fails loudly with a clear error — no silent writes to ephemeral disk.
    PHOTO_STORAGE_BACKEND = os.environ.get('PHOTO_STORAGE_BACKEND', 'supabase')
