from flask import Flask
from flask_login import LoginManager

# Внутренние импорты расширений и утилит
from Backend.extensions import mail
from Backend.utils.db_utils import get_db_connection, User # User теперь тянется из utils

# Импорты блюпринтов авторизации
from Backend.login_register.auth_reg import auth_reg_bp
from Backend.login_register.auth_login import auth_login_bp
from Backend.login_register.auth_reset import auth_reset

# Импорты новых блюпринтов роутов
from Backend.routes.main_routes import main_bp
from Backend.routes.book_routes import book_bp
from Backend.routes.user_routes import user_bp

app = Flask(__name__,
            template_folder='Frontend',
            static_folder='Frontend',
            static_url_path='')

app.secret_key = "chichiwichki"

# Конфигурация почты
app.config.update(
    MAIL_SERVER='smtp.gmail.com',
    MAIL_PORT=587,
    MAIL_USE_TLS=True,
    MAIL_USE_SSL=False,
    MAIL_USERNAME='wolfy7406@gmail.com',
    MAIL_PASSWORD='tgsxjqgfboubzjbd',
    MAIL_DEFAULT_SENDER='wolfy7406@gmail.com'
)

# Инициализация расширений
mail.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth_login.login'

# Регистрация всех блюпринтов
app.register_blueprint(main_bp)
app.register_blueprint(book_bp)
app.register_blueprint(user_bp)
app.register_blueprint(auth_reg_bp)
app.register_blueprint(auth_login_bp)
app.register_blueprint(auth_reset, url_prefix='/auth') # Добавил url_prefix для порядка

@login_manager.user_loader
def load_user(user_id):
    try:
        with get_db_connection() as conn:
            user_data = conn.execute('SELECT id, username FROM Users WHERE id = ?', (int(user_id),)).fetchone()
        if user_data:
            return User(user_data['id'], user_data['username'])
    except Exception as e:
        print(f"Ошибка загрузки пользователя: {e}")
    return None

if __name__ == '__main__':
    app.run(debug=True)