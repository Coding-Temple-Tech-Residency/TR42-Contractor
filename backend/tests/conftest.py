import os
import pytest

os.environ.setdefault('SECRET_KEY', 'test-secret-key-for-pytest')

from app import create_app
from app.models import db as _db, AuthUser, Contractor, Ticket
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
    authuser = AuthUser(
        username='testuser',
        email='test@test.com',
        password_hash=generate_password_hash('123456'),
        user_type='contractor',
        token_version=0,
        is_active=True,
        is_admin=False,
        created_at=datetime.now(),
        created_by=1,
        first_name='Test',
        last_name='User',
        contact_number='555-555-5555',
        date_of_birth=date(1990, 1, 1),
        address_id='1',
    )
    db.session.add(authuser)
    db.session.commit()
    return authuser

@pytest.fixture
def seed_vendor_user(db):
    authuser = AuthUser(
        username='testvendor',
        email='vendor@test.com',
        password_hash=generate_password_hash('123456'),
        user_type='vendor',
        token_version=0,
        is_active=True,
        is_admin=False,
        created_at=datetime.now(),
        created_by=1,
        first_name='Test',
        last_name='User',
        contact_number='555-555-5555',
        date_of_birth=date(1990, 1, 1),
        address_id='1',
    )
    db.session.add(authuser)
    db.session.commit()
    return authuser


@pytest.fixture
def seed_contractor(db, seed_user):
    contractor = Contractor(
        employee_number='EMP001',
        user_id=seed_user.id,
        role='general',
        status='active',
        tickets_completed=5,
        tickets_open=2,
        biometric_enrolled=False,
        is_onboarded=True,
        is_subcontractor=False,
        is_fte=True,
        is_licensed=True,
        is_insured=True,
        is_certified=True,
        average_rating=4.5,
        years_experience=5,
        preferred_job_types='plumbing,electrical',
        created_at=datetime.now(),
        created_by=seed_user.id,
        
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
def auth_token_vendor(client, seed_vendor_user):
    resp = client.post('/auth/login', json={
        'username': 'testvendor',
        'password': '123456',
    })
    return resp.get_json()['token']



@pytest.fixture
def seed_ticket(db, seed_contractor):
    ticket = Ticket(
        work_order_id=1,
        invoice_id=1,
        vendor_id=1,
        description='Test ticket',
        priority='medium',
        status='to_do',
        assigned_contractor=seed_contractor.id,
        assigned_at=datetime.now(),
       
        estimated_quantity=10,
        unit='tons',
        special_requirements='None',
        
        anomaly_flag=False,
         
        created_at=datetime.now(),
        created_by=seed_contractor.user_id,
        

    )
    db.session.add(ticket)
    db.session.commit()
    return ticket



@pytest.fixture
def seed_ticket_inProgress(db, seed_contractor):
    ticket = Ticket(
        work_order_id=1,
        invoice_id=1,
        vendor_id=1,
        description='Test ticket in progress',
        priority='medium',
        status='in_progress',
        assigned_contractor=seed_contractor.id,
        assigned_at=datetime.now(),
        
        start_time=datetime.now(),
        contractor_start_location='456 Test Ave',

        estimated_quantity=5,
        unit='tons',
        special_requirements='None',
        
        anomaly_flag=False,

        created_at=datetime.now(),
        updated_at=datetime.now(),
        created_by=seed_contractor.user_id,
        updated_by=seed_contractor.user_id


    )
    db.session.add(ticket)
    db.session.commit()
    return ticket