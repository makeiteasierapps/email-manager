import os
import requests
from datetime import datetime, timedelta, timezone
from flask import current_app
from dotenv import load_dotenv

def handle_follow_up_emails():
    db = current_app.db
    # Get a reference to the 'emails' collection
    emails_ref = db.collection('clients').document('uid').collection('emails')
   
    # Create a query where 'response_received' is False
    query = emails_ref.where('response_received', '==', False)

    # Execute the query and get the documents
    docs = query.stream()

    # Convert documents to a list of dictionaries, include the document ID
    filtered_emails = [{**doc.to_dict(), 'id': doc.id} for doc in docs]

    follow_ups_sent = []
    for email in filtered_emails:
        #extract the client name, brand name, and sender's name from the first email
        client_name = email['recipient_name']
        brand_name = email['recipient_company']
        recipient_email = email['recipient_email']
        sender_name = email['sender_name']
        sent_timestamp = email['sent_timestamp']
        time_since_sent = datetime.now(timezone.utc) - sent_timestamp

        # If it's been more than 3 days and the first follow-up hasn't been sent, send it
        if time_since_sent > timedelta(days=3) and not email['follow_up_1_sent']:
            follow_up_info = send_follow_up(client_name, brand_name, sender_name, recipient_email, 0)
            follow_ups_sent.append(follow_up_info)
            emails_ref.document(email['id']).update({'follow_up_1_sent': True})

        # If it's been more than 5 days and the second follow-up hasn't been sent, send it
        elif time_since_sent > timedelta(days=5) and not email['follow_up_2_sent']:
            follow_up_info = send_follow_up(client_name , brand_name, sender_name, recipient_email, 1)
            follow_ups_sent.append(follow_up_info)
            emails_ref.document(email['id']).update({'follow_up_2_sent': True})

    return follow_ups_sent

def send_follow_up(client_name , brand_name, sender_name, recipient_email, follow_up_number):

    load_dotenv()

    api_keys = {
        'testing': os.getenv('DEV_TEST_KEY'),
    }

    api_key = api_keys.get('testing')
    if not api_key:
        return {'message': 'Invalid user ID'}, 400
    

    follow_up_emails = {
        '3-day': f'''<html>
        <body>
        <p>Hi {client_name},</p>
        <p>I am following up on my previous email regarding our interest in working with {brand_name}. We believe in the potential of a successful collaboration.</p>
        <p>Our clients have seen significant benefits from our services, including press features, social media impressions, and more. We are confident that we can provide similar results for {brand_name}.</p>
        <p>If you are available for a call this week to discuss strategies for boosting your brand's exposure, please let me know. Alternatively, if there's a more suitable contact on the team, feel free to forward this message to them.</p>
        <p>Looking forward to hearing from you soon!</p>
        <br>
        <img src='' alt='Senders Signature'>
        <p style='font-size: 0.8em; font-style: italic; margin-top: 20px;'>
            <strong style='font-size: 1em;'>Confidentiality Notice:</strong> No part of this email may be shared, forwarded, blogged or otherwise reproduced without express written permission from the sender. 
            This e-mail message and any attachments are intended solely for the individual or individuals designated above. It may contain confidential or proprietary information. 
            If you are not the intended recipient, you are not authorized to read, copy, retain or distribute this message. If you receive this message in error, please notify the sender by reply e-mail and delete this message.
        </p>
        </body> 
        </html>''',

        '5-day': f'''<html>
        <body>
        <p>Hi {client_name},</p>
        <p>I wanted to follow up and see if you've had a chance to review my previous message. I've seen some pretty cool opportunities just this week for {brand_name} with a few top publications so I know there are lots of opportunities!</p>
        <p>If you're interested in gaining more exposure, please let me know. If not, I completely understand and we will continue to support {brand_name} from the sidelines.</p>
        <p>Thank you,</p>
        <br>
        <img src='' alt='Senders Signature>
        <p style='font-size: 0.8em; font-style: italic; margin-top: 20px;'>
            <strong style='font-size: 1em;'>Confidentiality Notice:</strong> No part of this email may be shared, forwarded, blogged or otherwise reproduced without express written permission from the sender. 
            This e-mail message and any attachments are intended solely for the individual or individuals designated above. It may contain confidential or proprietary information. 
            If you are not the intended recipient, you are not authorized to read, copy, retain or distribute this message. If you receive this message in error, please notify the sender by reply e-mail and delete this message.
        </p>
        </body>
        </html>'''
    }
    follow_up_keys = ['3-day', '5-day']
    email_to_send = follow_up_emails[follow_up_keys[follow_up_number]]

    try:
        response = requests.post(
            "https://api.mailgun.net/v3/mg.shauno.co/messages",
            auth=("api", api_key),
            data={"from": "John Doe <test@mg.shauno.co>",
                  "to": [recipient_email],
                  "subject": f"""Re: Custom Sbject for {brand_name}""",
                  "text": email_to_send,
                  "html": email_to_send},
            timeout=5) 
    except requests.exceptions.RequestException as e:
        return {'message': str(e)}, 500

    if response.status_code != 200:
        return {'message': f"Error: {response.status_code}, {response.text}"}, response.status_code
    

    return {
    'recipient_name': client_name,
    'recipient_brand': brand_name,
    'recipient_email': recipient_email,
    'senders_name': sender_name,
    'follow_up_number': follow_up_number + 1
    }

