import { closeModal } from './modals.js';


export async function openFullBookModal(btn) {
    const modal = document.getElementById('book-modal');
    if (!modal) return;
    const readerTools = document.getElementById('reader-tools');
    const authorTools = document.getElementById('author-tools');
    const ratingSection = document.getElementById('user-rating-section'); // Секция "Оцените книгу"

    if (readerTools) readerTools.style.display = 'none';
    if (authorTools) authorTools.style.display = 'none';
    const bookId = btn.getAttribute('data-id');
    const downloadCount = btn.getAttribute('data-downloads') || "0";
    if (!bookId || bookId === "null") return;
    // Находим элемент для отображения счетчика (убедись, что такой ID есть в HTML модалки)
    const downloadDisplay = document.getElementById('modal-downloads');
    if (downloadDisplay) {
        downloadDisplay.textContent = `${downloadCount} скачиваний`;
    }
    modal.setAttribute('data-current-id', bookId);
    modal.setAttribute('data-file-url', btn.getAttribute('data-file-url') || "");

    const avgRatingScore = document.getElementById('modal-avg-rating');
    const noteTextarea = document.getElementById('book-note-text');
    const noteContainer = document.getElementById('note-container');
    const stars = document.querySelectorAll('#interactive-rating .star-icon');

    // Элементы статуса
    const moreOptionsBtn = document.getElementById('moreOptionsBtn');
    const optionsDropdown = document.getElementById('optionsDropdown');

    if (noteContainer) noteContainer.classList.add('hidden');
    if (optionsDropdown) optionsDropdown.classList.remove('show');

    // Предзаполнение данных из атрибутов
    document.getElementById('modal-name').textContent = btn.getAttribute('data-title') || "Без названия";
    document.getElementById('modal-author').textContent = btn.getAttribute('data-author') || "Автор не указан";
    document.getElementById('modal-description').textContent = btn.getAttribute('data-desc') || "";
    document.getElementById('modal-pages').textContent = `Страницы: ${btn.getAttribute('data-pages') || '—'}`;
    document.getElementById('modal-year').textContent = `Год издания: ${btn.getAttribute('data-year') || '—'}`;
    document.getElementById('modal-genre').textContent = btn.getAttribute('data-genre') || "Жанр";

    if (avgRatingScore) avgRatingScore.textContent = btn.getAttribute('data-avg-rating') || "0.0";
    const modalCover = modal.querySelector('.book-cover-img');
    if (modalCover) modalCover.src = btn.getAttribute('data-cover') || "";

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // 1. ЛОГИКА ОТКРЫТИЯ МЕНЮ СТАТУСОВ И ЗАМЕТОК
    if (moreOptionsBtn && optionsDropdown) {
        moreOptionsBtn.onclick = (e) => {
            e.stopPropagation();
            optionsDropdown.classList.toggle('show');
        };
    }
    const readBtn = document.getElementById('modal-read-btn');
    if (readBtn) {
        readBtn.onclick = (e) => {
            e.preventDefault();
            // Перебрасываем на /read/ID_КНИГИ
            window.location.href = `/read/${bookId}`;
        };
    }
    const noteBtn = document.getElementById('modal-note-btn');
    if (noteBtn && noteContainer) {
        noteBtn.onclick = (e) => {
            e.stopPropagation();
            noteContainer.classList.toggle('hidden');
        };
    }

    // Закрытие выпадашек при клике в любое место модалки
    modal.onclick = (e) => {
        if (optionsDropdown && !optionsDropdown.contains(e.target) && e.target !== moreOptionsBtn) {
            optionsDropdown.classList.remove('show');
        }
    };

    let currentSelectedRating = 0;
    const highlightStars = (count) => {
        stars.forEach((s, idx) => {
            s.style.filter = idx < count ? "invert(70%) sepia(90%) saturate(500%) hue-rotate(10deg)" : "grayscale(100%) brightness(40%)";
            s.style.opacity = idx < count ? "1" : "0.5";
        });
    };

    // 2. ЗАГРУЗКА И ОБРАБОТКА ДАННЫХ (СТАТУС, РЕЙТИНГ, ЗАМЕТКА)
    try {
        const res = await fetch(`/get_book_user_data/${bookId}`);
        const data = await res.json();
        if (data.is_author) {
            // ЛОГИКА АВТОРА
            if (authorTools) authorTools.style.display = 'flex';
            if (ratingSection) ratingSection.style.display = 'none'; // Автор не оценивает свою книгу
            const editBtn = document.getElementById('modal-edit-btn');
            const editModal = document.getElementById('editBookModal');

            if (editBtn && editModal) {
                editBtn.onclick = () => {
                    // Заполняем скрытый ID
                    document.getElementById('edit-book-id').value = bookId;

                    // Заполняем текстовые поля (берём из текущей открытой модалки)
                    document.getElementById('edit-book-title').value = document.getElementById('modal-name').textContent;
                    document.getElementById('edit-book-author').value = document.getElementById('modal-author').textContent;

                    // Чистим год от текста "Год издания: " и жанр
                    document.getElementById('edit-book-year').value = document.getElementById('modal-year').textContent.replace(/\D/g, "");
                    document.getElementById('edit-book-genre').value = document.getElementById('modal-genre').textContent;
                    document.getElementById('edit-book-description').value = document.getElementById('modal-description').textContent;

                    // Копируем превью обложки
                    const currentCover = modal.querySelector('.book-cover-img').src;
                    document.getElementById('edit-cover-preview').src = currentCover;

                    // Закрываем основную модалку и открываем редактирование
                    modal.style.display = 'none';
                    editModal.style.display = 'flex';
                };
            }

            // Здесь можно вывести "Моя книга" вместо рейтинга
            const avgRatingScore = document.getElementById('modal-avg-rating');
            if (avgRatingScore) avgRatingScore.textContent = "Моя";
        } else {
            // ЛОГИКА ЧИТАТЕЛЯ
            if (readerTools) readerTools.style.display = 'flex';
            if (ratingSection) ratingSection.style.display = 'block';

            // Дальше твоя стандартная логика статусов и заметок...
            renderReaderLogic(data, bookId);
        }
        if (noteTextarea) noteTextarea.value = (data.note === "Без заметки") ? "" : (data.note || "");

        currentSelectedRating = data.user_rating || 0;
        highlightStars(currentSelectedRating);
        // --- ЛОГИКА УДАЛЕНИЯ ---
        const deleteBtn = document.getElementById('modal-delete-btn');
        const confirmModal = document.getElementById('confirmDeleteModal');
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const cancelBtn = document.getElementById('cancelDeleteBtn');

        if (deleteBtn) {
            deleteBtn.onclick = () => {
                // Показываем окно подтверждения
                confirmModal.style.display = 'flex';
                // Не закрываем основную модалку пока что, просто вешаем подтверждение сверху
            };
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => {
                confirmModal.style.display = 'none';
            };
        }

        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                const currentId = modal.getAttribute('data-current-id');
                if (!currentId) return;

                try {
                    const res = await fetch(`/delete_book/${currentId}`, { method: 'DELETE' });
                    if (res.ok) {
                        confirmModal.style.display = 'none';
                        modal.style.display = 'none'; // Закрываем и карточку книги
                        showToast("Книга успешно удалена");

                        setTimeout(() => {
                            location.reload();
                        }, 1500);
                    }
                } catch (err) {
                    console.error("Ошибка при удалении:", err);
                    showToast("Ошибка соединения");
                }
            };
        }

        // Закрытие по клику вне окна подтверждения
        window.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                confirmModal.style.display = 'none';
            }
        });
        // ЛОГИКА СТАТУСОВ (ОБРАБОТКА КЛИКОВ)
        // --- ЛОГИКА СТАТУСОВ ---
        const moreOptionsBtn = document.getElementById('moreOptionsBtn');
        const optionsDropdown = document.getElementById('optionsDropdown');

        if (moreOptionsBtn && optionsDropdown) {
            moreOptionsBtn.onclick = (e) => {
                e.stopPropagation();
                // Используем .active, как прописано в твоем CSS
                optionsDropdown.classList.toggle('active');
            };
        }

        // Закрытие выпадашки при клике мимо неё
        modal.onclick = (e) => {
            // Проверяем клик по кнопке заметок (чтобы не мешать toggle заметки)
            const noteBtn = document.getElementById('modal-note-btn');
            const noteContainer = document.getElementById('note-container');

            // Закрываем меню статусов, если кликнули не по нему
            if (optionsDropdown && !optionsDropdown.contains(e.target) && e.target !== moreOptionsBtn) {
                optionsDropdown.classList.remove('active');
            }

            // Закрываем заметку, если кликнули вне её контейнера и не по кнопке вызова
            if (noteContainer && !noteContainer.contains(e.target) && e.target !== noteBtn && !noteContainer.classList.contains('hidden')) {
                // noteContainer.classList.add('hidden'); // Можно раскомментировать, если хочешь закрывать кликом мимо
            }
        };
        try {
            const res = await fetch(`/get_book_user_data/${bookId}`);
            const data = await res.json();

            if (noteTextarea) noteTextarea.value = (data.note === "Без заметки") ? "" : (data.note || "");

            currentSelectedRating = data.user_rating || 0;
            highlightStars(currentSelectedRating);

            // --- ЛОГИКА СТАТУСОВ ---
            const statusItems = document.querySelectorAll('#optionsDropdown .dropdown-item');

            // Мапа для сопоставления (база -> текст кнопки)
            const statusTextMap = {
                'read': 'Прочитана',
                'reading': 'Читаю',
                'dropped': 'В отложенные',
                'wish': 'В желаемые'
            };
            const currentStatusText = statusTextMap[data.status];

            statusItems.forEach(item => {
                // 1. Подсвечиваем активный статус сразу при загрузке
                item.classList.remove('active-status');
                if (item.textContent.trim() === currentStatusText) {
                    item.classList.add('active-status');
                }

                // 2. Сбрасываем старые обработчики, чтобы не было дублей уведомлений
                item.onclick = null;

                item.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const statusText = item.textContent.trim();

                    try {
                        const sRes = await fetch('/update_library_status', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ book_id: bookId, status: statusText })
                        });
                        const sData = await sRes.json();

                        if (sData.status) {
                            // Показываем уведомление (только одно!)
                            if (window.showToast) window.showToast(`Статус: ${statusText}`);

                            // Визуально переключаем активный класс
                            statusItems.forEach(i => i.classList.remove('active-status'));
                            item.classList.add('active-status');

                            // Закрываем меню
                            optionsDropdown.classList.remove('active');
                        }
                    } catch (err) { console.error("Ошибка смены статуса:", err); }
                };
            });

        } catch (err) { console.error("Ошибка API:", err); }

        // ЛОГИКА РЕЙТИНГА
        stars.forEach(star => {
            const val = parseInt(star.getAttribute('data-value'));
            star.onclick = async () => {
                const r = await fetch('/rate_book', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ book_id: bookId, rating: val })
                });
                const result = await r.json();
                if (result.status === 'success') {
                    currentSelectedRating = val;
                    highlightStars(val);
                    if (avgRatingScore) avgRatingScore.textContent = result.new_average.toFixed(1);
                }
            };
            star.onmouseenter = () => highlightStars(val);
            star.onmouseleave = () => highlightStars(currentSelectedRating);
        });
    } catch (err) { console.error("Ошибка API:", err); }
}

