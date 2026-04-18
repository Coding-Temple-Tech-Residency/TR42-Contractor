from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / '.env')  # always finds backend/.env regardless of cwd

from app import create_app
from app.models import db

app = create_app('DevelopmentConfig')

with app.app_context():
    # db.drop_all()
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0')