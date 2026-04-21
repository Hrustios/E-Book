import io
import fitz  # PyMuPDF
import os
import requests
import base64
from flask import Flask, render_template, session, redirect, url_for, flash, request, jsonify
from flask_mail import Message
from datetime import datetime

# Твои внутренние импорты
from Backend.extensions import mail
from Backend.login_register.auth_reg import auth_reg_bp
from Backend.login_register.auth_login import auth_login_bp
from Backend.book_loader.loader import upload_book_to_cloud
from Backend.login_register.db_utils import get_db_connection
from Backend.utils.parser_utils import get_page_count

app = Flask(__name__,
            template_folder='Frontend',      # Ставим общую папку для всех HTML
            static_folder='Frontend',
            static_url_path='')            # Тот самый "летающий" режим       # Обязательно с префиксом!

app.secret_key = "chichiwichki"

# Настройки почты
app.config.update(
    MAIL_SERVER='smtp.gmail.com',
    MAIL_PORT=465,
    MAIL_USE_SSL=True,
    MAIL_USERNAME='wolfy7406@gmail.com',
    MAIL_PASSWORD='tgsxjqgfboubzjbd',
    MAIL_DEFAULT_SENDER='wolfy7406@gmail.com'
)

mail.init_app(app)

# Регистрация блюпринтов
app.register_blueprint(auth_reg_bp)
app.register_blueprint(auth_login_bp)


# --- РОУТЫ ---

@app.route('/')
def index():
    try:
        with get_db_connection() as conn:
            # 1. Топ-7 книг по рейтингу и скачиваниям
            # Используем точные названия: average_rating и download_count
            top_books = conn.execute('''
                                     SELECT id, title, author_name, average_rating, cover_url
                                     FROM Books
                                     ORDER BY average_rating DESC, download_count DESC LIMIT 7
                                     ''').fetchall()

            # 2. Лидер чтений (самая скачиваемая книга)
            leader = conn.execute('''
                                  SELECT id, title, author_name, description, cover_url
                                  FROM Books
                                  ORDER BY download_count DESC LIMIT 1
                                  ''').fetchone()

        return render_template('main/index.html', top_books=top_books, leader=leader)
    except Exception as e:
        print(f"Ошибка в роуте index: {e}")
        # Возвращаем пустые списки, чтобы страница не падала при ошибке БД
        return render_template('index.html', top_books=[], leader=None)

@app.route('/lk')
def lk_page():
    if not session.get('username'):
        flash("Пожалуйста, войдите в аккаунт", "error")
        return redirect(url_for('auth_login.login'))
    return render_template('lk/lk_page.html')


@app.route('/add_book', methods=['POST'])
def add_book():
    user_id = session.get('user_id')
    if not user_id:
        return "Необходима авторизация", 401

    title = request.form.get('title')
    writer_name = request.form.get('author')
    year = request.form.get('year')
    genre = request.form.get('genre')
    description = request.form.get('description')
    book_file = request.files.get('book_file')
    cover_file = request.files.get('cover_file')

    if book_file and cover_file:
        try:
            file_content = book_file.read()
            file_size = len(file_content)

            temp_stream = io.BytesIO(file_content)
            pages_count = get_page_count(temp_stream, book_file.filename)

            upload_data = upload_book_to_cloud(book_file, cover_file, file_content)

            if upload_data:
                with get_db_connection() as db:
                    db.execute('''
                               INSERT INTO Books (title, description, author_id, author_name, genre,
                                                  release_year, file_url, cover_url, file_size, pages)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                               ''', (title, description, user_id, writer_name, genre, year,
                                     upload_data['book_url'], upload_data['cover_url'], file_size, pages_count))
                return "OK", 200
            return "Ошибка загрузки в облако", 500
        except Exception as e:
            print(f"Ошибка в add_book: {e}")
            return f"Ошибка: {e}", 500
    return "Файлы не выбраны", 400


