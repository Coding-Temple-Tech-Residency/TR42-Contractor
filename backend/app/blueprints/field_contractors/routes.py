from flask import request, jsonify
from app.models import Auth_users, Contractors, Tickets, db
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
        auth_user_data = auth_user_create_schema.load(json_data.get('auth_user', {}))
        contractor_data = contractor_schema.load(json_data.get('contractor', {}))
    except ValidationError as e:
        return jsonify(e.messages), 400

    # Check if user already exists
    existing_user = db.session.query(Auth_users).filter(Auth_users.username == auth_user_data['username']).first()
    if existing_user:
        return jsonify({'error': 'User with this username already exists'}), 400

    # Create new user
    new_auth_user = Auth_users(
        email=auth_user_data['email'],
        username=auth_user_data['username'],
        password=generate_password_hash(auth_user_data['password']),
        role='contractor',
        created_by=request.user_id
    )
    db.session.add(new_auth_user)
    db.session.flush()  # Get the ID of the newly created user

    # Create new contractor
    new_contractor = Contractors(
        id=new_auth_user.id,
        vendor_id=contractor_data['vendor_id'],
        manager_id=contractor_data['manager_id'],
        first_name=contractor_data['first_name'],
        last_name=contractor_data['last_name'],
        license_number=contractor_data['license_number'],
        expiration_date=contractor_data['expiration_date'],
        contractor_type=contractor_data['contractor_type'],
        status=contractor_data['status'],
        tax_classification=contractor_data['tax_classification'],
        contact_number=contractor_data['contact_number'],
        date_of_birth=contractor_data['date_of_birth'],
        address=contractor_data['address'],
    )
    db.session.add(new_contractor)
    db.session.commit()

    return jsonify({
        'message': 'Contractor registered successfully',
        'auth_user': auth_user_update_schema.dump(new_auth_user),
        'contractor': contractor_schema.dump(new_contractor)
    }), 201

# View User Profile
@field_contractors_bp.route('/profile', methods=['GET'])
@token_required
def get_contractor():
    user_id= request.user_id
    user = db.session.get(Contractors, user_id)
    if user:
        return contractor_schema.jsonify(user), 200
    return jsonify ({'error': 'Invalid user id'}), 400


#Vendor viewing contractor profile (for testing, delete later)
@field_contractors_bp.route('/<int:contractor_id>', methods=['GET'])
@vendor_required
def get_contractor_as_vendor(contractor_id):
    user = db.session.get(Contractors, contractor_id)
    if user:
        return contractor_schema.jsonify(user), 200
    return jsonify ({'error': 'Invalid user id'}), 400

#Vendor updating contractor profile (for testing, delete later)
@field_contractors_bp.route('/<int:contractor_id>', methods=['PUT'])
@vendor_required
def update_contractor_as_vendor(contractor_id):
    json_data = request.get_json()

    if not json_data:
         return jsonify({'error': 'No input data provided'}), 400

    # Validate and deserialize new updated input
    try:
        auth_user_data = auth_user_update_schema.load(json_data.get('auth_user', {})) 
        contractor_data = vendor_update_contractor_schema.load(json_data.get('contractor', {}))
    except ValidationError as e:
        return jsonify(e.messages), 400
    if not auth_user_data and not contractor_data:
        return jsonify({'error': 'No data to update'}), 400
    
    contractor = db.session.get(Contractors, contractor_id)

    
    if not contractor or not contractor.auth_user:
            return jsonify({'error': 'Invalid User Id'}), 404
    
    auth_user = contractor.auth_user

    vendor_id = request.user_id
    auth_user["updated_by"] = vendor_id
    auth_user["updated_at"] = datetime.now(timezone.utc)

    try: 
        for key, value in auth_user_data.items():
            setattr(auth_user, key, value)
        for key, value in contractor_data.items():
            setattr(contractor, key, value)

        db.session.commit()    
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Updating failed'}), 500


    return jsonify({
        'message': 'Profile updated successfully',
        'auth_user': auth_user_update_schema.dump(auth_user),
        'contractor': contractor_update_schema.dump(contractor)
    }), 200



# Update Profile (need to be able to update email, contact number, address - anything else will be through vendor)
@field_contractors_bp.route('/profile', methods=['PUT'])
@token_required
def update_contractor():
    json_data = request.get_json()

    if not json_data:
         return jsonify({'error': 'No input data provided'}), 400

    # Validate and deserialize new updated input
    try:
        auth_user_data = auth_user_update_schema.load(json_data.get('auth_user', {})) 
        contractor_data = contractor_update_schema.load(json_data.get('contractor', {}))
    except ValidationError as e:
        return jsonify(e.messages), 400
    if not auth_user_data and not contractor_data:
        return jsonify({'error': 'No data to update'}), 400
    
    #user_id from token
    user_id = request.user_id
    contractor = db.session.get(Contractors, user_id)

    if not contractor or not contractor.auth_user:
            return jsonify({'error': 'Invalid User Id'}), 404
    
    auth_user = contractor.auth_user

    try: 
        for key, value in auth_user_data.items():
            setattr(auth_user, key, value)
        for key, value in contractor_data.items():
            setattr(contractor, key, value)

        db.session.commit()    
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Updating failed'}), 500


    return jsonify({
        'message': 'Profile updated successfully',
        'auth_user': auth_user_update_schema.dump(auth_user),
        'contractor': contractor_update_schema.dump(contractor)
    }), 200


#Update password route exists is in auth_user

#Update offline pin route




#----------------------------------------------------------
#TICKET ROUTES BY CONTRACTOR - view assigned tickets and unassigned tickets by vendor

# View all Tickets assigned to contractor
@field_contractors_bp.route('/assigned-tickets', methods=['GET'])
@token_required
def get_assigned_tickets():
    user_id = request.user_id

    try:
        tickets = db.session.query(Tickets).filter(Tickets.assigned_contractor == user_id).all()
        return tickets_schema.jsonify(tickets), 200
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve tickets'}), 500


# View all Tickets assigned to contractor's vendor, but not assigned to contractor (get by vendor id)
@field_contractors_bp.route('/unassigned-tickets-by-vendor', methods=['GET'])
@token_required
def get_vendor_unassigned_tickets():
    user_id = request.user_id
    
    try:
        user = db.session.get(Contractors, user_id)
        if not user:
            return jsonify ({'error': 'Invalid user id'}), 400
        
        vendor_id = user.vendor_id

        tickets = db.session.query(Tickets).filter(Tickets.vendor_id == vendor_id).all()
        return tickets_schema.jsonify(tickets), 200
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve tickets'}), 500
