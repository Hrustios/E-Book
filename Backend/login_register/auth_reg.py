from flask import Blueprint, render_template, request, flash, redirect, url_for
from flask_mail import Message
from Backend.extensions import mail, serializer
# ИСПРАВЛЕНО: Правильный путь к общей утилите базы данных
from Backend.utils.db_utils import get_db_connection
from werkzeug.security import generate_password_hash

auth_reg_bp = Blueprint('auth_reg', __name__)


@auth_reg_bp.route('/register', methods=['GET', 'POST'])
def register():
    form_data = {'username': '', 'email': ''}
    if request.method == 'POST':
        email = request.form.get('email')
        username = request.form.get('username')
        password = request.form.get('password')
        form_data = {'username': username, 'email': email}

        # Базовая проверка на существование пользователя
        with get_db_connection() as conn:
            user_exists = conn.execute('SELECT id FROM Users WHERE email = ? OR username = ?',
                                       (email, username)).fetchone()
            if user_exists:
                flash("Пользователь с такой почтой или ником уже существует", "error")
                return render_template('register_login/register.html', form_data=form_data)

        # 1. Генерируем токен
        token = serializer.dumps(email, salt='email-confirm')
        confirm_url = url_for('auth_reg.confirm_email', token=token, _external=True)

        # 2. Отправляем письмо
        try:
            msg = Message('Подтверждение почты E-Book', recipients=[email])
            msg.body = f'Привет, {username}! Для активации аккаунта перейди по ссылке: {confirm_url}'
            mail.send(msg)

            # 3. Пишем в базу (is_confirmed = 0)
            hashed_pw = generate_password_hash(password)
            with get_db_connection() as conn:
                conn.execute('INSERT INTO Users (username, email, password_hash, is_confirmed) VALUES (?, ?, ?, 0)',
                             (username, email, hashed_pw))
                conn.commit()

            flash("Письмо отправлено! Проверьте почту.", "info")
            return redirect(url_for('auth_login.login'))
        except Exception as e:
            print(f"Mail Error: {e}")
            flash(f"Ошибка при отправке письма. Проверьте правильность почты.", "error")

    return render_template('register_login/register.html', form_data=form_data)


@auth_reg_bp.route('/confirm_email/<token>')
def confirm_email(token):
    try:
        email = serializer.loads(token, salt='email-confirm', max_age=3600)  # ссылка на 1 час
    except Exception:
        flash("Ссылка недействительна или истекла.", "error")
        return redirect(url_for('auth_reg.register'))

    with get_db_connection() as conn:
        # Проверяем, есть ли такой юзер, прежде чем подтверждать
        user = conn.execute('SELECT id FROM Users WHERE email = ?', (email,)).fetchone()
        if user:
            conn.execute('UPDATE Users SET is_confirmed = 1 WHERE email = ?', (email,))
            conn.commit()
            flash("Почта подтверждена! Войдите в аккаунт.", "success")
        else:
            flash("Пользователь не найден.", "error")

    return redirect(url_for('auth_login.login'))