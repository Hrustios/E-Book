from flask import Blueprint, request, jsonify, session
from Backend.utils.db_utils import get_db_connection
from flask_login import login_required

user_bp = Blueprint('user', __name__, template_folder='../../Frontend')

@user_bp.route('/update_library_status', methods=['POST'])
def update_library_status():
    data = request.get_json()
    user_id = session.get('user_id')
    book_id = data.get('book_id')
    status_text = data.get('status')

    status_map = {"Прочитана": "read", "Читаю": "reading", "В отложенные": "dropped", "В желаемые": "wish"}
    db_status = status_map.get(status_text)

    # SQL-функция для локального времени
    current_time_sql = "datetime('now', 'localtime')"

    with get_db_connection() as conn:
        existing = conn.execute('SELECT status, note, read_date FROM User_Library WHERE user_id = ? AND book_id = ?',
                                (user_id, book_id)).fetchone()

        if existing:
            if existing['status'] == db_status:
                # Кликнули по той же кнопке — снимаем статус
                # Но read_date НЕ трогаем (сохраняем историю прочтения)
                new_status = "none" if (existing['note'] and existing['note'] != "Без заметки") else None

                if new_status:
                    conn.execute('UPDATE User_Library SET status = "none" WHERE user_id = ? AND book_id = ?',
                                 (user_id, book_id))
                    result = "status_none"
                else:
                    conn.execute('DELETE FROM User_Library WHERE user_id = ? AND book_id = ?',
                                 (user_id, book_id))
                    result = "removed"
            else:
                # Смена статуса на другой
                if db_status == 'read':
                    # Обновляем дату только при переходе в "Прочитана"
                    conn.execute(
                        f'UPDATE User_Library SET status = ?, read_date = {current_time_sql} WHERE user_id = ? AND book_id = ?',
                        (db_status, user_id, book_id))
                else:
                    # При смене на другой статус (например, "Читаю") дату ОСТАВЛЯЕМ старой
                    conn.execute('UPDATE User_Library SET status = ? WHERE user_id = ? AND book_id = ?',
                                 (db_status, user_id, book_id))
                result = "updated"
        else:
            # Первая вставка
            read_date_val = current_time_sql if db_status == 'read' else "NULL"
            conn.execute(f'''INSERT INTO User_Library (user_id, book_id, status, note, rating, read_date) 
                             VALUES (?, ?, ?, ?, ?, {read_date_val})''',
                         (user_id, book_id, db_status, "Без заметки", 0))
            result = "inserted"

        conn.commit()
    return jsonify({"status": result})

@user_bp.route('/rate_book', methods=['POST'])
def rate_book():
    try:
        data = request.get_json()
        user_id = session.get('user_id')
        book_id = data.get('book_id')
        rating = int(data.get('rating'))

        if not user_id:
            return jsonify({"status": "error", "message": "Войдите в аккаунт"}), 401

        with get_db_connection() as conn:
            # 1. Обновляем личную оценку
            existing = conn.execute('SELECT id FROM User_Library WHERE user_id = ? AND book_id = ?',
                                    (user_id, book_id)).fetchone()
            if existing:
                conn.execute('UPDATE User_Library SET rating = ? WHERE user_id = ? AND book_id = ?',
                             (rating, user_id, book_id))
            else:
                conn.execute('INSERT INTO User_Library (user_id, book_id, status, rating, note) VALUES (?, ?, ?, ?, ?)',
                             (user_id, book_id, 'none', rating, "Без заметки"))

            # 2. Считаем средний рейтинг (только тех, кто реально голосовал)
            avg_row = conn.execute('SELECT AVG(rating) FROM User_Library WHERE book_id = ? AND rating > 0',
                                   (book_id,)).fetchone()
            new_avg = round(avg_row[0], 1) if avg_row[0] else 0.0

            # 3. Пишем средний балл в таблицу книг
            conn.execute('UPDATE Books SET average_rating = ? WHERE id = ?', (new_avg, book_id))
            conn.commit()

        return jsonify({"status": "success", "new_average": new_avg})
    except Exception as e:
        print(f"Error in rate_book: {e}") # Увидишь ошибку в консоли Python
        return jsonify({"status": "error", "message": str(e)}), 500

@user_bp.route('/save_book_note', methods=['POST'])
def save_book_note():
    data = request.get_json()
    user_id = session.get('user_id')
    book_id = data.get('book_id')
    note_text = data.get('note', '').strip()

    with get_db_connection() as conn:
        existing = conn.execute('SELECT id FROM User_Library WHERE user_id = ? AND book_id = ?',
                                (user_id, book_id)).fetchone()
        if existing:
            conn.execute('UPDATE User_Library SET note = ? WHERE user_id = ? AND book_id = ?',
                         (note_text, user_id, book_id))
        else:
            # Создаем запись со статусом 'none', чтобы книга НЕ считалась добавленной в коллекцию
            conn.execute('INSERT INTO User_Library (user_id, book_id, status, note, rating) VALUES (?, ?, ?, ?, ?)',
                         (user_id, book_id, 'none', note_text, 0))
        conn.commit()
    return jsonify({"status": "success"})

