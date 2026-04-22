from flask import Blueprint, render_template, request, flash, redirect, url_for, session
from flask_mail import Message
import random
from werkzeug.security import generate_password_hash

# ИСПРАВЛЕНО: Правильные импорты из твоих утилит и расширений
from Backend.utils.db_utils import get_db_connection
from Backend.extensions import mail

auth_reset = Blueprint('auth_reset', __name__)

@auth_reset.route('/reset_password', methods=['GET', 'POST'])
def reset_password():
    if request.method == 'GET':
        return render_template('register_login/reset_password.html', step=1, form_data={'email': ''})

    # Получаем данные из формы
    step_val = request.form.get('step')
    step = int(step_val) if step_val else 1
    email = request.form.get('email', '').strip()
    form_data = {'email': email}

    # ШАГ 1: ПРОВЕРКА ПОЧТЫ И ОТПРАВКА КОДА
    if step == 1:
        with get_db_connection() as conn:
            user = conn.execute('SELECT id FROM Users WHERE email = ?', (email,)).fetchone()

        if not user:
            flash("Пользователь с такой почтой не найден", "error")
            return render_template('register_login/reset_password.html', step=1, form_data=form_data)

        # Генерация кода
        code = str(random.randint(100000, 999999))
        session['reset_code'] = code
        session['reset_email'] = email

        try:
            msg = Message("E-Book: Код восстановления пароля", recipients=[email])
            msg.body = f"Ваш код для сброса пароля: {code}"
            mail.send(msg)

            flash("Код отправлен на вашу почту", "success")
            return render_template('register_login/reset_password.html', step=2, form_data=form_data)
        except Exception as e:
            print(f"Ошибка отправки: {e}")
            flash("Ошибка при отправке письма.", "error")
            return render_template('register_login/reset_password.html', step=1, form_data=form_data)

    # ШАГ 2: ПРОВЕРКА КОДА
    if step == 2:
        user_code = request.form.get('code')
        if user_code == session.get('reset_code') and email == session.get('reset_email'):
            return render_template('register_login/reset_password.html', step=3, form_data=form_data)

        flash("Неверный код подтверждения", "error")
        return render_template('register_login/reset_password.html', step=2, form_data=form_data)

    # ШАГ 3: ОБНОВЛЕНИЕ ПАРОЛЯ
    if step == 3:
        pass1 = request.form.get('password')
        pass2 = request.form.get('confirm_password')

        if not pass1 or pass1 != pass2:
            flash("Пароли не совпадают или пусты!", "error")
            return render_template('register_login/reset_password.html', step=3, form_data=form_data)

        # Проверяем сессию еще раз для безопасности
        if email != session.get('reset_email'):
            flash("Сессия истекла, начните заново", "error")
            return redirect(url_for('auth_reset.reset_password'))

        try:
            hashed_pw = generate_password_hash(pass1)
            with get_db_connection() as conn:
                conn.execute('UPDATE Users SET password_hash = ? WHERE email = ?', (hashed_pw, email))
                conn.commit()

            # Очищаем временные данные
            session.pop('reset_code', None)
            session.pop('reset_email', None)

            flash("Пароль успешно изменен!", "success")
            return redirect(url_for('auth_login.login'))
        except Exception as e:
            print(f"Ошибка при смене пароля: {e}")
            flash("Произошла ошибка базы данных", "error")
            return redirect(url_for('auth_reset.reset_password'))

    return render_template('register_login/reset_password.html', step=step, form_data=form_data)