from jose import jwt
import jose
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, current_app


def _get_secret():
    return current_app.config['JWT_SECRET_KEY']


def encode_token(user_id, role):
    payload = {
        'exp': datetime.now(timezone.utc) + timedelta(hours=14),
        'iat': datetime.now(timezone.utc),
        'sub': str(user_id),
        'role': role
    }

    token = jwt.encode(payload, _get_secret(), algorithm='HS256')
    return token

def token_required(f):
    @wraps(f)
    def decoration(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split()[1]

        if not token:
            return jsonify({'error': 'token missing from authorization headers'}), 401

        try:
            data = jwt.decode(token, _get_secret(), algorithms=['HS256'])
            request.user_id = int(data['sub'])

        except jose.exceptions.ExpiredSignatureError:
            return jsonify({'message': 'token is expired'}), 403
        except jose.exceptions.JWTError:
            return jsonify({'message': 'invalid token'}), 403

        return f(*args, **kwargs)

    return decoration