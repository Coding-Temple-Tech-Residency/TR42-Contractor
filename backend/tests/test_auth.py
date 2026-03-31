import json


def test_register_user(client):
    response = client.post(
        "/api/auth",
        json={
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "securepass",
            "role": "contractor",
        },
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["username"] == "newuser"
    assert data["email"] == "newuser@example.com"
    assert "password" not in data


def test_register_duplicate_username(client, test_user):
    response = client.post(
        "/api/auth",
        json={
            "email": "other@example.com",
            "username": "testuser",
            "password": "securepass",
            "role": "contractor",
        },
    )
    assert response.status_code == 400
    assert "already taken" in response.get_json()["error"].lower()


def test_register_missing_fields(client):
    response = client.post("/api/auth", json={"username": "incomplete"})
    assert response.status_code == 400


def test_login_success(client, test_user):
    response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.get_json()
    assert "token" in data
    assert data["message"] == "Successfully Logged in"


def test_login_wrong_password(client, test_user):
    response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "noone", "password": "whatever"},
    )
    assert response.status_code == 401


def test_set_offline_pin(client, test_contractor, auth_header):
    response = client.post(
        "/api/auth/offline-pin",
        json={"pin": "123456"},
        headers=auth_header,
    )
    assert response.status_code == 200
    assert response.get_json()["message"] == "offline pin set"


def test_set_offline_pin_invalid(client, test_contractor, auth_header):
    response = client.post(
        "/api/auth/offline-pin",
        json={"pin": "123"},
        headers=auth_header,
    )
    assert response.status_code == 400


def test_set_offline_pin_no_token(client):
    response = client.post("/api/auth/offline-pin", json={"pin": "123456"})
    assert response.status_code == 401
