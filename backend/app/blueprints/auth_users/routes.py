from flask import request, jsonify
from app.models import Auth_users, Contractors, db
from .schemas import auth_user_schema, login_schema, auth_user_update_password_schema, offline_pin_schema
from marshmallow import ValidationError
from werkzeug.security import generate_password_hash, check_password_hash
from . import auth_users_bp
from app.util.auth import encode_token, token_required


#Login and get token
@auth_users_bp.route('/login', methods=['POST'])
def login():
    try:
        data = login_schema.load(request.json)
    except ValidationError as e:
        return jsonify(e.messages), 400
    
    user = db.session.query(Auth_users).where(Auth_users.username==data['username']).first()

    if user and check_password_hash(user.password, data['password']):
        token = encode_token(user.id, user.role)
        return jsonify({
            'message': 'Successfully Logged in',
            'token': token,
            'user': auth_user_schema.dump(user)
        }), 200
    
    return jsonify({'error': 'invalid username or password'}), 401


# Register/Create Users - for testing
@auth_users_bp.route('', methods=['POST'])
def create_user():

    try:
        data = auth_user_schema.load(request.json)
    except ValidationError as e:
        return jsonify(e.messages), 400
    
    data['password']= generate_password_hash(data['password'])

    user = db.session.query(Auth_users).where(Auth_users.username == data['username']).first()

    if user: 
        return jsonify({'error': 'Username already taken'}), 400
    
    new_user = Auth_users(**data)
    db.session.add(new_user)
    db.session.commit()

    return auth_user_schema.jsonify(new_user), 201


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
        auth_user = db.session.get(Auth_users, user_id)

        if auth_user and check_password_hash(auth_user.password, current_password):
            auth_user.password = generate_password_hash(new_password)

            db.session.commit()    
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Updating failed'}), 500


    return jsonify({ 'message': 'Password updated successfully'}), 200


#Forgot password route (send email with reset link - will be handled on mobile app side for now, will need to integrate email service later)


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

    contractor = db.session.query(Contractors).where(Contractors.id == request.user_id).first()
    if not contractor:
        return jsonify({'error': 'contractor not found for current user'}), 404

    contractor.offline_pin = generate_password_hash(pin)
    db.session.commit()

    return jsonify({'message': 'offline pin set'}), 200

