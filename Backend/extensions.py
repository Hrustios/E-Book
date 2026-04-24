from flask_mail import Mail
from itsdangerous import URLSafeTimedSerializer
from flask_login import UserMixin
mail = Mail()
serializer = URLSafeTimedSerializer("chichiwichki")
