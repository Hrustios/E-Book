import re
import threading

from flask import Blueprint, render_template, request, flash, redirect, url_for
from flask_mail import Message
from Backend.extensions import mail, serializer
from Backend.utils.db_utils import get_db_connection
from werkzeug.security import generate_password_hash
from Backend.utils.mail_utils import send_registration_email, send_confirmation_handler

auth_reg_bp = Blueprint('auth_reg', __name__)


def is_valid_email_domain(email):
    regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return re.match(regex, email) is not None


@auth_reg_bp.route('/register', methods=['GET', 'POST'])
def register():
    form_data = {'username': '', 'email': ''}
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        form_data = {'username': username, 'email': email}
        if len(username) > 100 or len(email) > 100:
            flash("Никнейм и почта не должны превышать 100 символов.", "error")
            return render_template('register_login/register.html', form_data=form_data)

        if len(password) < 6:
            flash("Пароль должен содержать минимум 6 символов.", "error")
            return render_template('register_login/register.html', form_data=form_data)

        if len(password) > 100:
            flash("Пароль слишком длинный (макс. 100 символов).", "error")
            return render_template('register_login/register.html', form_data=form_data)
        if password != confirm_password:
            flash("Пароли не совпадают!", "error")
            return render_template('register_login/register.html', form_data=form_data)

        if not is_valid_email_domain(email):
            flash("Введите корректный адрес почты (например, example@mail.ru).", "error")
            return render_template('register_login/register.html', form_data=form_data)

        with get_db_connection() as conn:
            user_exists = conn.execute('SELECT id FROM Users WHERE email = ? OR username = ?',
                                       (email, username)).fetchone()
            if user_exists:
                flash("Пользователь с такой почтой или ником уже существует", "error")
                return render_template('register_login/register.html', form_data=form_data)

        token = serializer.dumps(email, salt='email-confirm')
        confirm_url = url_for('auth_reg.confirm_email', token=token, _external=True)

        try:
            hashed_pw = generate_password_hash(password)
            with get_db_connection() as conn:
                conn.execute('INSERT INTO Users (username, email, password_hash, is_confirmed) VALUES (?, ?, ?, 0)',
                             (username, email, hashed_pw))
                conn.commit()

            email_thread = threading.Thread(
                target=send_confirmation_handler,
                args=(email, username, confirm_url)
            )
            email_thread.start()

            flash("Регистрация почти завершена! Проверьте почту для подтверждения.", "info")
            return redirect(url_for('auth_login.login'))

        except Exception as e:
            print(f"Ошибка регистрации: {e}")
            flash(f"Произошла ошибка при регистрации.", "error")

        return render_template('register_login/register.html', form_data=form_data)


@auth_reg_bp.route('/confirm_email/<token>')
def confirm_email(token):
    """
    Обработка ссылки из письма.
    """
    try:
        # Ссылка живет 1 час (3600 секунд)
        email = serializer.loads(token, salt='email-confirm', max_age=3600)
    except Exception:
        flash("Ссылка недействительна или истекла.", "error")
        return redirect(url_for('auth_reg.register'))

    with get_db_connection() as conn:
        # Проверяем наличие пользователя в базе
        user = conn.execute('SELECT id FROM Users WHERE email = ?', (email,)).fetchone()
        if user:
            conn.execute('UPDATE Users SET is_confirmed = 1 WHERE email = ?', (email,))
            conn.commit()
            flash("Почта подтверждена! Войдите в аккаунт.", "success")
        else:
            flash("Пользователь не найден.", "error")

    return redirect(url_for('auth_login.login'))