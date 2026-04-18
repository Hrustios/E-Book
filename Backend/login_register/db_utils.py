import sqlite3
import os

# 1. Получаем абсолютный путь к папке, где лежит текущий файл (db_utils.py)
current_dir = os.path.dirname(os.path.abspath(__file__))

# 2. Поднимаемся на два уровня вверх, чтобы попасть в корень проекта, где лежит база
# (из Backend/login_register/ -> в Backend/ -> в корень)
BASE_DIR = os.path.abspath(os.path.join(current_dir, '..', '..'))

# 3. Соединяем путь с именем файла базы
DB_PATH = os.path.join(BASE_DIR, 'NewEBook.db')

def get_db_connection():
    try:
        # check_same_thread=False нужен для работы SQLite в многопоточном режиме Gunicorn
        conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        print(f"Ошибка подключения к базе: {e}")
        raise