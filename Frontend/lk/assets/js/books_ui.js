// books_ui.js
import { closeModal } from './modals.js';

/**
 * Открывает модальное окно книги с полной синхронизацией данных
 * @param {HTMLElement} btn - Кнопка, на которую нажали
 */
export async function openFullBookModal(btn) {
    const modal = document.getElementById('book-modal');
    if (!modal) return;

    // 1. Извлекаем ID и проверяем на валидность
    const bookId = btn.getAttribute('data-id');
    if (!bookId || bookId === "null" || bookId === "undefined") {
        console.error("Ошибка: ID книги не найден");
        return;
    }

    // Сохраняем технические данные в атрибуты модалки для кнопок Скачать/Удалить/Читать
    modal.setAttribute('data-current-id', bookId);
    modal.setAttribute('data-file-url', btn.getAttribute('data-file-url') || "");

    // Находим элементы UI
    const avgRatingScore = document.getElementById('modal-avg-rating');
    const modalCover = modal.querySelector('.book-cover-img');
    const noteTextarea = document.getElementById('book-note-text');
    const noteContainer = document.getElementById('note-container');
    const readerTools = document.getElementById('reader-tools');
    const authorTools = document.getElementById('author-tools');
    const ratingSection = document.getElementById('user-rating-section');
    const stars = document.querySelectorAll('#interactive-rating .star-icon');
    const statusOptions = document.querySelectorAll('#optionsDropdown .dropdown-item');

    // 2. Сброс состояния перед заполнением
    statusOptions.forEach(opt => opt.classList.remove('active-status'));
    if (noteContainer) noteContainer.classList.add('hidden');
    if (noteTextarea) noteTextarea.value = "Загрузка...";

    let currentSelectedRating = 0;

    // Логика подсветки звезд (из каталога)
    const highlightStars = (count) => {
        stars.forEach((s, idx) => {
            if (idx < count) {
                s.style.filter = "invert(70%) sepia(90%) saturate(500%) hue-rotate(10deg)";
                s.style.opacity = "1";
            } else {
                s.style.filter = "grayscale(100%) brightness(40%)";
                s.style.opacity = "0.5";
            }
        });
    };
    highlightStars(0);

    // 3. Предзаполнение (данные из атрибутов кнопки — мгновенно)
    document.getElementById('modal-name').textContent = btn.getAttribute('data-title') || "Без названия";
    document.getElementById('modal-author').textContent = btn.getAttribute('data-author') || "Автор не указан";
    document.getElementById('modal-description').textContent = btn.getAttribute('data-desc') || "Описание отсутствует";
    document.getElementById('modal-pages').textContent = `Страницы: ${btn.getAttribute('data-pages') || '—'}`;
    document.getElementById('modal-year').textContent = `Год издания: ${btn.getAttribute('data-year') || '—'}`;
    document.getElementById('modal-genre').textContent = btn.getAttribute('data-genre') || "Жанр";
    document.getElementById('modal-downloads').textContent = `${btn.getAttribute('data-downloads') || 0} скачиваний`;

    if (avgRatingScore) avgRatingScore.textContent = btn.getAttribute('data-avg-rating') || "0.0";
    if (modalCover) modalCover.src = btn.getAttribute('data-cover') || "";

    // 4. Показываем модалку
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Обработчик закрытия на крестик
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        };
    }

    // 5. Загрузка динамических данных (статус, личная заметка, роль)
    try {
        const res = await fetch(`/get_book_user_data/${bookId}`);
        if (!res.ok) throw new Error("Ошибка получения данных");
        const data = await res.json();

        if (data.is_author) {
            // Если зашел автор книги
            if (readerTools) readerTools.style.display = 'none';
            if (ratingSection) ratingSection.style.display = 'none';
            if (authorTools) authorTools.style.display = 'flex';
            if (avgRatingScore) avgRatingScore.textContent = "Моя";
        } else {
            // Если зашел обычный читатель
            if (readerTools) readerTools.style.display = 'flex';
            if (ratingSection) ratingSection.style.display = 'block';
            if (authorTools) authorTools.style.display = 'none';

            if (avgRatingScore) avgRatingScore.textContent = data.avg_rating ? data.avg_rating.toFixed(1) : "0.0";
            if (noteTextarea) noteTextarea.value = (data.note === "Без заметки") ? "" : (data.note || "");

            // Установка активного статуса
            const statusMap = { 'read': 'Прочитана', 'reading': 'Читаю', 'dropped': 'В отложенные', 'wish': 'В желаемые' };
            const currentStatus = statusMap[data.status];
            statusOptions.forEach(opt => {
                if (opt.textContent.trim() === currentStatus) opt.classList.add('active-status');
            });

            currentSelectedRating = data.user_rating || 0;
            highlightStars(currentSelectedRating);
        }
    } catch (err) {
        console.error("Ошибка API:", err);
        if (noteTextarea) noteTextarea.value = "Ошибка загрузки данных пользователя.";
    }

    // 6. Инициализация кликов по звездам
    stars.forEach(star => {
        const val = parseInt(star.getAttribute('data-value'));
        star.onclick = async () => {
            try {
                const res = await fetch('/rate_book', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ book_id: bookId, rating: val })
                });
                const result = await res.json();
                if (result.status === 'success') {
                    currentSelectedRating = val;
                    highlightStars(val);
                    if (avgRatingScore) avgRatingScore.textContent = result.new_average.toFixed(1);
                    if (window.showToast) window.showToast(`Оценка ${val} сохранена!`);
                }
            } catch (err) { console.error("Ошибка при оценке:", err); }
        };
        star.onmouseenter = () => highlightStars(val);
        star.onmouseleave = () => highlightStars(currentSelectedRating);
    });
}

