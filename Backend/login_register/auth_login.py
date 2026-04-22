from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from werkzeug.security import check_password_hash
from flask_login import login_user, logout_user

# ИМПОРТЫ: Теперь всё берем из единого места в utils
from Backend.utils.db_utils import get_db_connection, User

# Указываем путь к шаблонам, если нужно (обычно для этого BP они в общей папке)
auth_login_bp = Blueprint('auth_login', __name__)

@auth_login_bp.route('/login', methods=['GET', 'POST'])
def login():
    form_data = {'login': ''}

    if request.method == 'POST':
        login_input = request.form.get('login')
        password_input = request.form.get('password')
        form_data = {'login': login_input}

        with get_db_connection() as conn:
            user = conn.execute('SELECT * FROM Users WHERE username = ? OR email = ?',
                                (login_input, login_input)).fetchone()

            if user and check_password_hash(user['password_hash'], password_input):
                if user['is_confirmed'] == 0:
                    flash("Пожалуйста, подтвердите вашу почту перед входом!", "error")
                    return render_template('register_login/login.html', form_data=form_data)

                # --- УСПЕШНЫЙ ВХОД ---
                # 1. Создаем объект пользователя из нашего общего класса
                user_obj = User(user['id'], user['username'])

                # 2. Авторизуем в Flask-Login
                login_user(user_obj, remember=True)

                # 3. Сохраняем в сессию для совместимости
                session['user_id'] = user['id']
                session['username'] = user['username']
                session['role'] = user['role']

                # Логируем действие
                conn.execute('INSERT INTO Activity_Log (user_id, action) VALUES (?, ?)',
                             (user['id'], 'login'))
                conn.commit()

                # ИСПРАВЛЕНО: Теперь переход на main.index, так как это Blueprint
                return redirect(url_for('main.index'))

        flash("Неверный логин или пароль", "error")
        return render_template('register_login/login.html', form_data=form_data)

    return render_template('register_login/login.html', form_data=form_data)

@auth_login_bp.route('/logout')
def logout():
    logout_user()
    session.clear()
    # ИСПРАВЛЕНО: Указываем полное имя роута
    return redirect(url_for('auth_login.login'))