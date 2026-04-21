from flask import request, jsonify
from app.models import User, Contractor, Ticket, db
from .schemas import contractor_schema, contractor_update_schema, vendor_update_contractor_schema
from ..auth_users.schemas import auth_user_update_schema, auth_user_create_schema
from ..tickets.schemas import tickets_schema
from marshmallow import ValidationError
from werkzeug.security import generate_password_hash, check_password_hash
from . import field_contractors_bp
from app.util.auth import encode_token, token_required, vendor_required
from datetime import datetime, timezone


#Register contractor (for testing, delete later)
@field_contractors_bp.route('/register', methods=['POST'])
@vendor_required
def register_contractor():
    json_data = request.get_json()

    if not json_data:
        return jsonify({'error': 'No input data provided'}), 400

    # Validate and deserialize input
    try:
        user_data = auth_user_create_schema.load(json_data.get('user', {}))
        contractor_data = contractor_schema.load(json_data.get('contractor', {}))
    except ValidationError as e:
        return jsonify(e.messages), 400

    # Check if user already exists
    existing_user = db.session.query(User).filter(User.username == user_data['username']).first()
    if existing_user:
        return jsonify({'error': 'User with this username already exists'}), 400

    # Create new user
    new_user = User(
        email=user_data['email'],
        username=user_data['username'],
        password_hash=generate_password_hash(user_data['password_hash']),
        user_type='contractor',
        created_by=request.user_id
    )
    db.session.add(new_user)
    db.session.flush()  # Get the ID of the newly created user

    # Create new contractor
    new_contractor = Contractor(
        employee_number=contractor_data['employee_number'],
        user_id=new_user.id,
        role=contractor_data['role'],
        status=contractor_data['status'],
        tickets_completed=contractor_data.get('tickets_completed', 0),
        tickets_open=contractor_data.get('tickets_open', 0),
        biometric_enrolled=contractor_data.get('biometric_enrolled', False),
        is_onboarded=contractor_data.get('is_onboarded', False),
        is_subcontractor=contractor_data.get('is_subcontractor', False),
        is_fte=contractor_data.get('is_fte', False),
        is_licensed=contractor_data.get('is_licensed', False),
        is_insured=contractor_data.get('is_insured', False),
        is_certified=contractor_data.get('is_certified', False),
        average_rating=contractor_data.get('average_rating', None),
        years_experience=contractor_data.get('years_experience', None),
        preferred_job_types=contractor_data.get('preferred_job_types', None),

        offline_pin=contractor_data.get('offline_pin', None),

        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        created_by=request.user_id,
        updated_by=request.user_id
        
    )
    db.session.add(new_contractor)
    db.session.commit()

    return jsonify({
        'message': 'Contractor registered successfully',
        'user': auth_user_update_schema.dump(new_user),
        'contractor': contractor_schema.dump(new_contractor)
    }), 201

# Contractor view Profile
@field_contractors_bp.route('/profile', methods=['GET'])
@token_required
def get_contractor():
    user_id= request.user_id
    user = db.session.get(User, user_id)
    contractor = db.session.query(Contractor).filter(Contractor.user_id == user_id).first()
    if contractor and user:
        return jsonify({
            'user': auth_user_update_schema.dump(user),
            'contractor': contractor_schema.dump(contractor)
        }), 200
    return jsonify ({'error': 'Invalid user id'}), 400

# ------------------> CONTINUE HERE
#Vendor viewing contractor profile (for testing, delete later)
# @field_contractors_bp.route('/<int:contractor_id>', methods=['GET'])
# @vendor_required
# def get_contractor_as_vendor(contractor_id):
#     contractor = db.session.get(Contractor, contractor_id)
#     if contractor:
#         return contractor_schema.jsonify(contractor), 200
#     return jsonify ({'error': 'Invalid user id'}), 400

#Vendor updating contractor profile (for testing, delete later)
# @field_contractors_bp.route('/<int:contractor_id>', methods=['PUT'])
# @vendor_required
# def update_contractor_as_vendor(contractor_id):
#     json_data = request.get_json()

