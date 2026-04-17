import sqlite3
import os

# Путь к базе данных (на уровень выше, если запускаем из Backend)
DB_PATH = os.path.join(os.path.dirname(__file__), 'NewEBook.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn