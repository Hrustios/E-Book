import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from Backend.config import Config


def send_notification_email(recipient_email, author_name, book_title):
    if not Config.MAIL_USERNAME or not Config.MAIL_PASSWORD:
        return

    msg = MIMEMultipart()
    msg['From'] = f"E-Book Service <{Config.MAIL_DEFAULT_SENDER}>"
    msg['To'] = recipient_email
    msg['Subject'] = f"Новая книга от автора {author_name}!"
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


def send_feedback_email(user_email, message_text):
    if not Config.MAIL_USERNAME or not Config.MAIL_PASSWORD:
        print("Ошибка: Данные MAIL_USERNAME/PASSWORD не найдены")
        return False

    msg = MIMEMultipart()
    msg['From'] = Config.MAIL_DEFAULT_SENDER
    msg['To'] = Config.MAIL_DEFAULT_SENDER
    msg['Subject'] = f"New Feedback from {user_email}"
    msg.attach(MIMEText(message_text, 'plain', 'utf-8'))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(Config.MAIL_SERVER, Config.MAIL_PORT, timeout=10) as server:
            if Config.MAIL_USE_TLS:
                server.starttls(context=context)

            server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
            server.send_message(msg)
            print(f"Фидбек от {user_email} успешно отправлен")
        return True
    except Exception as e:
        print(f"SMTP Error: {e}")
        return False