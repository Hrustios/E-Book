import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Базовые пути
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

    # Секреты (берем из .env, иначе используем дефолт для разработки)
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-if-not-set')

    # База данных
    DB_NAME = os.getenv('DB_NAME', 'NewEBook.db')
    DB_PATH = os.path.join(BASE_DIR, DB_NAME)

    # Конфигурация почты
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True') == 'True'
    MAIL_USE_SSL = os.getenv('MAIL_USE_SSL', 'False') == 'True'

    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', os.getenv('MAIL_USERNAME'))