@app.route('/catalog')
def catalog_page():
    page = request.args.get('page', 1, type=int)
    per_page = 20
    offset = (page - 1) * per_page

    search_query = request.args.get('search', '').strip()
    genre = request.args.get('genre', '').strip()
    year = request.args.get('year', '').strip()
    author = request.args.get('author', '').strip()

    query_parts = ["WHERE 1=1"]
    params = []

    # --- Фильтрация (твой существующий код) ---
    if search_query:
        query_parts.append("AND (title LIKE ? OR description LIKE ?)")
        params.extend([f'%{search_query}%', f'%{search_query}%'])

    known_genres = ['Классика', 'Фэнтези и фантастика', 'Детективы и триллеры']
    if genre:
        if genre == 'other':
            placeholders = ', '.join(['?'] * len(known_genres))
            query_parts.append(f"AND genre NOT IN ({placeholders})")
            params.extend(known_genres)
        else:
            query_parts.append("AND genre LIKE ?")
            params.append(f'%{genre}%')

    if year:
        query_parts.append("AND release_year = ?")
        params.append(year)

    if author:
        query_parts.append("AND author_name LIKE ?")
        params.append(f'%{author}%')

    where_clause = " ".join(query_parts)

    try:
        with get_db_connection() as conn:
            # 1. ЗАПРОС ДЛЯ ТОП-4 ЗА НЕДЕЛЮ
            # Ищем книги, у которых были оценки за последние 7 дней
            top_books = conn.execute('''
                                     SELECT b.*, AVG(ul.rating) as weekly_avg
                                     FROM Books b
                                              JOIN User_Library ul ON b.id = ul.book_id
                                     WHERE ul.rating > 0
                                       AND ul.read_date >= date ('now'
                                         , '-7 days')
                                     GROUP BY b.id
                                     ORDER BY weekly_avg DESC
                                         LIMIT 4
                                     ''').fetchall()

            # Подстраховка: если за неделю никто ничего не оценивал, берем просто лучшие
            if not top_books:
                top_books = conn.execute('SELECT * FROM Books ORDER BY average_rating DESC LIMIT 4').fetchall()

            # 2. ОСНОВНОЙ КАТАЛОГ (твой код)
            total_count = conn.execute(f"SELECT COUNT(*) FROM Books {where_clause}", params).fetchone()[0]
            total_pages = (total_count + per_page - 1) // per_page

            books = conn.execute(
                f"SELECT * FROM Books {where_clause} ORDER BY upload_date DESC LIMIT ? OFFSET ?",
                params + [per_page, offset]
            ).fetchall()

    except Exception as e:
        print(f"Ошибка каталога: {e}")
        top_books, books, total_pages = [], [], 0

    return render_template('catalog/catalog_page.html',
                           top_books=top_books,  # ПЕРЕДАЕМ ТОП
                           books=books, page=page, total_pages=total_pages,
                           current_search=search_query, current_genre=genre,
                           current_year=year, current_author=author)


@app.route('/track_download', methods=['POST'])
def track_download():
    data = request.get_json()
    user_id = session.get('user_id')
    book_id = data.get('book_id')

    if not user_id:
        return jsonify({"status": "error", "message": "Нужна авторизация"}), 401

    with get_db_connection() as conn:
        # Проверяем, качал ли уже этот пользователь эту книгу
        existing = conn.execute('SELECT id FROM Downloads WHERE user_id = ? AND book_id = ?',
                                (user_id, book_id)).fetchone()

        if not existing:
            # 1. Записываем факт уникального скачивания
            conn.execute('INSERT INTO Downloads (user_id, book_id) VALUES (?, ?)', (user_id, book_id))

            # 2. Обновляем счетчик в таблице Books
            conn.execute('UPDATE Books SET download_count = download_count + 1 WHERE id = ?', (book_id,))
            conn.commit()

            # Получаем новое число для фронтенда
            new_count = conn.execute('SELECT download_count FROM Books WHERE id = ?', (book_id,)).fetchone()[0]
            return jsonify({"status": "counted", "new_count": new_count})

    return jsonify({"status": "already_downloaded"})


@app.route('/get_my_books')
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


