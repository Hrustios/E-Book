import io
import fitz  # Это PyMuPDF
import os
from pdfminer.high_level import extract_text
import requests
import base64
from flask_mail import Message
from flask import Flask, render_template, session, redirect, url_for, flash, request, jsonify
from Backend.extensions import mail
from Backend.login_register.auth_reg import auth_reg_bp
from Backend.login_register.auth_login import auth_login_bp
from Backend.book_loader.loader import upload_book_to_cloud
from Backend.login_register.db_utils import get_db_connection
# Импортируем наш парсер
from Backend.utils.parser_utils import get_page_count

# В начале ebook.py
app = Flask(__name__,
            template_folder='Frontend', # Где лежат .html
            static_folder='Frontend',   # Где лежат папки read, lk и т.д.
            static_url_path='')         # Позволяет обращаться /read/... вместо /static/read/... # Добавь этот параметр обязательно!

# Прямое указание ключа
app.secret_key = "chichiwichki"

# Настройки почты
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USERNAME'] = 'wolfy7406@gmail.com'
app.config['MAIL_PASSWORD'] = 'tgsxjqgfboubzjbd'
app.config['MAIL_DEFAULT_SENDER'] = 'wolfy7406@gmail.com'

mail.init_app(app)

# Регистрация блюпринтов
# Исправленный блок в ebook.py
app.register_blueprint(auth_reg_bp, name='auth_reg')
app.register_blueprint(auth_login_bp, name='auth_login')


@app.route('/')
def index():
    return render_template('main/index.html')


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

    # Извлекаем данные формы
    title = request.form.get('title')
    writer_name = request.form.get('author')
    year = request.form.get('year')
    genre = request.form.get('genre')
    description = request.form.get('description')

    book_file = request.files.get('book_file')
    cover_file = request.files.get('cover_file')

    if book_file and cover_file:
        try:
            # 1. Читаем данные ОДИН раз
            file_content = book_file.read()
            file_size = len(file_content)

            # 2. Считаем количество страниц
            # Используем BytesIO, так как book_file.read() уже переместил курсор в конец
            temp_stream = io.BytesIO(file_content)
            pages_count = get_page_count(temp_stream, book_file.filename)

            # 3. Загружаем в облако (Supabase)
            # Передаем: объект файла (для имени), обложку и сами байты контента
            upload_data = upload_book_to_cloud(book_file, cover_file, file_content)

            if upload_data:
                db = get_db_connection()
                db.execute('''
                           INSERT INTO Books (title, description, author_id, author_name, genre,
                                              release_year, file_url, cover_url, file_size, pages)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                           ''', (
                               title,
                               description,
                               user_id,
                               writer_name,
                               genre,
                               year,
                               upload_data['book_url'],
                               upload_data['cover_url'],
                               file_size,
                               pages_count
                           ))
                db.commit()
                db.close()
                return "OK", 200
            else:
                return "Ошибка при загрузке в облачное хранилище", 500

        except Exception as e:
            print(f"Ошибка в add_book: {e}")
            return f"Критическая ошибка сервера: {e}", 500

    return "Файлы книги или обложки не выбраны", 400

@app.route('/contacts')
def contacts_page():
    return render_template('contacts/contacts_page.html')

@app.route('/get_my_books')
def get_my_books():
    user_id = session.get('user_id')
    page = request.args.get('page', 1, type=int)
    filter_type = request.args.get('filter', 'all')  # Получаем фильтр
    per_page = 10
    offset = (page - 1) * per_page

    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    db = get_db_connection()

    # ЛОГИКА ФИЛЬТРАЦИИ
    if filter_type == 'my-books':
        # Только те, что я загрузил сам
        query = 'FROM Books WHERE author_id = ?'
        params = [user_id]
    elif filter_type == 'all':
        # В будущем здесь будет UNION с другими таблицами (прочитанное и т.д.)
        # Пока возвращаем все мои книги, так как другой логики нет
        query = 'FROM Books WHERE author_id = ?'
        params = [user_id]
    else:
        # Для wishlist, read, later — пока отдаем пустой список
        db.close()
        return jsonify({"books": [], "total_pages": 0, "current_page": page})

    books = db.execute(f'''
                       SELECT id, title, author_name, description, cover_url, 
                              file_url, release_year, genre, pages
                       {query}
                       ORDER BY upload_date DESC LIMIT ? OFFSET ?
                       ''', (*params, per_page, offset)).fetchall()

    # Считаем общее кол-во для пагинации именно по этому фильтру
    total_books = db.execute(f'SELECT COUNT(*) {query}', params).fetchone()[0]

    books_list = [dict(b) for b in books]
    db.close()

    return jsonify({
        "books": books_list,
        "total_pages": (total_books + per_page - 1) // per_page,
        "current_page": page
    })

