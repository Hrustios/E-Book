import httpx
from supabase import create_client, ClientOptions
import os
import uuid
import urllib3

# Отключаем лишние предупреждения в консоли, раз мы намеренно выключили проверку SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Твои данные
SUPABASE_URL = "https://nnapwjrhawtoigutvcjy.supabase.co"
SUPABASE_KEY = "sb_secret_xerkuvP7audRKqPLnh94-A_-h4oaNX-"

# 1. Создаем кастомный HTTP-клиент
custom_http_client = httpx.Client(
    verify=False,
    timeout=60.0
)

# 2. Инициализируем Supabase с ПРАВИЛЬНЫМ именем аргумента (httpx_client)
supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY,
    options=ClientOptions(
        httpx_client=custom_http_client  # <--- ИСПРАВЛЕНО С http_client НА httpx_client
    )
)

def upload_book_to_cloud(book_file, cover_file, book_content):
    try:
        # Генерируем уникальные пути
        book_ext = os.path.splitext(book_file.filename)[1]
        book_path = f"files/{uuid.uuid4()}{book_ext}"

        cover_ext = os.path.splitext(cover_file.filename)[1]
        cover_path = f"covers/{uuid.uuid4()}{cover_ext}"

        # Загрузка книги
        supabase.storage.from_("books").upload(
            path=book_path,
            file=book_content,
            file_options={
                "content-type": "application/pdf",
                "x-content-disposition": "attachment"  # Это заставит браузер качать файл
            }
        )

        # Загрузка обложки
        supabase.storage.from_("books").upload(
            path=cover_path,
            file=cover_file.read()
        )

        # Получаем публичные ссылки
        return {
            "book_url": supabase.storage.from_("books").get_public_url(book_path),
            "cover_url": supabase.storage.from_("books").get_public_url(cover_path),
            "file_size": len(book_content)
        }
    except Exception as e:
        print(f"Ошибка Supabase: {e}")
        return None