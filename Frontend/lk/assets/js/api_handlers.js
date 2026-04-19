// api_handlers.js

export async function fetchMyBooks(page = 1) {
    const res = await fetch(`/get_my_books?page=${page}`);
    return await res.json();
}

// Новая функция для обновления книги
export async function updateBookRequest(formData) {
    const response = await fetch('/update_book', {
        method: 'POST',
        body: formData // Передаем FormData напрямую
    });
    return response;
}

export async function downloadBook(url, title, btn) {
    const original = btn.innerHTML;
    btn.innerHTML = "...";
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        const ext = url.split('?')[0].split('.').pop().toLowerCase();
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = `${title}.${ext}`;
        a.click();
    } catch (e) { window.open(url, '_blank'); }
    finally { btn.innerHTML = original; }
}