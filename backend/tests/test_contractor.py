from datetime import datetime

class TestCreateContractor:
    def test_create_contractor(self, client, auth_token_vendor):
        resp = client.post('/contractors/register', json={
            "user": {
                'username': 'newuser',
                'email': 'new@test.com',
                'password': 'securepass',
                'first_name': 'New',
                'last_name': 'User',
                'contact_number': '555-555-5555',
                'date_of_birth': '1990-01-01',
                'ssn_last_four': '1234',
            },
            "contractor": {
                'employee_number': 'EMP002',
                'role': 'general',
                'status': 'active',
                'tickets_completed': 0,
                'tickets_open': 0,
                'biometric_enrolled': False,
                'is_onboarded': False,
                'is_subcontractor': False,
                'is_fte': False,
                'is_licensed': False,
                'is_insured': False,
                'is_certified': False,
                'average_rating': None,
                'years_experience': None,
                'preferred_job_types': None,
                'offline_pin': None
            }
        }, headers={'Authorization': f'Bearer {auth_token_vendor}'}
        )
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['message'] == 'Contractor registered successfully'
        assert data['user']['username'] == 'newuser'
    
    def test_duplicate_contractor(self, client, seed_contractor, auth_token_vendor):
        resp = client.post('/contractors/register', json={
            "user": {
                'username': 'testuser',
                'email': 'other@test.com',
                'password': 'securepass',
                'first_name': 'New',
                'last_name': 'User',
                'contact_number': '555-555-5555',
                'date_of_birth': '1990-01-01',
                'ssn_last_four': '1234',
            },
            "contractor": {
                'employee_number': 'EMP002',
                'role': 'general',
                'status': 'active',
                'tickets_completed': 0,
                'tickets_open': 0,
                'biometric_enrolled': False,
                'is_onboarded': False,
                'is_subcontractor': False,
                'is_fte': False,
                'is_licensed': False,
                'is_insured': False,
                'is_certified': False,
                'average_rating': None,
                'years_experience': None,
                'preferred_job_types': None,
                'offline_pin': None
            }
        }, headers={'Authorization': f'Bearer {auth_token_vendor}'}
        )
        print(resp.get_json())
        assert resp.status_code == 400