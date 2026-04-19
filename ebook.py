import io
from flask import Flask, render_template, session, redirect, url_for, flash, request, jsonify
from Backend.extensions import mail
from Backend.login_register.auth_reg import auth_reg_bp
from Backend.login_register.auth_login import auth_login_bp
from Backend.book_loader.loader import upload_book_to_cloud
from Backend.login_register.db_utils import get_db_connection
# Импортируем наш парсер
from Backend.utils.parser_utils import get_page_count

app = Flask(__name__,
            template_folder='Frontend',
            static_folder='Frontend')

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
app.register_blueprint(auth_reg_bp)
app.register_blueprint(auth_login_bp)


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

    # Получаем данные из формы
    title = request.form.get('title')
    writer_name = request.form.get('author')
    year = request.form.get('year')
    genre = request.form.get('genre')
    description = request.form.get('description')

    book_file = request.files.get('book_file')
    cover_file = request.files.get('cover_image')

    if book_file and cover_file:
        # --- ЛОГИКА ПАРСИНГА СТРАНИЦ ---
        # Читаем файл в память один раз
        file_content = book_file.read()

        # Создаем временный поток для парсера
        temp_stream = io.BytesIO(file_content)
        pages_count = get_page_count(temp_stream, book_file.filename)

        # Сбрасываем указатели для корректной загрузки в облако
        book_file.seek(0)  # Если loader.py читает из объекта request.files
        # Если loader.py требует объект файла, передаем ему наш поток с данными
        book_file_for_upload = io.BytesIO(file_content)
        book_file_for_upload.filename = book_file.filename

        # Загружаем файлы в облако
        upload_data = upload_book_to_cloud(book_file_for_upload, cover_file)

        if upload_data:
            db = get_db_connection()
            db.execute('''
                       INSERT INTO Books (title, description, author_id, author_name, genre,
                                          release_year, file_url, cover_url, file_size, pages)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                       ''', (
                           title, description, user_id, writer_name, genre,
                           year, upload_data['book_url'], upload_data['cover_url'],
                           upload_data['file_size'], pages_count
                       ))
            db.commit()
            db.close()
            return "OK", 200

    return "Ошибка при заполнении формы или загрузке файлов", 400


@app.route('/get_my_books')
def get_my_books():
    user_id = session.get('user_id')
    page = request.args.get('page', 1, type=int)
    per_page = 10
    offset = (page - 1) * per_page

    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    db = get_db_connection()
    # Теперь выбираем поле pages напрямую из БД
    books = db.execute('''
                       SELECT title,
                              author_name,
                              description,
                              cover_url,
                              release_year,
                              genre,
                              file_size,
                              pages
                       FROM Books
                       WHERE author_id = ?
                       ORDER BY upload_date DESC LIMIT ?
                       OFFSET ?
                       ''', (user_id, per_page, offset)).fetchall()

    books_list = []
    for b in books:
        book_dict = dict(b)
        # Если pages в БД нет (0 или None), ставим прочерк
        if not book_dict.get('pages'):
            book_dict['pages'] = "---"
        books_list.append(book_dict)

    total_books = db.execute('SELECT COUNT(*) FROM Books WHERE author_id = ?', (user_id,)).fetchone()[0]
    db.close()

    return jsonify({
        "books": books_list,
        "total_pages": (total_books + per_page - 1) // per_page,
        "current_page": page
    })


if __name__ == '__main__':
    app.run(debug=True)