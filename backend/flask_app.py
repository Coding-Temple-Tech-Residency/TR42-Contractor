import os
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / '.env')  # always finds backend/.env regardless of cwd

from app import create_app
from app.models import db

# Render sets the RENDER env var automatically — use ProductionConfig there.
# Everything else (local dev) stays on DevelopmentConfig.
config = 'ProductionConfig' if os.environ.get('RENDER') else 'DevelopmentConfig'
app = create_app(config)

with app.app_context():
    # Tables need to be dropped once for initial setup
    # db.drop_all()
    db.create_all()


if __name__ == '__main__':
    app.run(host='0.0.0.0')