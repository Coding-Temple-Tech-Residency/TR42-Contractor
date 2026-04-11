import os
from dotenv import load_dotenv
load_dotenv()

# Disable the reloader so this script doesn't restart itself
os.environ['WERKZEUG_RUN_MAIN'] = 'true'

from app import create_app
from app.models import db, Auth_users
from werkzeug.security import generate_password_hash

app = create_app('DevelopmentConfig')

with app.app_context():
    existing = db.session.query(Auth_users).filter_by(username='test@test.com').first()
    if existing:
        print('User already exists with ID:', existing.id)
    else:
        u = Auth_users(
            username='test@test.com',
            email='test@test.com',
            password=generate_password_hash('123456'),
            role='contractor',
            created_by=1,
        )
        db.session.add(u)
        db.session.flush()
        u.created_by = u.id
        db.session.commit()
        print('Created user ID:', u.id)
