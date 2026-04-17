from flask_mail import Mail
from itsdangerous import URLSafeTimedSerializer

mail = Mail()
# Этот секретный ключ должен быть таким же, как в app.secret_key
serializer = URLSafeTimedSerializer("chichiwichki")