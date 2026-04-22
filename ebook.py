import os
from flask import Flask
from flask_login import LoginManager

# Импорт твоего конфига
from Backend.config import Config
from Backend.extensions import mail
from Backend.utils.db_utils import get_db_connection, User

# Импорты блюпринтов
from Backend.login_register.auth_reg import auth_reg_bp
from Backend.login_register.auth_login import auth_login_bp
from Backend.login_register.auth_reset import auth_reset
from Backend.routes.main_routes import main_bp
from Backend.routes.book_routes import book_bp
from Backend.routes.user_routes import user_bp


def create_app():
    # Сейчас backend_dir это C:\Users\wolfy\EBook\EBook
    backend_dir = os.path.abspath(os.path.dirname(__file__))

    # Раз папка Frontend находится в этой же директории, просто соединяем пути
    frontend_dir = os.path.join(backend_dir, 'Frontend')

    app = Flask(__name__,
                root_path=backend_dir,
                template_folder=frontend_dir,
                static_folder=frontend_dir,
                static_url_path='')

    app.config.from_object(Config)

    # Инициализация расширений
    mail.init_app(app)

    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth_login.login'

    # Регистрация блюпринтов
    app.register_blueprint(main_bp)
    app.register_blueprint(book_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(auth_reg_bp)
    app.register_blueprint(auth_login_bp)
    app.register_blueprint(auth_reset, url_prefix='/auth')
    with app.app_context():
        for rule in app.url_map.iter_rules():
            print(f"Endpoint: {rule.endpoint} -> {rule}")
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
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)