from flask import Blueprint, request, jsonify
from services.email_service import send_custom_message, send_multiple_messages
from services.auth_service import requires_auth

messages = Blueprint('messages', __name__)


@messages.route('/send_multiple', methods=['POST'])
@requires_auth
def send_multiple():
    try:
        data = request.get_json()
        if not data.get('email_templates') or not data.get('user_id'):
            raise ValueError('Missing email_templates or user_id in the request.')
        result = send_multiple_messages(data.get('email_templates'), data['user_id'])
        return jsonify({'message': result['message'], 'status': result.get('status', 200)})
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({f'Unexpected error occurred: {str(e)}'}), 500

@messages.route('/send_custom', methods=['POST'])
@requires_auth
def send_custom():
    data = request.get_json()
    result = send_custom_message(data)
    return result['message'], result.get('status', 200)