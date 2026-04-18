import os
import pytest

os.environ.setdefault('SECRET_KEY', 'test-secret-key-for-pytest')

from app import create_app
from app.models import db as _db, Auth_users, Contractors, Tickets
from werkzeug.security import generate_password_hash
from datetime import date, datetime


@pytest.fixture(scope='session')
def app():
    app = create_app('TestingConfig')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['TESTING'] = True
    return app


@pytest.fixture(autouse=True)
def db(app):
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.rollback()
        _db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def seed_user(db):
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
    resp = client.post('/auth/login', json={
        'username': 'testuser',
        'password': '123456',
    })
    return resp.get_json()['token']



@pytest.fixture
def seed_ticket(db, seed_contractor):
    ticket = Tickets(
        work_order_id=1,
        vendor_id=1,
        description='Test ticket',
        priority='medium',
        status='to_do',
        assigned_contractor=seed_contractor.id,
        contractor_assigned_at=datetime.now(),
        created_at=datetime.now(),

        estimated_quantity=10,
        unit='tons',
        special_requirements='None',
        
        anomaly_flag=False,

    )
    db.session.add(ticket)
    db.session.commit()
    return ticket



@pytest.fixture
def seed_ticket_inProgress(db, seed_contractor):
    ticket = Tickets(
        work_order_id=1,
        vendor_id=1,
        description='Test ticket in progress',
        priority='medium',
        status='in_progress',
        assigned_contractor=seed_contractor.id,
        contractor_assigned_at=datetime.now(),
        created_at=datetime.now(),
        start_time=datetime.now(),
        start_location='456 Test Ave',

        estimated_quantity=5,
        unit='tons',
        special_requirements='None',
        
        anomaly_flag=False,

    )
    db.session.add(ticket)
    db.session.commit()
    return ticket