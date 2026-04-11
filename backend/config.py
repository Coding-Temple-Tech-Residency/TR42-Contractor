import os


def _production_db_uri():
    uri = os.environ.get("SQLALCHEMY_DATABASE_URI") or os.environ.get("DATABASE_URL")
    if uri and uri.startswith("postgres://"):
        uri = uri.replace("postgres://", "postgresql://", 1)
    return uri


class DevelopmentConfig:
    SQLALCHEMY_DATABASE_URI = "sqlite:///app.db"
    DEBUG = True
    CACHE_TYPE = "SimpleCache"
    CACHE_DEFAULT_TIMEOUT = 300


class TestingConfig:
    SQLALCHEMY_DATABASE_URI = "sqlite:///testing.db"
    DEBUG = True
    CACHE_TYPE = "SimpleCache"


class ProductionConfig:
    SQLALCHEMY_DATABASE_URI = _production_db_uri()
    CACHE_TYPE = "SimpleCache"
