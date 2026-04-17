from flask import Flask, render_template # Добавил render_template
from extensions import mail
from auth_reg import auth_reg_bp
from auth_login import auth_login_bp
import os

app = Flask(__name__,
            template_folder='../Frontend/templates',
            static_folder='../Frontend/static')

app.secret_key = "chichiwichki"

# Настройки почты
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'wolfy7406@gmail.com'
app.config['MAIL_PASSWORD'] = 'dkdlnrlsoqoafdsc'
app.config['MAIL_DEFAULT_SENDER'] = 'wolfy7406@gmail.com'

mail.init_app(app)

@app.route('/')
def index():
    return "<h1>Главная страница E-Book</h1><p>Вы успешно вошли!</p>"
# ------------------------

app.register_blueprint(auth_reg_bp)
app.register_blueprint(auth_login_bp)

if __name__ == '__main__':
    app.run(debug=True)