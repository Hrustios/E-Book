from flask import Blueprint, render_template, session, redirect, url_for, flash, request, jsonify
from flask_login import login_required
from Backend.utils.db_utils import get_db_connection
from flask_mail import Message
from Backend.extensions import mail

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    try:
        with get_db_connection() as conn:
            top_books = conn.execute('''
                SELECT id, title, author_name, average_rating, cover_url
                FROM Books
                ORDER BY average_rating DESC, download_count DESC LIMIT 7
            ''').fetchall()
            leader = conn.execute('''
                SELECT id, title, author_name, description, cover_url
                FROM Books
                ORDER BY download_count DESC LIMIT 1
            ''').fetchone()
        return render_template('main/index.html', top_books=top_books, leader=leader)
    except Exception as e:
        return render_template('main/index.html', top_books=[], leader=None)


@main_bp.route('/lk')
@login_required
def lk_page():
    user_id = session.get('user_id')

    with get_db_connection() as conn:
        followers_count = conn.execute(
            'SELECT COUNT(*) FROM Subscriptions WHERE author_id = ?',
            (user_id,)
        ).fetchone()[0]
        following_count = conn.execute(
            'SELECT COUNT(*) FROM Subscriptions WHERE user_id = ?',
            (user_id,)
        ).fetchone()[0]

    return render_template('lk/lk_page.html',
                           followers=followers_count,
                           following=following_count)

@main_bp.route('/contacts')
def contacts_page(): return render_template('contacts/contacts_page.html')

@main_bp.route('/about')
def about_page(): return render_template('about/about_page.html')

@main_bp.route('/send_feedback', methods=['POST'])
def send_feedback():
    data = request.get_json()
    try:
        msg = Message(subject=f"Feedback: {data.get('subject')}",
                      recipients=['wolfy7406@gmail.com'], # Твоя почта
                      reply_to=data.get('email'))
        msg.body = f"От: {data.get('name')}\nEmail: {data.get('email')}\n\n{data.get('message')}"
        mail.send(msg)
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@main_bp.route('/user/<int:user_id>')
def user_profile(user_id):
    with get_db_connection() as conn:
        # Данные пользователя
        user = conn.execute('SELECT * FROM Users WHERE id = ?', (user_id,)).fetchone()

        if not user:
            return "Пользователь не найден", 404

        # Считаем количество подписчиков (те, кто подписан НА этого пользователя)
        followers_count = conn.execute(
            'SELECT COUNT(*) FROM Subscriptions WHERE author_id = ?', (user_id,)
        ).fetchone()[0]

        # Считаем подписки (те, НА КОГО подписан этот пользователь)
        following_count = conn.execute(
            'SELECT COUNT(*) FROM Subscriptions WHERE user_id = ?', (user_id,)
        ).fetchone()[0]

        # Также вытащим книги этого пользователя для коллекции
        user_books = conn.execute(
            'SELECT * FROM Books WHERE author_id = ? ORDER BY id DESC', (user_id,)
        ).fetchall()

    return render_template('user/user_page.html',
                           profile_user=user,
                           followers=followers_count,
                           following=following_count,
                           books=user_books)