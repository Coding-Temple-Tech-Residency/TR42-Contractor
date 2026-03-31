import pytest
from app import create_app
from app.models import db as _db, Auth_users, Contractors, Vendors
from werkzeug.security import generate_password_hash
from app.util.auth import encode_token
from datetime import date


@pytest.fixture(scope="session")
def app():
    app = create_app("TestingConfig")
    with app.app_context():
        _db.create_all()
    yield app


@pytest.fixture(autouse=True)
def clean_db(app):
    """Wipe all tables before each test for isolation."""
    with app.app_context():
        _db.session.remove()
        meta = _db.metadata
        for table in reversed(meta.sorted_tables):
            _db.session.execute(table.delete())
        _db.session.commit()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def test_user(app):
    with app.app_context():
        user = Auth_users(
            email="testuser@example.com",
            username="testuser",
            password=generate_password_hash("password123"),
            role="contractor",
        )
        _db.session.add(user)
        _db.session.commit()
        _db.session.refresh(user)
        return user


@pytest.fixture()
def test_vendor(app):
    with app.app_context():
        vendor_auth = Auth_users(
            email="vendor@example.com",
            username="vendoruser",
            password=generate_password_hash("password123"),
            role="vendor",
        )
        _db.session.add(vendor_auth)
        _db.session.commit()
        _db.session.refresh(vendor_auth)

        vendor = Vendors(
            id=vendor_auth.id,
            first_name="Test",
            last_name="Vendor",
        )
        _db.session.add(vendor)
        _db.session.commit()
        _db.session.refresh(vendor)
        return vendor


@pytest.fixture()
def test_contractor(app, test_user, test_vendor):
    with app.app_context():
        contractor = Contractors(
            id=test_user.id,
            vendor_id=test_vendor.id,
            manager_id=test_vendor.id,
            first_name="Test",
            last_name="Contractor",
            license_number="LIC123",
            expiration_date=date(2027, 1, 1),
            contractor_type="electrician",
            status="active",
            tax_classification="W9",
            contact_number="5551234567",
            date_of_birth=date(1990, 1, 1),
            address="123 Test St",
        )
        _db.session.add(contractor)
        _db.session.commit()
        _db.session.refresh(contractor)
        return contractor


@pytest.fixture()
def auth_header(test_user):
    token = encode_token(test_user.id, test_user.role)
    return {"Authorization": f"Bearer {token}"}
