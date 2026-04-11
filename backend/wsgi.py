from dotenv import load_dotenv

load_dotenv()

import os
from app import create_app

config_name = (
    "ProductionConfig"
    if os.getenv("APP_ENV", "").lower() == "production"
    else "DevelopmentConfig"
)
app = create_app(config_name)
