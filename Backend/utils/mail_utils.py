import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from Backend.config import Config  # Путь зависит от твоей структуры папок


def send_notification_email(recipient_email, author_name, book_title):
    if not Config.MAIL_USERNAME or not Config.MAIL_PASSWORD:
        return

    msg = MIMEMultipart()
    msg['From'] = f"E-Book Service <{Config.MAIL_DEFAULT_SENDER}>"
    msg['To'] = recipient_email
    # Тема письма с именем автора
    msg['Subject'] = f"Новая книга от автора {author_name}!"

    # Тело письма с подстановкой данных
    body = f"""
Привет!

Твой любимый автор {author_name} только что опубликовал новую книгу: "{book_title}".

Скорее заходи на сайт, чтобы ознакомиться с новинкой!
    """
    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    try:
        if Config.MAIL_PORT == 587:
            context = ssl.create_default_context()
            with smtplib.SMTP(Config.MAIL_SERVER, Config.MAIL_PORT) as server:
                server.starttls(context=context)
                server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
                server.send_message(msg)
        elif Config.MAIL_PORT == 465:
            with smtplib.SMTP_SSL(Config.MAIL_SERVER, Config.MAIL_PORT) as server:
                server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
                server.send_message(msg)
    except Exception as e:
        print(f"Ошибка рассылки: {e}")

        print(f"Письмо успешно отправлено на {recipient_email}")

    except Exception as e:
        print(f"Критическая ошибка при отправке почты на {recipient_email}: {e}")