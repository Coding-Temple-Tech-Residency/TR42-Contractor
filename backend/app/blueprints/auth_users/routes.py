from flask import request, jsonify
from app.models import AuthUser, Contractor, Address, db
from .schemas import auth_user_schema, login_schema, auth_user_update_password_schema, offline_pin_schema
from marshmallow import ValidationError
from werkzeug.security import generate_password_hash, check_password_hash
from . import auth_users_bp
from app.util.auth import encode_token, token_required


# Bootstrap - Create first admin/vendor (no auth required, one-time use)
@auth_users_bp.route('/bootstrap', methods=['GET', 'POST'])
def bootstrap():
    """Create the first admin/vendor user. Use only once to bootstrap the system."""
    
    # Check if already bootstrapped
    existing_user = db.session.query(AuthUser).first()
    if existing_user:
        return jsonify({
            'message': 'Bootstrap already complete',
            'status': 'already_done',
            'existing_user': {
                'username': existing_user.username,
                'email': existing_user.email,
                'user_type': existing_user.user_type
            },
            'login_endpoint': '/auth/login',
            'note': 'Use /auth/login with your credentials'
        }), 200
    
    # GET with no users = auto-create test admin
    if request.method == 'GET':
        # Auto-create admin with default values
        data = {
            'username': 'admin',
            'email': 'james.bustamante44@gmail.com',
            'password': 'AdminPass123!',
            'first_name': 'James',
            'last_name': 'Bustamante',
            'contact_number': '555-123-4567',
            'date_of_birth': '1985-01-01',
            'ssn_last_four': '1234'
        }
    else:
        # POST - use provided data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No input data'}), 400
    
    # Validate required fields
    required = ['username', 'email', 'password', 'first_name', 'last_name', 'contact_number', 'date_of_birth', 'ssn_last_four']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Create a placeholder address first (required for AuthUser)
    new_address = Address(
        street=data.get('street', '123 Admin St'),
        city=data.get('city', 'Admin City'),
        state=data.get('state', 'CA'),
        zip_code=data.get('zip_code', '12345'),
        country=data.get('country', 'USA')
    )
    db.session.add(new_address)
    db.session.flush()
    
    # Create vendor/admin user with the new address
    password_hash = generate_password_hash(data['password'])
    new_user = AuthUser(
        username=data['username'],
        email=data['email'],
        password_hash=password_hash,
        user_type='vendor',
        token_version=0,
        is_active=True,
        is_admin=True,
        first_name=data['first_name'],
        last_name=data['last_name'],
        contact_number=data['contact_number'],
        alternate_number=data.get('alternate_number'),
        date_of_birth=data['date_of_birth'],
        ssn_last_four=data['ssn_last_four'],
        middle_name=data.get('middle_name'),
        profile_photo=data.get('profile_photo'),
        address_id=new_address.id
    )
    
    db.session.add(new_user)
    db.session.flush()
    
    # Update address with created_by
    new_address.created_by = new_user.id
    
    # Create vendor contractor profile with all required fields
    contractor = Contractor(
        user_id=new_user.id,
        employee_number='ADMIN-' + str(new_user.id).zfill(4),
        role='Admin',
        status='active',
        created_by=new_user.id,
        years_experience=0
    )
    
    db.session.add(contractor)
    db.session.commit()
    
    token = encode_token(new_user.id, new_user.user_type)
    
    return jsonify({
        'message': 'Bootstrap complete! Admin/vendor created successfully.',
        'token': token,
        'user': auth_user_schema.dump(new_user),
        'next_steps': [
            'Save this token - you will need it to register contractors',
            'Use this token in Authorization header: Bearer <token>',
            'POST to /contractors/register to create new contractors'
        ]
    }), 201


#Login and get token
@auth_users_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return jsonify({
            'message': 'Login endpoint - Send POST request with JSON body',
            'required_fields': ['identifier (email or username)', 'password'],
            'example': {
                'identifier': 'user@example.com',
                'password': 'yourpassword'
            }
        }), 200

    try:
        data = login_schema.load(request.json)
    except ValidationError as e:
        return jsonify(e.messages), 400

    # Frontend sends `identifier` (accepts email OR username); legacy clients
    # may still send `email` or `username` directly — accept any of the three.
    identifier = (
        data.get('identifier')
        or data.get('email')
        or data.get('username')
        or ''
    ).strip()

    if not identifier:
        return jsonify({
            'error': 'Please provide an email address or username.',
            'code':  'MISSING_IDENTIFIER',
        }), 400

    # Presence of '@' is a strong enough signal that the contractor typed an
    # email. Both columns are unique so only one lookup is needed per request.
    if '@' in identifier:
        user = db.session.query(AuthUser).where(AuthUser.email == identifier).first()
    else:
        user = db.session.query(AuthUser).where(AuthUser.username == identifier).first()

    if user and check_password_hash(user.password_hash, data['password']):
        token = encode_token(user.id, user.user_type)
        return jsonify({
            'message': 'Successfully Logged in',
            'token': token,
            'user': auth_user_schema.dump(user)
        }), 200

    # Generic message — don't leak whether the email/username was recognised
    return jsonify({
        'error': 'Invalid credentials.',
        'code':  'INVALID_CREDENTIALS',
    }), 401


# Register/Create AuthUser for new contractor is in contractor routes - for testing


#Update password route (this one is if they already know existing password)
@auth_users_bp.route('/update-password', methods=['PUT'])
@token_required
def update_password():
    try:
        data = auth_user_update_password_schema.load(request.json)
    except ValidationError as e:
        return jsonify(e.messages), 400

    current_password = data.get('current_password')
    new_password = data.get('new_password')

    try: 
        #user_id from token
        user_id = request.user_id
        user = db.session.get(AuthUser, user_id)

        if user and check_password_hash(user.password_hash, current_password):
            user.password_hash = generate_password_hash(new_password)

            db.session.commit()    
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Updating failed'}), 500


    return jsonify({ 'message': 'Password updated successfully'}), 200




# Set offline PIN for contractor (stored for offline login use on-device)
@auth_users_bp.route('/offline-pin', methods=['POST'])
@token_required
def set_offline_pin():
    try:
        data = offline_pin_schema.load(request.json)
    except ValidationError as e:
        return jsonify(e.messages), 400

    pin = data.get('pin', '')
    if not pin.isdigit() or len(pin) < 6 or len(pin) > 10:
        return jsonify({'error': 'pin must be 6-10 digits'}), 400

    contractor = db.session.query(Contractor).where(Contractor.user_id == request.user_id).first()
    if not contractor:
        return jsonify({'error': 'contractor not found for current user'}), 404

    contractor.offline_pin = generate_password_hash(pin)
    db.session.commit()

    return jsonify({'message': 'offline pin set'}), 200

