import sqlite3
import os

# Получаем путь к текущей папке (Backend)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Если NewEBook.db лежит в Backend, путь будет таким:
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'NewEBook.db')

def get_db_connection():
    # Используй полный путь к файлу
    conn = sqlite3.connect('/EBook/NewEBook.db')
    conn.row_factory = sqlite3.Row
    return conn