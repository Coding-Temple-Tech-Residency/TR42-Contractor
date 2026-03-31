from dotenv import load_dotenv
load_dotenv()                       # reads backend/.env into os.environ

from app import create_app
from app.models import db

app = create_app('DevelopmentConfig')

with app.app_context():
    db.drop_all()
    db.create_all()

app.run(host='0.0.0.0')