@user_bp.route('/get_my_books')
def get_my_books():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    page = request.args.get('page', 1, type=int)
    filter_type = request.args.get('filter', 'all')
    per_page = 10
    offset = (page - 1) * per_page

    with get_db_connection() as db:
        base_query = '''
            FROM Books b
            LEFT JOIN User_Library ul ON b.id = ul.book_id AND ul.user_id = ?
        '''
        params = [user_id]
        where_clause = ""

        if filter_type == 'my-books':
            # Только книги, загруженные текущим пользователем
            where_clause = "WHERE b.author_id = ?"
            params.append(user_id)

        elif filter_type == 'all':
            # ИЗМЕНЕНО: Книги со статусом, но загруженные НЕ этим пользователем
            where_clause = "WHERE ul.status IS NOT NULL AND ul.status != 'none' AND b.author_id != ?"
            params.append(user_id)

        else:
            # Фильтрация по конкретному статусу
            status_map = {
                "read": "read",
                "later": "dropped",
                "wishlist": "wish"
            }
            db_status = status_map.get(filter_type, filter_type)
            where_clause = "WHERE ul.status = ?"
            params.append(db_status)

        # Считаем общее количество для пагинации
        total_books = db.execute(f"SELECT COUNT(*) {base_query} {where_clause}", params).fetchone()[0]

        # Получаем книги
        books = db.execute(f'''
            SELECT b.*, ul.status as user_status 
            {base_query} 
            {where_clause} 
            ORDER BY b.upload_date DESC 
            LIMIT ? OFFSET ?
        ''', (*params, per_page, offset)).fetchall()

    return jsonify({
        "books": [dict(b) for b in books],
        "total_pages": (total_books + per_page - 1) // per_page,
        "current_page": page
    })

@user_bp.route('/get_book_note/<int:book_id>')
def get_book_note(book_id):
    if 'user_id' not in session:
        return jsonify({"note": ""})

    with get_db_connection() as conn:
        row = conn.execute(
            'SELECT note FROM User_Library WHERE user_id = ? AND book_id = ?',
            (session['user_id'], book_id)
        ).fetchone()

    return jsonify({"note": row['note'] if row else ""})


# ... (начало кода без изменений)

@user_bp.route('/get_book_user_data/<int:book_id>')
def get_book_user_data(book_id):
    user_id = session.get('user_id')
    with get_db_connection() as conn:
        book_info = conn.execute('SELECT author_id, average_rating FROM Books WHERE id = ?', (book_id,)).fetchone()

        if not book_info:
            return jsonify({"error": "Book not found"}), 404

        user_data = None
        if user_id:
            user_data = conn.execute('SELECT note, status, rating FROM User_Library WHERE user_id = ? AND book_id = ?',
                                     (user_id, book_id)).fetchone()

    return jsonify({
        "is_author": book_info['author_id'] == user_id if user_id else False,
        "avg_rating": book_info['average_rating'] or 0.0,
        "note": user_data['note'] if user_data else "",
        "status": user_data['status'] if user_data else "none",
        "user_rating": user_data['rating'] if user_data else 0
    })


# ИСПРАВЛЕНО: используем user_bp и get_db_connection()
@user_bp.route('/check_subscription/<int:author_id>')
def check_subscription(author_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'is_subscribed': False})

    with get_db_connection() as conn:
        sub = conn.execute('SELECT 1 FROM Subscriptions WHERE user_id = ? AND author_id = ?',
                           (user_id, author_id)).fetchone()
    return jsonify({'is_subscribed': bool(sub)})


# ИСПРАВЛЕНО: используем user_bp и get_db_connection()
@user_bp.route('/toggle_subscription', methods=['POST'])
def toggle_subscription():
    data = request.get_json()
    user_id = session.get('user_id')
    author_id = data.get('author_id')

    if not user_id:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401

    if user_id == author_id:
        return jsonify({'status': 'error', 'message': 'You cannot subscribe to yourself'}), 400

    with get_db_connection() as conn:
        # Проверяем, есть ли подписка
        sub = conn.execute('SELECT id FROM Subscriptions WHERE user_id = ? AND author_id = ?',
                           (user_id, author_id)).fetchone()

        if sub:
            conn.execute('DELETE FROM Subscriptions WHERE id = ?', (sub['id'],))
            result = 'unsubscribed'
        else:
            conn.execute('INSERT INTO Subscriptions (user_id, author_id) VALUES (?, ?)',
                         (user_id, author_id))
            result = 'subscribed'
        conn.commit()

    return jsonify({'status': result})