import os
from werkzeug.utils import secure_filename
from flask import request, current_app, Blueprint
from utils.nudge_bot import handle_follow_up_emails
from services.email_service import fetch_emails
from services.auth_service import requires_auth
from utils.extract_csv import process_csv


manager = Blueprint('manager', __name__)
@manager.route('/process_csv', methods=['POST'])
@requires_auth
def manage_csv_file():
    if 'file' not in request.files:
        return 'No file part in the request.', 400

    
    file = request.files['file']
    print(file)
    
    if file.filename == '':
        return 'No selected file.', 400
    
    if not file.filename.lower().endswith('.csv'):
        return 'Invalid file type. Only .csv files are allowed.', 400

    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join('/tmp', filename)
        file.save(filepath)
        data_list, email_templates = process_csv(filepath)

        return {'data_list': data_list, 'email_templates': email_templates}, 200

    return 'Unexpected error occurred.', 500

@manager.route('/fetch_email_data', methods=['GET'])
@requires_auth
def fetch_email_data():
    try:
        email_data = fetch_emails()
        return {'message': 'Email data fetched successfully', 'email_data': email_data}, 200
    except Exception as e:
        current_app.logger.error(f"Error fetching email data: {str(e)}")
        return {'message': f"Error fetching email data: {str(e)}"}, 500

# Request comes from Cronitor
@manager.route('/follow_up_emails', methods=['GET'])
@requires_auth
def follow_up():
    try:
        follow_ups_sent = handle_follow_up_emails()
        return {'message': 'Follow up emails handled successfully', 'follow_ups_sent': follow_ups_sent}, 200
    except Exception as e:
        current_app.logger.error(f"Error handling follow up emails: {str(e)}")
        return {'message': f"Error handling follow up emails: {str(e)}"}, 500