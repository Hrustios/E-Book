from flask import Flask, render_template
from extensions import mail  # Просто extensions, он лежит в той же папке
from login_register.auth_reg import auth_reg_bp  # Путь от текущего файла
from login_register.auth_login import auth_login_bp

app = Flask(__name__,
            template_folder='../Frontend',
            static_folder='../Frontend')

app.secret_key = "chichiwichki"

# Настройки почты
app.config['MAIL_SERVER'] = '74.125.131.108'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USERNAME'] = 'wolfy7406@gmail.com'
app.config['MAIL_PASSWORD'] = 'tgsxjqgfboubzjbd' # НЕ основной пароль!
app.config['MAIL_DEFAULT_SENDER'] = 'wolfy7406@gmail.com'

mail.init_app(app)

@app.route('/')
def index():
    return render_template('main/index.html') # Указываем путь через папку main
app.register_blueprint(auth_reg_bp)
app.register_blueprint(auth_login_bp)

if __name__ == '__main__':
    app.run(debug=True)