export function renderBooks(books, container) {
    if (!container) return;
    if (!books || books.length === 0) {
        container.innerHTML = '<div class="no-results-container"><h2 class="no-results-title">Библиотека пуста</h2></div>';
        return;
    }
    container.innerHTML = books.map(book => `
    <div class="profile-book-card">
        <div class="book-visual"><div class="css-book-shape"><img src="${book.cover_url}" class="book-cover-img"></div></div>
        <div class="p-book-info">
            <h3>${book.title}</h3>
            <p class="p-author">${book.author_name}</p>
            <p class="p-desc">${(book.description || '').substring(0, 80)}...</p>
            <a href="#" class="btn-read-more" 
               data-id="${book.id}" 
               data-title="${book.title}" 
               data-author="${book.author_name}"
               data-desc="${book.description || ''}" 
               data-cover="${book.cover_url}"
               data-pages="${book.pages || '—'}" 
               data-year="${book.release_year || '—'}"
               data-genre="${book.genre || '—'}" 
               data-file-url="${book.file_url}"
               data-downloads="${book.download_count || 0}" 
               data-avg-rating="${(book.average_rating || 0).toFixed(1)}"
               onclick="openFullBookModal(this); return false;">Подробнее</a>
        </div>
    </div>`).join('');
}



export function renderPagination(total, current, container, callback) {
    if (!container || total <= 1) { if(container) container.innerHTML = ''; return; }
    for (let i = 1; i <= total; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === current ? 'active' : ''}`;
        btn.textContent = i;
        btn.onclick = (e) => { e.preventDefault(); callback(i); };
        container.appendChild(btn);
    }
}

export function initSearch(input) {
    if (!input) return;
    input.oninput = (e) => {
        const val = e.target.value.toLowerCase();
        document.querySelectorAll('.profile-book-card').forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const author = card.querySelector('.p-author').textContent.toLowerCase();
            card.style.display = (title.includes(val) || author.includes(val)) ? '' : 'none';
        });
    };
}