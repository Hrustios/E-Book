import httpx
from supabase import create_client, ClientOptions
import os
import uuid
import urllib3

# Отключаем предупреждения о небезопасном соединении
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

SUPABASE_URL = "https://nnapwjrhawtoigutvcjy.supabase.co"
SUPABASE_KEY = "sb_secret_xerkuvP7audRKqPLnh94-A_-h4oaNX-"

# Создаем клиента с игнорированием ошибок SSL
custom_http_client = httpx.Client(
    verify=False,
    timeout=60.0
)

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY,
    options=ClientOptions(
        httpx_client=custom_http_client
    )
)

def upload_book_to_cloud(book_file, cover_file, book_content):
    """
    book_file: объект FileStorage (из request.files)
    cover_file: объект FileStorage (из request.files)
    book_content: байты файла книги
    """
    try:
        # Генерируем уникальные имена
        book_ext = os.path.splitext(book_file.filename)[1]
        book_path = f"files/{uuid.uuid4()}{book_ext}"

        cover_ext = os.path.splitext(cover_file.filename)[1]
        cover_path = f"covers/{uuid.uuid4()}{cover_ext}"

        # 1. Загрузка книги
        # Используем content-type в зависимости от расширения
        content_type = "application/pdf" if book_ext.lower() == ".pdf" else "application/octet-stream"

        supabase.storage.from_("books").upload(
            path=book_path,
            file=book_content,
            file_options={
                "content-type": content_type,
                "x-content-disposition": "attachment"
            }
        )

        # 2. Загрузка обложки
        cover_file.seek(0)  # Сбрасываем курсор в начало на всякий случай
        cover_data = cover_file.read()

        supabase.storage.from_("books").upload(
            path=cover_path,
            file=cover_data,
            file_options={"content-type": "image/jpeg"}  # Или определи динамически
        )

        # 3. Формируем ссылки
        return {
            "book_url": supabase.storage.from_("books").get_public_url(book_path),
            "cover_url": supabase.storage.from_("books").get_public_url(cover_path),
            "file_size": len(book_content)
        }

    except Exception as e:
        print(f"Ошибка Supabase: {e}")
        return None