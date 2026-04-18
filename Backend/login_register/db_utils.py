import sqlite3
import os

# Получаем путь к текущей папке (Backend)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Если NewEBook.db лежит в Backend, путь будет таким:
DB_PATH = os.path.join(BASE_DIR, '..', 'NewEBook.db') # '..' если база в корне Backend

def get_db_connection():
    # Используй полный путь к файлу
    conn = sqlite3.connect('C:/Users/wolfy/Ebook/EBook/Backend/NewEBook.db')
    conn.row_factory = sqlite3.Row
    return conn