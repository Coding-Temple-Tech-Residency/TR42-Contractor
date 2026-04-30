from flask import request, jsonify
from app.models import AuthUser, Contractor, db
from .schemas import auth_user_schema, login_schema, auth_user_update_password_schema, offline_pin_schema
from marshmallow import ValidationError
from werkzeug.security import generate_password_hash, check_password_hash
from . import auth_users_bp
from app.util.auth import encode_token, token_required


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