/**
 * Отрисовка сетки книг
 */
export function renderBooks(books, container) {
    if (!container) return;

    if (!books || books.length === 0) {
        container.innerHTML = '<div class="no-results-container"><h2 class="no-results-title">Библиотека пуста</h2></div>';
        return;
    }

    container.innerHTML = books.map(book => `
        <div class="profile-book-card">
            <div class="book-visual">
                <div class="css-book-shape">
                    <img src="${book.cover_url}" class="book-cover-img" alt="${book.title}">
                </div>
            </div>
            <div class="p-book-info">
                <h3>${book.title}</h3>
                <p class="p-author">${book.author_name}</p>
                <p class="p-desc">${(book.description || '').substring(0, 80)}...</p>
                <a href="#" 
                   class="btn-read-more" 
                   data-id="${book.id}"
                   data-title="${book.title}"
                   data-author="${book.author_name}"
                   data-desc="${book.description || ''}"
                   data-cover="${book.cover_url}"
                   data-pages="${book.pages || '—'}"
                   data-year="${book.release_year || '—'}"
                   data-genre="${book.genre || '—'}"
                   data-file-url="${book.file_url}"
                   data-avg-rating="${(book.average_rating || 0).toFixed(1)}"
                   data-downloads="${book.download_count || 0}"
                   onclick="openFullBookModal(this); return false;">Подробнее</a>
            </div>
        </div>`).join('');
}

/**
 * Пагинация
 */
export function renderPagination(total, current, container, callback) {
    if (!container) return;
    if (total <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = '';
    for (let i = 1; i <= total; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === current ? 'active' : ''}`;
        btn.textContent = i;
        btn.onclick = (e) => {
            e.preventDefault();
            callback(i);
        };
        container.appendChild(btn);
    }
}

/**
 * Поиск по локальным карточкам
 */
export function initSearch(input) {
    if (!input) return;
    input.oninput = (e) => {
        const val = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.profile-book-card');

        cards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const author = card.querySelector('.p-author').textContent.toLowerCase();
            card.style.display = (title.includes(val) || author.includes(val)) ? '' : 'none';
        });
    };
}