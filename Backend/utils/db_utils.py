import sqlite3
from flask_login import UserMixin
from Backend.config import Config

class User(UserMixin):
    def __init__(self, user_id, username):
        self.id = user_id
        self.username = username

def get_db_connection():
    try:
        conn = sqlite3.connect(Config.DB_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        print(f"Ошибка подключения к базе ({Config.DB_PATH}): {e}")
        raise