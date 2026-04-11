# test_auth.py
# Tests for authentication endpoints: login, user creation, and offline PIN.

import json


# ═══════════════════════════════════════════════════════════════
#  POST /auth/login
# ═══════════════════════════════════════════════════════════════

class TestLogin:
    """Tests for the login endpoint."""

    def test_login_success(self, client, seed_user):
        """Valid credentials return 200 with token and user info."""
        resp = client.post('/auth/login', json={
            'username': 'testuser',
            'password': '123456',
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'token' in data
        assert data['message'] == 'Successfully Logged in'
        assert data['user']['username'] == 'testuser'
        assert data['user']['role'] == 'contractor'

    def test_login_wrong_password(self, client, seed_user):
        """Wrong password returns 401."""
        resp = client.post('/auth/login', json={
            'username': 'testuser',
            'password': 'wrongpassword',
        })
        assert resp.status_code == 401
        data = resp.get_json()
        assert data['code'] == 'INVALID_CREDENTIALS'

    def test_login_nonexistent_user(self, client):
        """Username that doesn't exist returns 401."""
        resp = client.post('/auth/login', json={
            'username': 'nobody',
            'password': '123456',
        })
        assert resp.status_code == 401

    def test_login_missing_username(self, client):
        """Missing username field returns 400 validation error."""
        resp = client.post('/auth/login', json={
            'password': '123456',
        })
        assert resp.status_code == 400

    def test_login_missing_password(self, client):
        """Missing password field returns 400 validation error."""
        resp = client.post('/auth/login', json={
            'username': 'testuser',
        })
        assert resp.status_code == 400

    def test_login_empty_body(self, client):
        """Empty JSON body returns 400."""
        resp = client.post('/auth/login', json={})
        assert resp.status_code == 400

    def test_login_token_is_valid_jwt(self, client, seed_user):
        """Token returned is a valid 3-part JWT string."""
        resp = client.post('/auth/login', json={
            'username': 'testuser',
            'password': '123456',
        })
        token = resp.get_json()['token']
        parts = token.split('.')
        assert len(parts) == 3, 'JWT should have 3 dot-separated parts'


# ═══════════════════════════════════════════════════════════════
#  POST /auth  (user creation)
# ═══════════════════════════════════════════════════════════════

class TestCreateUser:
    """Tests for the user registration endpoint."""

    def test_create_user_success(self, client):
        """Valid payload creates a user and returns 201."""
        resp = client.post('/auth', json={
            'username': 'newuser',
            'email': 'new@test.com',
            'password': 'securepass',
            'role': 'contractor',
            'created_by': 1,
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['username'] == 'newuser'
        assert data['email'] == 'new@test.com'

    def test_create_duplicate_user(self, client, seed_user):
        """Duplicate username returns 400."""
        resp = client.post('/auth', json={
            'username': 'testuser',
            'email': 'other@test.com',
            'password': '123456',
            'role': 'contractor',
            'created_by': 1,
        })
        assert resp.status_code == 400
        assert 'already taken' in resp.get_json().get('error', '').lower()

    def test_create_user_missing_fields(self, client):
        """Missing required fields returns 400."""
        resp = client.post('/auth', json={
            'username': 'incomplete',
        })
        assert resp.status_code == 400


# ═══════════════════════════════════════════════════════════════
#  POST /auth/offline-pin
# ═══════════════════════════════════════════════════════════════

class TestOfflinePin:
    """Tests for the offline PIN endpoint."""

    def test_set_pin_success(self, client, seed_contractor, auth_token):
        """Valid 6-digit PIN returns 200."""
        resp = client.post('/auth/offline-pin',
            json={'pin': '123456'},
            headers={'Authorization': f'Bearer {auth_token}'},
        )
        assert resp.status_code == 200
        assert resp.get_json()['message'] == 'offline pin set'

    def test_set_pin_10_digits(self, client, seed_contractor, auth_token):
        """Valid 10-digit PIN returns 200."""
        resp = client.post('/auth/offline-pin',
            json={'pin': '1234567890'},
            headers={'Authorization': f'Bearer {auth_token}'},
        )
        assert resp.status_code == 200

    def test_set_pin_too_short(self, client, seed_contractor, auth_token):
        """PIN shorter than 6 digits returns 400."""
        resp = client.post('/auth/offline-pin',
            json={'pin': '123'},
            headers={'Authorization': f'Bearer {auth_token}'},
        )
        assert resp.status_code == 400

    def test_set_pin_too_long(self, client, seed_contractor, auth_token):
        """PIN longer than 10 digits returns 400."""
        resp = client.post('/auth/offline-pin',
            json={'pin': '12345678901'},
            headers={'Authorization': f'Bearer {auth_token}'},
        )
        assert resp.status_code == 400

    def test_set_pin_non_numeric(self, client, seed_contractor, auth_token):
        """Non-numeric PIN returns 400."""
        resp = client.post('/auth/offline-pin',
            json={'pin': 'abcdef'},
            headers={'Authorization': f'Bearer {auth_token}'},
        )
        assert resp.status_code == 400

    def test_set_pin_no_token(self, client):
        """Request without auth token returns 401."""
        resp = client.post('/auth/offline-pin',
            json={'pin': '123456'},
        )
        assert resp.status_code == 401

    def test_set_pin_invalid_token(self, client):
        """Request with garbage token returns 403."""
        resp = client.post('/auth/offline-pin',
            json={'pin': '123456'},
            headers={'Authorization': 'Bearer invalid.token.here'},
        )
        assert resp.status_code == 403

    def test_set_pin_no_contractor_record(self, client, seed_user, auth_token):
        """User exists but has no contractor row returns 404."""
        resp = client.post('/auth/offline-pin',
            json={'pin': '123456'},
            headers={'Authorization': f'Bearer {auth_token}'},
        )
        assert resp.status_code == 404


# ═══════════════════════════════════════════════════════════════
#  Token-protected route access
# ═══════════════════════════════════════════════════════════════

class TestTokenProtection:
    """Tests that token-required routes reject bad/missing tokens."""

    def test_missing_token_returns_401(self, client):
        """No Authorization header returns 401."""
        resp = client.get('/contractors/profile')
        assert resp.status_code == 401

    def test_expired_token_returns_403(self, client):
        """An expired JWT returns 403."""
        # This is a pre-built expired token (exp in the past)
        from app.util.auth import SECRET_KEY
        from jose import jwt
        from datetime import datetime, timedelta, timezone

        expired_payload = {
            'exp': datetime.now(timezone.utc) - timedelta(hours=1),
            'iat': datetime.now(timezone.utc) - timedelta(hours=2),
            'sub': '1',
            'role': 'contractor',
        }
        expired_token = jwt.encode(expired_payload, SECRET_KEY, algorithm='HS256')

        resp = client.get('/contractors/profile',
            headers={'Authorization': f'Bearer {expired_token}'},
        )
        assert resp.status_code == 403
