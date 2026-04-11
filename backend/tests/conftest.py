# conftest.py
# Shared pytest fixtures for all backend tests.
# Creates a fresh in-memory SQLite database for each test so tests
# never interfere with each other or with your dev database.

import os
import pytest

# Set SECRET_KEY before any app code imports
os.environ.setdefault('SECRET_KEY', 'test-secret-key-for-pytest')

from app import create_app
from app.models import db as _db, Auth_users, Contractors
from werkzeug.security import generate_password_hash
from datetime import date


@pytest.fixture(scope='session')
def app():
    """Create the Flask app once per test session with an in-memory DB."""
    app = create_app('TestingConfig')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['TESTING'] = True
    return app


@pytest.fixture(autouse=True)
def db(app):
    """Reset the database before every test."""
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.rollback()
        _db.drop_all()


@pytest.fixture
def client(app):
    """Flask test client for making HTTP requests."""
    return app.test_client()


@pytest.fixture
def seed_user(db):
    """Create a test auth_user and return their info."""
    user = Auth_users(
        username='testuser',
        email='test@test.com',
        password=generate_password_hash('123456'),
        role='contractor',
        created_by=1,
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def seed_contractor(db, seed_user):
    """Create a contractor row linked to the test user."""
    contractor = Contractors(
        id=seed_user.id,
        vendor_id=1,
        manager_id=1,
        first_name='Test',
        last_name='User',
        license_number='TEST001',
        expiration_date=date(2027, 1, 1),
        contractor_type='general',
        status='active',
        tax_classification='W9',
        contact_number='555-555-5555',
        date_of_birth=date(1990, 1, 1),
        address='123 Test St',
    )
    db.session.add(contractor)
    db.session.commit()
    return contractor


@pytest.fixture
def auth_token(client, seed_user):
    """Log in the seed user and return their JWT token."""
    resp = client.post('/auth/login', json={
        'username': 'testuser',
        'password': '123456',
    })
    return resp.get_json()['token']
