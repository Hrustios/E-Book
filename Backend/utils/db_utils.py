import sqlite3
import os
from flask_login import UserMixin

current_dir = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.abspath(os.path.join(current_dir, '..', '..'))
DB_PATH = os.path.join(BASE_DIR, 'NewEBook.db')

class User(UserMixin):
    def __init__(self, user_id, username):
        self.id = user_id
        self.username = username

def get_db_connection():
    try:
        # check_same_thread=False критически важен для Flask
        conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        print(f"Ошибка подключения к базе ({DB_PATH}): {e}")
        raise