from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from werkzeug.security import check_password_hash
from flask_login import login_user, logout_user  # Добавили импорты
from Backend.login_register.db_utils import get_db_connection

# ВАЖНО: Тебе нужно импортировать класс User, чтобы создать его объект.
# Если он объявлен в ebook.py, убедись, что нет циклического импорта.
# Либо объяви его прямо здесь, если он простой:
from flask_login import UserMixin


class User(UserMixin):
    def __init__(self, user_id, username):
        self.id = user_id
        self.username = username


auth_login_bp = Blueprint('auth_login', __name__)


@auth_login_bp.route('/login', methods=['GET', 'POST'])
def login():
    form_data = {'login': ''}

    if request.method == 'POST':
        login_input = request.form.get('login')
        password_input = request.form.get('password')
        form_data = {'login': login_input}

        conn = get_db_connection()
        user = conn.execute('SELECT * FROM Users WHERE username = ? OR email = ?',
                            (login_input, login_input)).fetchone()

        if user and check_password_hash(user['password_hash'], password_input):

            if user['is_confirmed'] == 0:
                flash("Пожалуйста, подтвердите вашу почту перед входом!", "error")
                conn.close()
                return render_template('register_login/login.html', form_data=form_data)

            # --- УСПЕШНЫЙ ВХОД (ОБНОВЛЕНО) ---

            # 1. Создаем объект пользователя для Flask-Login
            user_obj = User(user['id'], user['username'])

            # 2. Авторизуем пользователя в системе Flask-Login
            # remember=True позволит не вылетать из аккаунта при закрытии браузера
            login_user(user_obj, remember=True)

            # 3. Сохраняем данные в обычную сессию (для совместимости с твоим старым кодом)
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']

            # Логируем действие
            conn.execute('INSERT INTO Activity_Log (user_id, action) VALUES (?, ?)',
                         (user['id'], 'login'))
            conn.commit()
            conn.close()

            # Перенаправляем на главную
            return redirect(url_for('index'))

        conn.close()
        flash("Неверный логин или пароль", "error")
        return render_template('register_login/login.html', form_data=form_data)

    return render_template('register_login/login.html', form_data=form_data)


@auth_login_bp.route('/logout')
def logout():
    """Выход из аккаунта: очищаем всё"""
    logout_user()  # Завершаем сессию Flask-Login
    session.clear()  # Очищаем ручные данные
    return redirect(url_for('auth_login.login'))