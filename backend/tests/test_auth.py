from datetime import datetime


class TestLogin:

    def test_login_success(self, client, seed_user):
        resp = client.post('/auth/login', json={
            'username': 'testuser',
            'password': '123456',
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'token' in data
        assert data['message'] == 'Successfully Logged in'
        assert data['user']['username'] == 'testuser'

    def test_login_wrong_password(self, client, seed_user):
        resp = client.post('/auth/login', json={
            'username': 'testuser',
            'password': 'wrongpassword',
        })
        assert resp.status_code == 401
        data = resp.get_json()
        assert data['code'] == 'INVALID_CREDENTIALS'

    def test_login_nonexistent_user(self, client):
        resp = client.post('/auth/login', json={
            'username': 'nobody',
            'password': '123456',
        })
        assert resp.status_code == 401

    def test_login_missing_username(self, client):
        resp = client.post('/auth/login', json={
            'password': '123456',
        })
        assert resp.status_code == 400

    def test_login_missing_password(self, client):
        resp = client.post('/auth/login', json={
            'username': 'testuser',
        })
        assert resp.status_code == 400

    def test_login_token_is_valid_jwt(self, client, seed_user):
        resp = client.post('/auth/login', json={
            'username': 'testuser',
            'password': '123456',
        })
        token = resp.get_json()['token']
        assert len(token.split('.')) == 3


class TestOfflinePin:

    def test_set_pin_success(self, client, seed_contractor, auth_token):
        resp = client.post('/auth/offline-pin',
            json={'pin': '123456'},
            headers={'Authorization': f'Bearer {auth_token}'},
        )
        assert resp.status_code == 200
        assert resp.get_json()['message'] == 'offline pin set'

    def test_set_pin_too_short(self, client, seed_contractor, auth_token):
        resp = client.post('/auth/offline-pin',
            json={'pin': '123'},
            headers={'Authorization': f'Bearer {auth_token}'},
        )
        assert resp.status_code == 400

    def test_set_pin_no_token(self, client):
        resp = client.post('/auth/offline-pin',
            json={'pin': '123456'},
        )
        assert resp.status_code == 401

    def test_set_pin_no_contractor_record(self, client, seed_user, auth_token):
        resp = client.post('/auth/offline-pin',
            json={'pin': '123456'},
            headers={'Authorization': f'Bearer {auth_token}'},
        )
        assert resp.status_code == 404


class TestTokenProtection:

    def test_missing_token_returns_401(self, client):
        resp = client.get('/contractors/profile')
        assert resp.status_code == 401

    def test_expired_token_returns_403(self, client):
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
