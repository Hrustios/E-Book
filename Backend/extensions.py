from flask_mail import Mail
from itsdangerous import URLSafeTimedSerializer
from flask_login import UserMixin
mail = Mail()
# Этот секретный ключ должен быть таким же, как в app.secret_key
serializer = URLSafeTimedSerializer("chichiwichki")
