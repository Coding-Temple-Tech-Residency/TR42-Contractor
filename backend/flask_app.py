from dotenv import load_dotenv

load_dotenv()  # loads backend/.env into os.environ before anything else imports
import os

from app import create_app
from app.models import db

# Default to production config when APP_ENV=production.
config_name = (
    "ProductionConfig"
    if os.getenv("APP_ENV", "").lower() == "production"
    else "DevelopmentConfig"
)
app = create_app(config_name)

with app.app_context():
    # db.drop_all()
    db.create_all()

if __name__ == "__main__":
    app.run(host="0.0.0.0")
