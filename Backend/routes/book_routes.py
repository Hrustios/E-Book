from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
import requests, fitz, base64, io
from Backend.utils.db_utils import get_db_connection
from Backend.utils.parser_utils import get_page_count
from Backend.book_loader.loader import upload_book_to_cloud
from flask_login import login_required, current_user

book_bp = Blueprint('book', __name__, template_folder='../../Frontend')

@book_bp.route('/catalog')
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


@book_bp.route('/read/<int:book_id>')
def read_page(book_id):
    # Проверка сессии (согласно твоему списку эндпоинтов)
    if 'user_id' not in session:
        return redirect(url_for('auth_login.login'))

    with get_db_connection() as db:
        book = db.execute('SELECT * FROM Books WHERE id = ?', (book_id,)).fetchone()

    if not book:
        return redirect(url_for('main.lk_page'))  # Обязательно с префиксом main.

    try:
        # Логика получения файла
        response = requests.get(book['file_url'], timeout=10)
        response.raise_for_status()  # Проверяем, что файл вообще скачался по ссылке

        doc = fitz.open(stream=response.content, filetype="pdf")
        page_images = []
        for page in doc:
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            page_images.append(base64.b64encode(pix.tobytes("png")).decode('utf-8'))
        doc.close()

        return render_template('read/read_page.html', book=book, page_images=page_images, is_pdf=True)

    except Exception as e:
        # ВАЖНО: сейчас мы не будем редиректить, а выведем ошибку на экран,
        # чтобы понять, ПОЧЕМУ не читается файл.
        print(f"Критическая ошибка при чтении PDF: {e}")
        return f"Ошибка при обработке PDF: {e}. Проверьте ссылку на файл: {book['file_url']}"

@book_bp.route('/add_book', methods=['POST'])
def add_book():
    user_id = session.get('user_id')
    if not user_id:
        return "Необходима авторизация", 401

    # Получаем данные
    title = request.form.get('title')
    writer_name = request.form.get('author')
    year = request.form.get('year')
    genre = request.form.get('genre')
    description = request.form.get('description')

    book_file = request.files.get('book_file')
    cover_file = request.files.get('cover_file')

    # ЖЕСТКАЯ ПРОВЕРКА: Если хоть одно поле пустое — возвращаем 400
    if not all([title, writer_name, year, genre, description, book_file, cover_file]):
        return "Все поля, включая файлы, обязательны для заполнения", 400

    try:
        file_content = book_file.read()
        file_size = len(file_content)

        temp_stream = io.BytesIO(file_content)
        pages_count = get_page_count(temp_stream, book_file.filename)

        # Загрузка в облако
        upload_data = upload_book_to_cloud(book_file, cover_file, file_content)

        if upload_data:
            with get_db_connection() as db:
                db.execute('''
                           INSERT INTO Books (title, description, author_id, author_name, genre,
                                              release_year, file_url, cover_url, file_size, pages)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                           ''', (title, description, user_id, writer_name, genre, year,
                                 upload_data['book_url'], upload_data['cover_url'], file_size, pages_count))
                db.commit()  # Важно для сохранения
            return "OK", 200

        return "Ошибка загрузки в облако", 500
    except Exception as e:
        print(f"Ошибка в add_book: {e}")
        return f"Ошибка: {e}", 500

@book_bp.route('/track_download', methods=['POST'])
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

@book_bp.route('/update_book/<int:book_id>', methods=['POST'])  # <-- ОБЯЗАТЕЛЬНО добавить это
@login_required
def update_book(book_id):
    db = get_db_connection()

    # Проверка прав (автор ли это?)
    book = db.execute("SELECT author_id FROM Books WHERE id = ?", (book_id,)).fetchone()
    if not book or book['author_id'] != current_user.id:
        return "Доступ запрещен", 403

    # Получаем данные
    year = request.form.get('year')
    genre = request.form.get('genre')
    description = request.form.get('description')

    try:
        db.execute("""
                   UPDATE Books
                   SET release_year = ?,
                       genre        = ?,
                       description  = ?
                   WHERE id = ?
                   """, (year, genre, description, book_id))
        db.commit()
        return "OK", 200
    except Exception as e:
        print(f"Ошибка БД: {e}")
        return "Ошибка при обновлении базы данных", 500

@book_bp.route('/get_leader_book')
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

@book_bp.route('/delete_book/<int:book_id>', methods=['DELETE'])
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
