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
    return render_template('lk/lk_page.html')

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