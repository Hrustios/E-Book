import cloudinary
import cloudinary.uploader
import cloudinary.utils
from werkzeug.utils import secure_filename
import os

# Конфигурация
cloudinary.config(
    cloud_name="drjbitzbf",
    api_key="723567953571628",
    api_secret="ccVRHcB7DjwZvvcuMyfMh8sgF-8",
    secure=True
)

ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.fb2'}


def upload_book_to_cloud(book_file, cover_file):
    try:
        original_name = getattr(book_file, 'filename', 'document.pdf')
        filename = secure_filename(original_name)
        name, ext = os.path.splitext(filename)
        ext = ext.lower()

        # 1. Загрузка книги с ПРИНУДИТЕЛЬНЫМ публичным доступом
        book_result = cloudinary.uploader.upload(
            book_file,
            folder="ebooks/files",
            resource_type="raw",
            access_mode="public",  # Это снимет статус Blocked for delivery
            public_id=f"{name}{ext}",
            use_filename=True,
            unique_filename=True
        )

        actual_pid = book_result['public_id']

        # 2. Генерация ссылки
        download_url = cloudinary.utils.private_download_url(
            actual_pid,
            None,
            resource_type="raw",
            attachment=True
        )

        # 3. Загрузка обложки
        cover_result = cloudinary.uploader.upload(
            cover_file,
            folder="ebooks/covers",
            resource_type="image"
        )

        return {
            "book_url": download_url,
            "cover_url": cover_result['secure_url'],
            "file_size": book_result['bytes']
        }
    except Exception as e:
        print(f"Ошибка: {e}")
        return None