#     if not json_data:
#          return jsonify({'error': 'No input data provided'}), 400

#     # Validate and deserialize new updated input
#     try:
#         auth_user_data = auth_user_update_schema.load(json_data.get('auth_user', {})) 
#         contractor_data = vendor_update_contractor_schema.load(json_data.get('contractor', {}))
#     except ValidationError as e:
#         return jsonify(e.messages), 400
#     if not auth_user_data and not contractor_data:
#         return jsonify({'error': 'No data to update'}), 400
    
#     contractor = db.session.get(Contractor, contractor_id)

    
    # if not contractor or not contractor.auth_user:
    #         return jsonify({'error': 'Invalid User Id'}), 404
    
    # auth_user = contractor.auth_user

    # vendor_id = request.user_id
    # auth_user["updated_by"] = vendor_id
    # auth_user["updated_at"] = datetime.now(timezone.utc)

    # try: 
    #     for key, value in auth_user_data.items():
    #         setattr(auth_user, key, value)
    #     for key, value in contractor_data.items():
    #         setattr(contractor, key, value)

    #     db.session.commit()    
    
    # except Exception as e:
    #     db.session.rollback()
    #     return jsonify({'error': 'Updating failed'}), 500


    # return jsonify({
    #     'message': 'Profile updated successfully',
    #     'auth_user': auth_user_update_schema.dump(auth_user),
    #     'contractor': contractor_update_schema.dump(contractor)
    # }), 200


# Update Profile (limited to: contact number, alternative contact number)
@field_contractors_bp.route('/profile', methods=['PUT'])
@token_required
def update_contractor():
    json_data = request.get_json()

    if not json_data:
         return jsonify({'error': 'No input data provided'}), 400


    # Validate and deserialize new updated input
    try:
        user_data = auth_user_update_schema.load(json_data.get('user', {})) 
        # contractor_data = contractor_update_schema.load(json_data.get('contractor', {}))
    except ValidationError as e:
        return jsonify(e.messages), 400
    if not user_data:  #and not contractor_data
        return jsonify({'error': 'No data to update'}), 400
    
    #user_id from token
    user_id = request.user_id
    contractor = db.session.query(Contractor).filter(Contractor.user_id == user_id).first()

    if not contractor or not contractor.user:
            return jsonify({'error': 'Invalid User Id'}), 404
    
    user = contractor.user

    try: 
        for key, value in user_data.items():
            setattr(user, key, value)

        db.session.commit()    
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Updating failed'}), 500


    return jsonify({
        'message': 'Profile updated successfully',
        'user': auth_user_update_schema.dump(user),
    }), 200




#----------------------------------------------------------
#TICKET ROUTES BY CONTRACTOR - view assigned tickets and unassigned tickets by vendor

# View all tickets assigned to contractor
@field_contractors_bp.route('/assigned-tickets', methods=['GET'])
@token_required
def get_assigned_tickets():
    user_id = request.user_id

    try:
        contractor = db.session.query(Contractor).filter(Contractor.user_id == user_id).first()

        tickets = db.session.query(Ticket).filter(Ticket.assigned_contractor == contractor.id).all()
        return tickets_schema.jsonify(tickets), 200
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve tickets'}), 500


# View all tickets assigned to contractor's vendor, but not assigned to contractor (get by vendor id)
# @field_contractors_bp.route('/unassigned-tickets-by-vendor', methods=['GET'])
# @token_required
# def get_vendor_unassigned_tickets():
#     user_id = request.user_id
    
#     try:
#         contractor = db.session.query(Contractor).filter(Contractor.user_id == user_id).first()

#         user = db.session.get(Contractor, user_id)
#         if not user:
#             return jsonify ({'error': 'Invalid user id'}), 400
        
#         vendor_id = user.vendor_id

#         tickets = db.session.query(Ticket).filter(Ticket.vendor_id == vendor_id).all()
#         return tickets_schema.jsonify(tickets), 200
#     except Exception as e:
#         return jsonify({'error': 'Failed to retrieve tickets'}), 500
