from flask import Flask, current_app
from firebase_admin import firestore, credentials
import firebase_admin
from views import register_blueprints
from flask_cors import CORS

def create_app():
    cred = credentials.Certificate("../firebase_service_account.json")
    firebase_admin.initialize_app(cred)
    myapp = Flask(__name__)
    CORS(myapp)

    # Create the Firestore client
    with myapp.app_context():
        current_app.db = firestore.client()
    
    register_blueprints(myapp)
    return myapp


app = create_app()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)