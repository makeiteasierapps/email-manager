import os
import hashlib
import hmac
from functools import wraps
from flask import request, abort, Response

def is_valid_signature(token, timestamp, signature):
    # Mailgun API Key from your dashboard
    signing_key = os.getenv('MAILGUN_WEBHOOK_KEY')

    # Create the HMAC signature
    hmac_digest = hmac.new(key=signing_key.encode(),
                           msg=('{}{}'.format(timestamp, token)).encode(),
                           digestmod=hashlib.sha256).hexdigest()
    return hmac.compare_digest(str(signature), str(hmac_digest))

def mailgun_auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.is_json:
            # Handle JSON payload
            signature_data = request.json.get('signature', {})
            token = signature_data.get('token')
            timestamp = signature_data.get('timestamp')
            signature = signature_data.get('signature')
        else:
            # Handle form payload
            token = request.form.get('token')
            timestamp = request.form.get('timestamp')
            signature = request.form.get('signature')

        # Verify the request
        if not is_valid_signature(token, timestamp, signature):
            abort(401)

        return f(*args, **kwargs)
    return decorated_function

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        request_key = request.headers.get('Auth-Key')
        auth_key = os.getenv('MY_AUTH_KEY')

        if request_key != auth_key:
            return Response('Unauthorized', 401)
        return f(*args, **kwargs)
    return decorated
