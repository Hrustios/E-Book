from flask import Flask, render_template, session, redirect, url_for, flash, request
from Backend.extensions import mail
from Backend.login_register.auth_reg import auth_reg_bp
from Backend.login_register.auth_login import auth_login_bp
from Backend.book_loader.loader import upload_book_to_cloud
from Backend.login_register.db_utils import get_db_connection
app = Flask(__name__,
            template_folder='Frontend',
            static_folder='Frontend')

# Прямое указание ключа
app.secret_key = "chichiwichki"

# Настройки почты (используем smtp.gmail.com вместо IP для стабильности)
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
    # Проверяем авторизацию через сессию
    if not session.get('username'):
        flash("Пожалуйста, войдите в аккаунт", "error")
        return redirect(url_for('auth_login.login'))

    return render_template('lk/lk_page.html')


@app.route('/add_book', methods=['POST'])
def add_book():
    if 'user_id' not in session:
        return "Авторизуйтесь", 401

    # Данные из формы
    title = request.form.get('title')
    author_input = request.form.get('author')  # Текст из инпута
    year = request.form.get('year')
    genre = request.form.get('genre')
    description = request.form.get('description')

    book_file = request.files.get('book_file')
    cover_file = request.files.get('cover_image')

    if book_file and cover_file:
        from Backend.book_loader.loader import upload_book_to_cloud
        upload_data = upload_book_to_cloud(book_file, cover_file)

        if upload_data:
            db = get_db_connection()

            # --- ЛОГИКА АВТОРА ---
            # Проверяем, существует ли автор в таблице Authors
            author_row = db.execute('SELECT id FROM Authors WHERE full_name = ?', (author_input,)).fetchone()

            if author_row:
                a_id = author_row['id']
            else:
                # Создаем нового автора, если его нет
                cursor = db.execute('INSERT INTO Authors (full_name) VALUES (?)', (author_input,))
                a_id = cursor.lastrowid

            # --- СОХРАНЕНИЕ КНИГИ ---
            db.execute('''
                       INSERT INTO Books (title, description, author_id, author_name, genre, release_year,
                                          file_url, cover_url, file_size, uploader_id)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                       ''', (
                           title, description, a_id, author_input, genre, year,
                           upload_data['book_url'], upload_data['cover_url'],
                           upload_data['file_size'], session['user_id']
                       ))

            db.commit()
            db.close()
            return "OK", 200

    return "Ошибка при загрузке", 400

if __name__ == '__main__':
    app.run(debug=True)