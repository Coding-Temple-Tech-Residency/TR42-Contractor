from flask import request, jsonify
from app.models import Tickets, db
from .schemas import tickets_schema, ticket_update_schema
from marshmallow import ValidationError
from werkzeug.security import generate_password_hash, check_password_hash
from . import tickets_bp
from app.util.auth import encode_token, token_required, vendor_required
from datetime import datetime, timezone

#created by vendor - must get info from work order and assign to contractor
#contractor can update status, add notes.
#any anomaly flags or updates will be sent to vendor and client to view

@tickets_bp.route('/<int:ticket_id>', methods=['PUT'])
@token_required
def update_ticket(ticket_id):

    json_data = request.get_json()
    if not json_data:
        return jsonify({'error': 'No input data provided'}), 400
    
    ticket = db.session.query(Tickets).filter(Tickets.id == ticket_id, Tickets.assigned_contractor == request.user_id).first()
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404
    
    
    try:
        ticket_update_data = ticket_update_schema.load(json_data)
    except ValidationError as e:
        return jsonify(e.messages), 400
    if not ticket_update_data:
        return jsonify({'error': 'No valid fields to update'}), 400

    for key, value in ticket_update_data.items():
        setattr(ticket, key, value)

    db.session.commit()

    return ticket_update_schema.jsonify(ticket), 200



