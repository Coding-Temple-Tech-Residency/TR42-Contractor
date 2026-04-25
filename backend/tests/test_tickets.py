from datetime import timedelta


class TestTickets:
    def test_updateTicket_success(self, client, auth_token, seed_ticket):
        ticket_id = seed_ticket.id
        response = client.put(f'/tickets/{ticket_id}', json={
            'status': 'in_progress',
            'notes': 'Started work on the ticket.',
            'start_time': '2026-01-01T08:00:00Z',
            'contractor_start_location': '123 Test St',
        }, headers={'Authorization': f'Bearer {auth_token}'})
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'in_progress'
        assert data['notes'] == 'Started work on the ticket.'
        assert data['contractor_start_location'] == '123 Test St'

    def test_updateTicket_invalidStatus(self, client, auth_token, seed_ticket):
        ticket_id = seed_ticket.id
        response = client.put(f'/tickets/{ticket_id}', json={
            'status': 'invalid_status',
        }, headers={'Authorization': f'Bearer {auth_token}'})
        assert response.status_code == 400

    def test_updateTicket_missingStartTime(self, client, auth_token, seed_ticket):
        ticket_id = seed_ticket.id
        response = client.put(f'/tickets/{ticket_id}', json={
            'status': 'in_progress',
            'contractor_start_location': '123 Test St',
        }, headers={'Authorization': f'Bearer {auth_token}'})   
        assert response.status_code == 400

    def test_updateTicket_missingStartLocation(self, client, auth_token, seed_ticket):
        ticket_id = seed_ticket.id
        response = client.put(f'/tickets/{ticket_id}', json={
            'status': 'in_progress',
            'start_time': '2026-01-01T08:00:00Z',
        }, headers={'Authorization': f'Bearer {auth_token}'})   
        assert response.status_code == 400

    def test_updateTicket_completeSuccess(self, client, auth_token, seed_ticket_inProgress):
        ticket_id = seed_ticket_inProgress.id
        end_time = seed_ticket_inProgress.start_time + timedelta(hours=4)
        response = client.put(f'/tickets/{ticket_id}', json={
            'status': 'completed',
            'notes': 'Completed the ticket.',
            'end_time': end_time.isoformat() + 'Z',
            'contractor_end_location': '123 Test St',
        }, headers={'Authorization': f'Bearer {auth_token}'})
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'completed'
        assert data['notes'] == 'Completed the ticket.'
        assert data['contractor_end_location'] == '123 Test St'
        assert data['anomaly_flag'] == False

    def test_updateTicket_completeWithAnomaly(self, client, auth_token, seed_ticket_inProgress):
        ticket_id = seed_ticket_inProgress.id
        end_time = seed_ticket_inProgress.start_time - timedelta(hours=1)
        response = client.put(f'/tickets/{ticket_id}', json={
            'status': 'completed',
            'notes': 'Completed the ticket with anomaly.',
            'end_time': end_time.isoformat() + 'Z',
            'contractor_end_location': '123 Test St',
        }, headers={'Authorization': f'Bearer {auth_token}'})
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'completed'
        assert data['notes'] == 'Completed the ticket with anomaly.'
        assert data['contractor_end_location'] == '123 Test St'
        assert data['anomaly_flag'] == True