@app.route('/update_book', methods=['POST'])
def update_book():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    # Получаем данные из формы
    book_id = request.form.get('book_id')
    year = request.form.get('year')
    genre = request.form.get('genre')
    description = request.form.get('description')

    # ЛОГ ДЛЯ ОТЛАДКИ (посмотри в консоль PyCharm/VSCode после нажатия кнопки)
    print(f"DEBUG: Updating book {book_id} for user {user_id}")
    print(f"Data: {year}, {genre}, {description}")

    if not book_id:
        return jsonify({"status": "error", "message": "ID книги не получен"}), 400

    db = get_db_connection()
    try:
        # Выполняем апдейт
        cursor = db.execute('''
                            UPDATE Books
                            SET release_year = ?,
                                genre        = ?,
                                description  = ?
                            WHERE id = ?
                              AND author_id = ?
                            ''', (year, genre, description, book_id, user_id))

        db.commit()

        # Проверяем, была ли обновлена хоть одна строка
        if cursor.rowcount == 0:
            return jsonify({"status": "error", "message": "Книга не найдена или доступ запрещен"}), 404

        return jsonify({"status": "success"}), 200
    except Exception as e:
        print(f"Ошибка БД: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        db.close()


@app.route('/read/<int:book_id>')
def read_page(book_id):
    if 'user_id' not in session:
        return "Пожалуйста, войдите в систему", 401

    db = get_db_connection()
    book = db.execute('SELECT * FROM Books WHERE id = ?', (book_id,)).fetchone()
    db.close()

    if not book:
        return "Книга не найдена", 404

    file_url = book['file_url']
    extension = file_url.split('.')[-1].lower()

    try:
        response = requests.get(file_url)
        doc = fitz.open(stream=response.content, filetype="pdf")
        page_images = []

        # Рендерим каждую страницу в четкую картинку (zoom=2 для качества)
        mat = fitz.Matrix(2, 2)
        for page in doc:
            pix = page.get_pixmap(matrix=mat)
            img_bytes = pix.tobytes("png")
            # Кодируем в base64, чтобы вставить в тег <img>
            base64_img = base64.b64encode(img_bytes).decode('utf-8')
            page_images.append(base64_img)

        doc.close()
        return render_template('read/read_page.html', book=book, page_images=page_images, is_pdf=True)
    except Exception as e:
        return f"Ошибка: {str(e)}", 500


@app.route('/send_feedback', methods=['POST'])
def send_feedback():
    data = request.get_json()  # Получаем данные из JS (JSON)

    name = data.get('name')
    user_email = data.get('email')
    subject = data.get('subject')
    message_text = data.get('message')

    if not all([name, user_email, subject, message_text]):
        return jsonify({"status": "error", "message": "Все поля должны быть заполнены"}), 400

    try:
        # Формируем письмо
        msg = Message(
            subject=f"Feedback: {subject}",
            sender=app.config['MAIL_DEFAULT_SENDER'],
            recipients=[app.config['MAIL_DEFAULT_SENDER']],  # Шлем себе
            reply_to=user_email  # Чтобы отвечать сразу пользователю
        )

        msg.body = f"""
        Новое сообщение из формы обратной связи:
        От кого: {name}
        Email пользователя: {user_email}
        Тема: {subject}

        Сообщение:
        {message_text}
        """

        mail.send(msg)
        return jsonify({"status": "success", "message": "Сообщение отправлено!"}), 200

    except Exception as e:
        print(f"Ошибка отправки почты: {e}")
        return jsonify({"status": "error", "message": "Ошибка при отправке письма"}), 500

@app.route('/about')
def about_page():
    return render_template('about/about_page.html')

if __name__ == '__main__':
    app.run(debug=True)