from flask import request, jsonify
from app.models import Ticket, Contractor, db
from .schemas import tickets_schema, ticket_schema, ticket_update_schema
from marshmallow import ValidationError
from werkzeug.security import generate_password_hash, check_password_hash
from . import tickets_bp
from app.util.auth import encode_token, token_required, vendor_required
from datetime import datetime, timezone


def ensure_utc(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        # Assume naive datetimes are in UTC (or adjust as needed)
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

#created by vendor - must get info from work order and assign to contractor
#contractor can update status, add notes.
#any anomaly flags or updates will be sent to vendor and client to view

@tickets_bp.route('/<int:ticket_id>', methods=['PUT'])
@token_required
def update_ticket(ticket_id):

    json_data = request.get_json()
    if not json_data:
        return jsonify({'error': 'No input data provided'}), 400
    
    user_id = request.user_id
    
    try: 
        contractor = db.session.query(Contractor).filter(Contractor.user_id == user_id).first()
        ticket = db.session.query(Ticket).filter(Ticket.id == ticket_id, Ticket.assigned_contractor == contractor.user_id).first()
    except Exception as e:
        return jsonify({'error': 'Error occurred while fetching data'}), 500

    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404
    
    
    try:
        ticket_update_data = ticket_update_schema.load(json_data)
    except ValidationError as e:
        return jsonify(e.messages), 400
    if not ticket_update_data:
        return jsonify({'error': 'No valid fields to update'}), 400

    for key, value in ticket_update_data.items():

        #IF UPDATING STATUS: Check for time start/end and location start/end
        if key == "status":
            
            if value == "IN_PROGRESS":
                if ticket.start_time:
                    return jsonify({'error': 'Ticket already started'}), 400
                
                if "start_time" not in ticket_update_data:
                    return jsonify({'error': 'start_time required when starting'}), 400
                if "contractor_start_latitude" not in ticket_update_data:
                    return jsonify({'error': 'contractor_start_latitude required when starting'}), 400
                if "contractor_start_longitude" not in ticket_update_data:
                    return jsonify({'error': 'contractor_start_longitude required when starting'}), 400

            elif value == "COMPLETED":
                if not ticket.start_time:
                    return jsonify({'error': 'Cannot complete before starting'}), 400

                if ticket.end_time:
                    return jsonify({'error': 'Ticket already completed'}), 400

                if "end_time" not in ticket_update_data:
                    return jsonify({'error': 'end_time required when completing'}), 400
                if "contractor_end_latitude" not in ticket_update_data:
                    return jsonify({'error': 'contractor_end_latitude required when completing'}), 400
                if "contractor_end_longitude" not in ticket_update_data:
                    return jsonify({'error': 'contractor_end_longitude required when completing'}), 400

                #ANOMALY CHECKS:
                
                end_time_utc = ensure_utc(ticket_update_data["end_time"])
                start_time_utc = ensure_utc(ticket.start_time)
                if end_time_utc < start_time_utc:
                    ticket.anomaly_flag = True
                    new_reason = "Logged end time is before logged start time."
                    if ticket.anomaly_reason:
                        ticket.anomaly_reason += " | " + new_reason
                    else:
                        ticket.anomaly_reason = new_reason

                if ticket_update_data["contractor_end_location"] == ticket.contractor_start_location and ticket.route is not None:
                    ticket.anomaly_flag = True
                    new_reason = "There is a designated route. Logged end location should show as different from start location."
                    if ticket.anomaly_reason:
                        ticket.anomaly_reason += " | " + new_reason
                    else:
                        ticket.anomaly_reason = new_reason                

            

        setattr(ticket, key, value)

    db.session.commit()

    return ticket_schema.jsonify(ticket), 200

