from api.mailgun import mailgun
from api.manager import manager
from api.messges import messages

def register_blueprints(app):
    app.register_blueprint(mailgun)
    app.register_blueprint(manager)
    app.register_blueprint(messages)