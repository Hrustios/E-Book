import { closeModal } from './modals.js';

export async function openFullBookModal(btn) {
    const modal = document.getElementById('book-modal');
    if (!modal) return;

    // Элементы управления
    const readerTools = document.getElementById('reader-tools');
    const authorTools = document.getElementById('author-tools');
    const ratingSection = document.getElementById('user-rating-section');
    const downloadDisplay = document.getElementById('modal-downloads');
    const avgRatingScore = document.getElementById('modal-avg-rating');
    const noteTextarea = document.getElementById('book-note-text');
    const noteContainer = document.getElementById('note-container');
    const stars = document.querySelectorAll('#interactive-rating .star-icon');
    const moreOptionsBtn = document.getElementById('moreOptionsBtn');
    const optionsDropdown = document.getElementById('optionsDropdown');

    // Сброс видимости перед открытием
    if (readerTools) readerTools.style.display = 'none';
    if (authorTools) authorTools.style.display = 'none';
    if (noteContainer) noteContainer.classList.add('hidden');
    if (optionsDropdown) optionsDropdown.classList.remove('active', 'show');

    const bookId = btn.getAttribute('data-id');
    const downloadCount = btn.getAttribute('data-downloads') || "0";
    if (!bookId || bookId === "null") return;

    // Установка базовых атрибутов
    modal.setAttribute('data-current-id', bookId);
    modal.setAttribute('data-file-url', btn.getAttribute('data-file-url') || "");
    if (downloadDisplay) downloadDisplay.textContent = `${downloadCount} скачиваний`;

    // Предзаполнение данных из атрибутов кнопки
    document.getElementById('modal-name').textContent = btn.getAttribute('data-title') || "Без названия";
    document.getElementById('modal-author').textContent = btn.getAttribute('data-author') || "Автор не указан";
    document.getElementById('modal-description').textContent = btn.getAttribute('data-desc') || "";
    document.getElementById('modal-pages').textContent = `Страницы: ${btn.getAttribute('data-pages') || '—'}`;
    document.getElementById('modal-year').textContent = `Год издания: ${btn.getAttribute('data-year') || '—'}`;
    document.getElementById('modal-genre').textContent = btn.getAttribute('data-genre') || "Жанр";

    if (avgRatingScore) avgRatingScore.textContent = btn.getAttribute('data-avg-rating') || "0.0";
    const modalCover = modal.querySelector('.book-cover-img');
    if (modalCover) modalCover.src = btn.getAttribute('data-cover') || "";

    // Показываем модалку
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // --- ЛОГИКА КНОПОК (ИНТЕРФЕЙС) ---

    if (moreOptionsBtn && optionsDropdown) {
        moreOptionsBtn.onclick = (e) => {
            e.stopPropagation();
            optionsDropdown.classList.toggle('active');
        };
    }

    const noteBtn = document.getElementById('modal-note-btn');
    if (noteBtn && noteContainer) {
        noteBtn.onclick = (e) => {
            e.stopPropagation();
            noteContainer.classList.toggle('hidden');
        };
    }

    const readBtn = document.getElementById('modal-read-btn');
    if (readBtn) {
        readBtn.onclick = (e) => {
            e.preventDefault();
            // Берем актуальный URL файла, который мы записали в модалку чуть выше
            const fileUrl = modal.getAttribute('data-file-url');

            if (fileUrl) {
                // Если ты используешь встроенную читалку (PDF.js или свою),
                // то оставляем редирект на /read/ c ID, но если нужно просто открыть файл:
                window.location.href = `/read/${bookId}`;

                // Если /read/ перестал работать из-за бэка, можно открывать напрямую:
                // window.open(fileUrl, '_blank');
            } else {
                if (window.showToast) showToast("Файл книги не найден");
            }
        };
    }

    // Универсальное закрытие выпадашек при клике по модалке
    modal.onclick = (e) => {
        if (optionsDropdown && !optionsDropdown.contains(e.target) && e.target !== moreOptionsBtn) {
            optionsDropdown.classList.remove('active', 'show');
        }
    };

    const highlightStars = (count) => {
        stars.forEach((s, idx) => {
            s.style.filter = idx < count ? "invert(70%) sepia(90%) saturate(500%) hue-rotate(10deg)" : "grayscale(100%) brightness(40%)";
            s.style.opacity = idx < count ? "1" : "0.5";
        });
    };

    // --- ЗАГРУЗКА ДАННЫХ И ЛОГИКА СЕРВЕРА ---

    try {
        const res = await fetch(`/get_book_user_data/${bookId}`);
        const data = await res.json();

        // 1. Разделение Автора и Читателя
        if (data.is_author) {
            if (authorTools) authorTools.style.display = 'flex';
            if (ratingSection) ratingSection.style.display = 'none';
            if (avgRatingScore) avgRatingScore.textContent = "Моя";

            const editBtn = document.getElementById('modal-edit-btn');
            const editModal = document.getElementById('editBookModal');
            if (editBtn && editModal) {
                editBtn.onclick = () => {
                    document.getElementById('edit-book-id').value = bookId;
                    document.getElementById('edit-book-title').value = document.getElementById('modal-name').textContent;
                    document.getElementById('edit-book-author').value = document.getElementById('modal-author').textContent;
                    document.getElementById('edit-book-year').value = document.getElementById('modal-year').textContent.replace(/\D/g, "");
                    document.getElementById('edit-book-genre').value = document.getElementById('modal-genre').textContent;
                    document.getElementById('edit-book-description').value = document.getElementById('modal-description').textContent;
                    document.getElementById('edit-cover-preview').src = modal.querySelector('.book-cover-img').src;
                    modal.style.display = 'none';
                    editModal.style.display = 'flex';
                };
            }
        } else {
            if (readerTools) readerTools.style.display = 'flex';
            if (ratingSection) ratingSection.style.display = 'block';

            // Логика статусов (только для читателя)

            // 1. Находим элементы заново, чтобы быть уверенными
            const statusItems = optionsDropdown.querySelectorAll('.dropdown-item');

            const statusMap = {
                'Прочитана': 'read',
                'Читаю': 'reading',
                'В отложенные': 'dropped',
                'В желаемые': 'wish'
            };

            statusItems.forEach(item => {
                const itemText = item.textContent.trim();
                const statusCode = statusMap[itemText];

                // Подсветка активного при открытии
                item.classList.toggle('active-status', statusCode === data.status);

                // ВАЖНО: Используем addEventListener вместо onclick, предварительно удаляя старые через клонирование
                const newItem = item.cloneNode(true);
                item.parentNode.replaceChild(newItem, item);

                newItem.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    console.log(`Клик по статусу: ${itemText}, отправляем на бэкенд...`);

                    try {
                        const sRes = await fetch('/update_library_status', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                book_id: bookId,
                                status: itemText // Шлем "Прочитана" для твоего роута
                            })
                        });

                        const sData = await sRes.json();
                        console.log("Ответ сервера:", sData);

                        // Добавляем проверку на "updated"
                        if (sData.status === 'success' || sData.status === 'updated' || sData.status === true) {
                            // Снимаем класс со всех и ставим на текущий
                            optionsDropdown.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active-status'));
                            newItem.classList.add('active-status');

                            // Закрываем меню
                            optionsDropdown.classList.remove('active');

                            if (window.showToast) {
                                showToast(`Статус изменен: ${itemText}`);
                            }
                        } else {
                            console.error("Сервер вернул статус, который мы не ожидали:", sData);
                        }
                    } catch (err) {
                        console.error("Ошибка при выполнении запроса:", err);
                    }
                });
            });
        }

        // 2. Общая логика (Рейтинг и Заметки)
        if (noteTextarea) noteTextarea.value = (data.note === "Без заметки") ? "" : (data.note || "");

        let currentSelectedRating = data.user_rating || 0;
        highlightStars(currentSelectedRating);

        stars.forEach(star => {
            const val = parseInt(star.getAttribute('data-value'));
            star.onclick = async () => {
                const r = await fetch('/rate_book', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ book_id: bookId, rating: val })
                });
                const result = await r.json();
                if (result.status === 'success') {
                    currentSelectedRating = val;
                    highlightStars(val);
                    if (avgRatingScore && result.new_average !== undefined) {
                        avgRatingScore.textContent = result.new_average.toFixed(1);
                    }
                }
            };
            star.onmouseenter = () => highlightStars(val);
            star.onmouseleave = () => highlightStars(currentSelectedRating);
        });

    } catch (err) {
        console.error("Ошибка API данных пользователя:", err);
    }

    // --- ЛОГИКА УДАЛЕНИЯ ---
    const deleteBtn = document.getElementById('modal-delete-btn');
    const confirmModal = document.getElementById('confirmDeleteModal');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const cancelBtn = document.getElementById('cancelDeleteBtn');

    if (deleteBtn) {
        deleteBtn.onclick = () => { confirmModal.style.display = 'flex'; };
    }
    if (cancelBtn) {
        cancelBtn.onclick = () => { confirmModal.style.display = 'none'; };
    }
    if (confirmBtn) {
        confirmBtn.onclick = async () => {
            try {
                const res = await fetch(`/delete_book/${bookId}`, { method: 'DELETE' });
                if (res.ok) {
                    confirmModal.style.display = 'none';
                    modal.style.display = 'none';
                    if (window.showToast) showToast("Книга успешно удалена");
                    setTimeout(() => location.reload(), 1500);
                }
            } catch (err) { console.error("Ошибка удаления:", err); }
        };
    }
    modal.onclick = (e) => {
        // Если кликнули именно по подложке, а не по её дочерним элементам (контенту)
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Возвращаем скролл
            if (optionsDropdown) optionsDropdown.classList.remove('active', 'show');
        }
    };
    // Клик вне окна подтверждения
    window.addEventListener('click', (e) => {
        if (e.target === confirmModal) confirmModal.style.display = 'none';
    });
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
               data-file-url="${book.file_url.startsWith('http') ? book.file_url : '/static/uploads/books/' + book.file_url}"
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