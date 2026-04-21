// main.js
import { openFullBookModal, renderBooks, renderPagination, initSearch } from './books_ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
    const bookGrid = document.querySelector('.profile-book-grid');
    const paginationContainer = document.getElementById('pagination');
    const filterOptions = document.querySelectorAll('.custom-option');
    const filterTrigger = document.querySelector('.custom-select__trigger span');

    let currentPage = 1;
    let currentFilter = 'all';

    // Сделаем функцию доступной глобально для onclick в HTML
    window.openFullBookModal = openFullBookModal;

    // --- 1. ЗАГРУЗКА ДАННЫХ ---
    async function loadData(page = 1, filter = 'all') {
        try {
            const res = await fetch(`/get_my_books?page=${page}&filter=${filter}`);
            const data = await res.json();

            renderBooks(data.books, bookGrid);
            renderPagination(data.total_pages, data.current_page, paginationContainer, (newPage) => {
                currentPage = newPage;
                loadData(currentPage, currentFilter);
            });
        } catch (err) {
            console.error("Ошибка загрузки коллекции:", err);
        }
    }

    // --- 2. ФИЛЬТРАЦИЯ (Кастомный селект) ---
    filterOptions.forEach(option => {
        option.addEventListener('click', function() {
            filterOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');

            currentFilter = this.getAttribute('data-value');
            filterTrigger.textContent = this.textContent;
            currentPage = 1;

            loadData(currentPage, currentFilter);
        });
    });

    // --- 3. ЛОГИКА МОДАЛЬНОГО ОКНА КНИГИ (Кнопки внутри) ---

    // === СКАЧАТЬ (Исправлено для принудительной загрузки) ===
    const downloadBtn = document.getElementById('modal-download-btn');
    if (downloadBtn) {
        downloadBtn.onclick = async function() {
            const modal = document.getElementById('book-modal');
            const fileUrl = modal.getAttribute('data-file-url');
            const bookId = modal.getAttribute('data-current-id');
            const bookTitle = document.getElementById('modal-name').textContent;

            if (fileUrl && fileUrl !== 'null') {
                try {
                    // Используем fetch, чтобы получить файл как Blob
                    // Это позволяет обойти настройки браузера "открывать в новой вкладке"
                    const response = await fetch(fileUrl);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);

                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;

                    // Задаем имя файла (название книги + расширение)
                    a.download = `${bookTitle || 'book'}.pdf`;

                    document.body.appendChild(a);
                    a.click();

                    // Чистим за собой
                    window.URL.revokeObjectURL(url);
                    a.remove();

                    // Трекаем скачивание в БД
                    fetch('/track_download', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ book_id: bookId })
                    });

                    if (window.showToast) window.showToast("Загрузка началась...");
                } catch (error) {
                    console.error("Ошибка при скачивании:", error);
                    // Если fetch не прошел (например, CORS), пробуем обычный способ
                    const link = document.createElement('a');
                    link.href = fileUrl;
                    link.target = '_blank';
                    link.download = '';
                    link.click();
                }
            } else {
                if (window.showToast) window.showToast("Файл книги не найден");
            }
        };
    }

    // ЧТЕНИЕ
    const readBtn = document.getElementById('modal-read-btn');
    if (readBtn) {
        readBtn.onclick = () => {
            const bookId = document.getElementById('book-modal').getAttribute('data-current-id');
            if (bookId) window.open(`/read/${bookId}`, '_blank');
        };
    }

    // ЗАМЕТКИ (Сохранение)
    const saveNoteBtn = document.getElementById('save-note-btn');
    if (saveNoteBtn) {
        saveNoteBtn.onclick = async () => {
            const bookId = document.getElementById('book-modal').getAttribute('data-current-id');
            const noteText = document.getElementById('book-note-text').value;

            const res = await fetch('/save_book_note', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ book_id: bookId, note: noteText })
            });

            if (res.ok && window.showToast) {
                window.showToast("Заметка сохранена!");
                document.getElementById('note-container').classList.add('hidden');
            }
        };
    }

    // УДАЛЕНИЕ КНИГИ
    const deleteBtn = document.getElementById('modal-delete-btn');
    if (deleteBtn) {
        deleteBtn.onclick = async () => {
            if (!confirm("Вы уверены, что хотите удалить свою книгу?")) return;

            const bookId = document.getElementById('book-modal').getAttribute('data-current-id');
            const res = await fetch(`/delete_book/${bookId}`, { method: 'DELETE' });

            if (res.ok) {
                location.reload();
            } else {
                alert("Ошибка при удалении");
            }
        };
    }

    // РЕДАКТИРОВАНИЕ (Открытие формы)
    const editBtn = document.getElementById('modal-edit-btn');
    if (editBtn) {
        editBtn.onclick = () => {
            const infoModal = document.getElementById('book-modal');
            const editModal = document.getElementById('editBookModal');

            // Переносим данные из инфо-модалки в форму редактирования
            document.getElementById('edit-book-id').value = infoModal.getAttribute('data-current-id');
            document.getElementById('edit-book-title').value = document.getElementById('modal-name').textContent;
            document.getElementById('edit-book-author').value = document.getElementById('modal-author').textContent;
            document.getElementById('edit-book-year').value = document.getElementById('modal-year').textContent.replace(/\D/g, '');
            document.getElementById('edit-book-genre').value = document.getElementById('modal-genre').textContent;
            document.getElementById('edit-book-description').value = document.getElementById('modal-description').textContent;
            document.getElementById('edit-cover-preview').src = infoModal.querySelector('.book-cover-img').src;

            infoModal.style.display = 'none';
            editModal.style.display = 'flex';
        };
    }

    // --- 4. ДОПОЛНИТЕЛЬНЫЕ ИНТЕРФЕЙСНЫЕ ФИШКИ ---

    // Переключатель выпадающего списка профиля в хедере
    const profileTrigger = document.getElementById('profileDropdownTrigger');
    if (profileTrigger) {
        profileTrigger.onclick = (e) => {
            e.stopPropagation();
            document.getElementById('headerProfileMenu').classList.toggle('active');
        };
    }

    // Переключатель заметки в модалке
    const noteBtn = document.getElementById('modal-note-btn');
    if (noteBtn) {
        noteBtn.onclick = (e) => {
            e.stopPropagation();
            document.getElementById('note-container').classList.toggle('hidden');
        };
    }

    // Переключатель статусов (More options)
    const moreBtn = document.getElementById('moreOptionsBtn');
    if (moreBtn) {
        moreBtn.onclick = (e) => {
            e.stopPropagation();
            document.getElementById('optionsDropdown').classList.toggle('active');
        };
    }

    // Клик по статусу (смена статуса в БД)
    document.querySelectorAll('.options-dropdown .dropdown-item').forEach(item => {
        item.onclick = async function() {
            const bookId = document.getElementById('book-modal').getAttribute('data-current-id');
            const status = this.textContent.trim();

            const res = await fetch('/update_library_status', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ book_id: bookId, status: status })
            });

            if (res.ok) {
                document.querySelectorAll('.options-dropdown .dropdown-item').forEach(i => i.classList.remove('active-status'));
                this.classList.add('active-status');
                if (window.showToast) window.showToast(`Статус: ${status}`);
                loadData(currentPage, currentFilter); // Обновляем сетку
            }
        };
    });

    // Закрытие всего при клике вне окон
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            document.body.style.overflow = '';
        }
        // Закрываем дропдауны
        const drops = document.querySelectorAll('.options-dropdown, .header-dropdown, .note-dropdown');
        drops.forEach(d => {
            if (!d.contains(e.target)) d.classList.remove('active');
            if (d.id === 'note-container' && !d.contains(e.target)) d.classList.add('hidden');
        });
    });

    // Универсальный Toast
    window.showToast = (message) => {
        let toast = document.getElementById('toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };

    // --- СТАРТ ---
    loadData();
});