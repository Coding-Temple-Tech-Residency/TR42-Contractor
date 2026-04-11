from jose import jwt
import jose
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify
import os


# Loaded from the SECRET_KEY environment variable (set in backend/.env).
# Falls back to a placeholder that will cause an obvious startup error
# if the env var is missing, rather than silently using a weak key.
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY environment variable is not set. "
        "Copy backend/.env.example to backend/.env and set a strong random value."
    )
assert isinstance(SECRET_KEY, str)  # narrows type for static analysis

def encode_token(user_id, role):
    payload = {
        'exp': datetime.now(timezone.utc) + timedelta(hours=14),
        'iat': datetime.now(timezone.utc),
        'sub': str(user_id),
        'role': role
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
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
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            request.user_id = int(data['sub'])
            request.user_role = data['role']

        except jose.exceptions.ExpiredSignatureError:
            return jsonify({'message': 'token is expired'}), 403
        except jose.exceptions.JWTError:
            return jsonify({'message': 'invalid token'}), 403
        
        return f(*args, **kwargs)

    return decoration

def vendor_required(f):
    @wraps(f)
    @token_required
    def wrapper(*args, **kwargs):
        if request.user_role != "vendor":
            return jsonify({'error': 'Vendor privileges required'}), 403
        return f(*args, **kwargs)
    return wrapper