@app.route('/update_book', methods=['POST'])
def update_book():
    user_id = session.get('user_id')
    book_id = request.form.get('book_id')
    if not user_id or not book_id: return jsonify({"status": "error"}), 400

    try:
        with get_db_connection() as db:
            db.execute('''UPDATE Books
                          SET release_year=?,
                              genre=?,
                              description=?
                          WHERE id = ?
                            AND author_id = ?''',
                       (request.form.get('year'), request.form.get('genre'),
                        request.form.get('description'), book_id, user_id))
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/read/<int:book_id>')
def read_page(book_id):
    if 'user_id' not in session: return redirect(url_for('auth_login.login'))

    with get_db_connection() as db:
        book = db.execute('SELECT * FROM Books WHERE id = ?', (book_id,)).fetchone()

    if not book: return "Книга не найдена", 404

    try:
        response = requests.get(book['file_url'])
        doc = fitz.open(stream=response.content, filetype="pdf")
        page_images = []
        for page in doc:
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            page_images.append(base64.b64encode(pix.tobytes("png")).decode('utf-8'))
        doc.close()
        return render_template('read/read_page.html', book=book, page_images=page_images, is_pdf=True)
    except Exception as e:
        return f"Ошибка чтения: {e}", 500


@app.route('/send_feedback', methods=['POST'])
def send_feedback():
    data = request.get_json()
    try:
        msg = Message(subject=f"Feedback: {data.get('subject')}",
                      recipients=[app.config['MAIL_DEFAULT_SENDER']],
                      reply_to=data.get('email'))
        msg.body = f"От: {data.get('name')}\nEmail: {data.get('email')}\n\n{data.get('message')}"
        mail.send(msg)
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/contacts')
def contacts_page(): return render_template('contacts/contacts_page.html')


@app.route('/about')
def about_page(): return render_template('about/about_page.html')


@app.route('/update_library_status', methods=['POST'])
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


@app.route('/get_book_note/<int:book_id>')
def get_book_note(book_id):
    if 'user_id' not in session:
        return jsonify({"note": ""})

    with get_db_connection() as conn:
        row = conn.execute(
            'SELECT note FROM User_Library WHERE user_id = ? AND book_id = ?',
            (session['user_id'], book_id)
        ).fetchone()

    return jsonify({"note": row['note'] if row else ""})


@app.route('/get_book_user_data/<int:book_id>')
def get_book_user_data(book_id):
    user_id = session.get('user_id')
    with get_db_connection() as conn:
        # 1. Получаем данные о самой книге (средний рейтинг и автор)
        book_info = conn.execute('SELECT author_id, average_rating FROM Books WHERE id = ?', (book_id,)).fetchone()

        # 2. Получаем данные пользователя
        user_data = None
        if user_id:
            user_data = conn.execute('SELECT note, status, rating FROM User_Library WHERE user_id = ? AND book_id = ?',
                                     (user_id, book_id)).fetchone()

    return jsonify({
        "is_author": book_info['author_id'] == user_id if user_id else False,
        "avg_rating": book_info['average_rating'] or 0.0,  # ОТПРАВЛЯЕМ СРЕДНИЙ
        "note": user_data['note'] if user_data else "",
        "status": user_data['status'] if user_data else "none",
        "user_rating": user_data['rating'] if user_data else 0
    })


@app.route('/get_leader_book')
def get_leader_book():
    with get_db_connection() as conn:
        # Берем книгу с максимальным количеством скачиваний
        leader = conn.execute('''
                              SELECT id, title, author_name, description, cover_url
                              FROM Books
                              ORDER BY download_count DESC LIMIT 1
                              ''').fetchone()

    if leader:
        return jsonify(dict(leader))
    return jsonify({"error": "No books found"}), 404

@app.route('/delete_book/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    try:
        with get_db_connection() as conn:
            # 1. Сначала проверяем, существует ли книга и принадлежит ли она пользователю
            book = conn.execute('SELECT author_id FROM Books WHERE id = ?', (book_id,)).fetchone()

            if not book:
                return jsonify({"status": "error", "message": "Книга не найдена"}), 404

            if book['author_id'] != user_id:
                return jsonify({"status": "error", "message": "У вас нет прав на удаление этой книги"}), 403

            # 2. Удаляем связанные записи из User_Library (чтобы не нарушить целостность)
            conn.execute('DELETE FROM User_Library WHERE book_id = ?', (book_id,))

            # 3. Удаляем саму книгу
            conn.execute('DELETE FROM Books WHERE id = ?', (book_id,))

            # 4. ОБЯЗАТЕЛЬНО фиксируем изменения
            conn.commit()

        return jsonify({"status": "success"}), 200
    except Exception as e:
        print(f"Ошибка при удалении книги: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/save_book_note', methods=['POST'])
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


@app.route('/rate_book', methods=['POST'])
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

if __name__ == '__main__':
    app.run(debug=True)