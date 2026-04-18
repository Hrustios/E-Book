import cloudinary
import cloudinary.uploader
from werkzeug.utils import secure_filename

# Конфигурация (замени на свои данные из консоли Cloudinary)
cloudinary.config(
  cloud_name = "drjbitzbf",
  api_key = "723567953571628",
  api_secret = "ccVRHcB7DjwZvvcuMyfMh8sgF-8",
  secure = True
)


def upload_book_to_cloud(book_file, cover_file):
    """
    Загружает файл книги и обложку в Cloudinary.
    Возвращает кортеж (book_url, cover_url, file_size)
    """
    try:
        # 1. Загрузка файла книги (PDF/DOCX)
        # resource_type="raw" обязателен для документов
        book_result = cloudinary.uploader.upload(
            book_file,
            folder="ebooks/files",
            resource_type="raw",
            public_id=secure_filename(book_file.filename)
        )

        # 2. Загрузка обложки
        cover_result = cloudinary.uploader.upload(
            cover_file,
            folder="ebooks/covers",
            resource_type="image"
        )

        return {
            "book_url": book_result['secure_url'],
            "cover_url": cover_result['secure_url'],
            "file_size": book_result['bytes']
        }
    except Exception as e:
        print(f"Ошибка при загрузке в Cloudinary: {e}")
        return None