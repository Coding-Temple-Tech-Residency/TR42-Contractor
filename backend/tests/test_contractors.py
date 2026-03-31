def test_get_profile(client, test_contractor, auth_header):
    response = client.get("/api/contractors/profile", headers=auth_header)
    assert response.status_code == 200
    data = response.get_json()
    assert data["first_name"] == "Test"
    assert data["last_name"] == "Contractor"


def test_get_profile_no_token(client):
    response = client.get("/api/contractors/profile")
    assert response.status_code == 401


def test_update_profile(client, test_contractor, auth_header):
    response = client.put(
        "/api/contractors/profile",
        json={
            "auth_user": {"email": "updated@example.com"},
            "contractor": {"contact_number": "5559999999", "address": "456 New St"},
        },
        headers=auth_header,
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "Profile updated successfully"


def test_update_profile_no_data(client, test_contractor, auth_header):
    response = client.put(
        "/api/contractors/profile",
        json={},
        headers=auth_header,
    )
    assert response.status_code == 400
