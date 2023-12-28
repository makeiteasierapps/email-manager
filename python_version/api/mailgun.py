from flask import Blueprint, request, current_app
from services.auth_service import mailgun_auth_required

mailgun = Blueprint('api', __name__)

# Webhook endpoint to listen for email replies. Requires setup on the mailgun side.
@mailgun.route('/webhook/listen', methods=['POST'])
@mailgun_auth_required
def handle_webhook():
    """
     Listens for a reply to a sent email and updates the "response_received" to true
    """
    sender = request.form['sender']
    
    docs = current_app.db.collection('clients').document('uid').collection('emails').where('recipient_email', '==', sender).stream()

    for doc in docs:
        doc.reference.update({'response_received': True})
    return 'OK'
