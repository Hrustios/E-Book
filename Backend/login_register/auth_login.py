from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from werkzeug.security import check_password_hash
from login_register.db_utils import get_db_connection # Убрали EBook.Backend

auth_login_bp = Blueprint('auth_login', __name__)


@auth_login_bp.route('/login', methods=['GET', 'POST'])
def login():
    # Данные для сохранения в поле при ошибке (чтобы логин не стирался)
    form_data = {'login': ''}

    if request.method == 'POST':
        login_input = request.form.get('login')
        password_input = request.form.get('password')
        form_data = {'login': login_input}

        conn = get_db_connection()
        # Ищем пользователя по username или email
        user = conn.execute('SELECT * FROM Users WHERE username = ? OR email = ?',
                            (login_input, login_input)).fetchone()

        # 1. Сначала проверяем существование пользователя и хэш пароля
        if user and check_password_hash(user['password_hash'], password_input):

            # 2. ПРОВЕРКА ПОДТВЕРЖДЕНИЯ ПОЧТЫ
            # Если в базе 0, значит ссылка в письме еще не нажата
            if user['is_confirmed'] == 0:
                flash("Пожалуйста, подтвердите вашу почту перед входом!", "error")
                conn.close()
                return render_template('register_login/login.html', form_data=form_data)

            # 3. УСПЕШНЫЙ ВХОД
            # Сохраняем данные в сессию
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']

            # Логируем действие в Activity_Log
            conn.execute('INSERT INTO Activity_Log (user_id, action) VALUES (?, ?)',
                         (user['id'], 'login'))
            conn.commit()
            conn.close()

            # Перенаправляем на главную (функция index в ebook.py)
            return redirect(url_for('index'))

        # Если пароль неверный или пользователя нет
        conn.close()
        flash("Неверный логин или пароль", "error")
        return render_template('register_login/login.html', form_data=form_data)

    # Обычный GET запрос (первое открытие страницы)
    return render_template('register_login/login.html', form_data=form_data)


@auth_login_bp.route('/logout')
def logout():
    """Выход из аккаунта: очищаем сессию и шлем на страницу входа"""
    session.clear()
    return redirect(url_for('auth_login.login'))