from flask import Blueprint, request
from services.email_service import send_custom_message, send_multiple_messages
from services.auth_service import requires_auth

messages = Blueprint('messages', __name__)


@messages.route('/send_multiple', methods=['POST'])
@requires_auth
def send_multiple():
    data = request.get_json()
    result = send_multiple_messages(data.get('email_templates'), data['user_id'])
    return result['message'], result.get('status', 200)

@messages.route('/send_custom', methods=['POST'])
@requires_auth
def send_custom():
    data = request.get_json()
    result = send_custom_message(data)
    return result['message'], result.get('status', 200)