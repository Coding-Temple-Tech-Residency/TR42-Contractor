import os


class DevelopmentConfig:
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "mysql+mysqlconnector://tr42_user:changeme@localhost/tr42_contractor_db",
    )
    DEBUG = True
    CACHE_TYPE = "SimpleCache"
    CACHE_DEFAULT_TIMEOUT = 300
    JWT_SECRET_KEY = os.environ.get(
        "JWT_SECRET_KEY",
        "dev-insecure-key-do-not-use-in-prod",
    )


class TestingConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///testing.db"
    DEBUG = True
    CACHE_TYPE = "SimpleCache"
    JWT_SECRET_KEY = "testing-secret-key"


class ProductionConfig:
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    CACHE_TYPE = "SimpleCache"
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")

    def __init__(self):
        if not self.SQLALCHEMY_DATABASE_URI:
            raise RuntimeError(
                "DATABASE_URL environment variable is required in production"
            )

        if not self.JWT_SECRET_KEY:
            raise RuntimeError(
                "JWT_SECRET_KEY environment variable is required in production"
            )
