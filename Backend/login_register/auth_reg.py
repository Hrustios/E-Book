import re
from flask import Blueprint, render_template, request, flash, redirect, url_for
from flask_mail import Message
from Backend.extensions import mail, serializer
from Backend.utils.db_utils import get_db_connection
from werkzeug.security import generate_password_hash

# Имя блюпринта 'auth_reg' используется как префикс в url_for
auth_reg_bp = Blueprint('auth_reg', __name__)


def is_valid_email_domain(email):
    """
    Проверяет, что почта имеет корректный формат домена (напр. @domain.com).
    Исключает мусорные строки вида @fdsdasd.
    """
    # Регулярное выражение: текст @ домен . зона (минимум 2 символа для зоны)
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

        # 1. Проверка длины (ограничение 100 символов)
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

        # 2. Проверка валидности домена почты
        if not is_valid_email_domain(email):
            flash("Введите корректный адрес почты (например, example@mail.ru).", "error")
            return render_template('register_login/register.html', form_data=form_data)

        # Базовая проверка на существование пользователя
        with get_db_connection() as conn:
            user_exists = conn.execute('SELECT id FROM Users WHERE email = ? OR username = ?',
                                       (email, username)).fetchone()
            if user_exists:
                flash("Пользователь с такой почтой или ником уже существует", "error")
                return render_template('register_login/register.html', form_data=form_data)

        # 3. Генерация токена для подтверждения
        token = serializer.dumps(email, salt='email-confirm')
        # ВАЖНО: endpoint 'auth_reg.confirm_email' ссылается на функцию ниже
        confirm_url = url_for('auth_reg.confirm_email', token=token, _external=True)

        try:
            # 4. Отправка письма
            msg = Message('Подтверждение почты E-Book', recipients=[email])
            msg.body = f'Привет, {username}! Для активации аккаунта перейди по ссылке: {confirm_url}'
            mail.send(msg)

            # 5. Сохранение в базу с флагом is_confirmed = 0
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