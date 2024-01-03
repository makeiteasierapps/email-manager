import os
import requests
from datetime import datetime
from google.api_core.exceptions import GoogleAPICallError
from flask import current_app

api_keys = {
    'testing': os.getenv('DEV_TEST_KEY'),
}

def send_custom_message(data):
    required_fields = ['sender_name', 'sender_email', 'recipient_email', 'recipient_name', 'recipient_company', 'subject', 'message']
    for field in required_fields:
        if not data.get(field):
            return {'message': f'{field} is required', 'status': 400}
        
    user_id = data.get('user_id')
    sender_name = data.get('sender_name')
    sender_email = data.get('sender_email')
    recipient_email = data.get('recipient_email')
    recipient_name = data.get('recipient_name')
    recipient_company = data.get('recipient_company')
    subject = data.get('subject')
    message = data.get('message')

    api_key = api_keys.get(user_id)
    if not api_key:
        return {'message': 'Invalid user ID', 'status': 400}
    
    html_content = f"""
    <html>
        <body>
            {message}      
        </body>
    </html>
    """

    try:
        response = requests.post(
            "https://api.mailgun.net/v3/mg.shauno.co/messages", 
            auth=("api", api_key),
            data={"from": f"{sender_name} <{sender_email}>",
                  "to": [recipient_email],
                  "subject": subject,
                  "text": message,
                  "html": html_content,},
            timeout=5) 
    except requests.exceptions.RequestException as e:
        return {'message': str(e), 'status': 500}

    if response.status_code != 200:
        return {'message': f"Error: {response.status_code}, {response.text}", 'status': response.status_code}

    try:
        doc_ref = current_app.db.collection('clients').document('uid').collection('emails').document()
        doc_ref.set({
            'recipient_email': recipient_email,
            'recipient_name': recipient_name,
            'recipient_company': recipient_company,
            'sender_name': sender_name,
            'sent_timestamp': datetime.now(),
            'follow_up_1_sent': False,
            'follow_up_2_sent': False,
            'response_received': False,
        })
    except (ValueError, TypeError, GoogleAPICallError) as e:
        return {'message': f"Database error: {str(e)}", 'status': 500}

    return {'message': 'Email sent successfully', 'status': 200}

def send_multiple_messages(email_templates, user_id):
    results = []
    for template in email_templates:
        data = {
            'user_id': user_id,
            'sender_name': 'John Doe',
            'sender_email': 'test@mg.shauno.co',
            'recipient_email': template['email'],
            'recipient_name': template['recipient_name'],
            'recipient_company': template['recipient_company'],
            'subject': template['subject'],
            'message': template['message']
        }
        result = send_custom_message(data)
        if result['status'] != 200:
            return result
        results.append(result)
    if not results:
        return {'message': 'No emails were sent', 'status': 400}
    return {'message': 'All emails sent successfully', 'status': 200}

def fetch_emails():
    try:
        docs = current_app.db.collection('clients').document('uid').collection('emails').get()
        emails = [doc.to_dict() for doc in docs]
        return emails
    except (ValueError, TypeError, GoogleAPICallError) as e:
        return {'message': f"Database error: {str(e)}"}, 500