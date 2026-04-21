document.addEventListener('DOMContentLoaded', () => {

    // === 1. КАСТОМНЫЙ СЕЛЕКТ ЖАНРОВ ===
    const selectWrapper = document.querySelector('.custom-select-wrapper');
    const select = document.querySelector('.custom-select');
    const trigger = document.querySelector('.custom-select__trigger');
    const options = document.querySelectorAll('.custom-option');
    const customInput = document.getElementById('custom-genre-input');

    if (selectWrapper && trigger) {
        trigger.addEventListener('click', (e) => {
            select.classList.toggle('open');
            e.stopPropagation();
        });

        options.forEach(option => {
            option.addEventListener('click', function() {
                const val = this.getAttribute('data-value');
                const currentSelected = select.querySelector('.custom-option.selected');
                if (currentSelected) currentSelected.classList.remove('selected');
                this.classList.add('selected');

                trigger.querySelector('span').textContent = this.textContent;
                select.classList.remove('open');

                if (val === 'other') {
                    customInput.classList.remove('hidden');
                    customInput.focus();
                } else {
                    customInput.classList.add('hidden');
                    customInput.value = '';
                }
            });
        });

        window.addEventListener('click', (e) => {
            if (!selectWrapper.contains(e.target)) {
                select.classList.remove('open');
            }
        });
    }

    // === 2. ВЫПАДАЮЩЕЕ МЕНЮ ПРОФИЛЯ ===
    const profileTrigger = document.getElementById('profileDropdownTrigger');
    const profileMenu = document.getElementById('headerProfileMenu');

    if (profileTrigger && profileMenu) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!profileTrigger.contains(e.target)) {
                profileMenu.classList.remove('active');
            }
        });
    }

    // === 3. КНОПКА "НАВЕРХ" ===
    const btnUp = document.querySelector('.btn-up');
    if (btnUp) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                btnUp.style.opacity = '1';
                btnUp.style.visibility = 'visible';
            } else {
                btnUp.style.opacity = '0';
                btnUp.style.visibility = 'hidden';
            }
        });

        btnUp.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // === 4. ОБРАБОТКА ПОИСКА И ФИЛЬТРАЦИИ ===
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.querySelector('.search-btn');
    const yearInput = document.getElementById('filter-year');
    const authorInput = document.getElementById('filter-author');

    if (searchBtn) {
        const handleSearch = () => {
            const query = searchInput ? searchInput.value.trim() : '';
            const year = yearInput ? yearInput.value.trim() : '';
            const author = authorInput ? authorInput.value.trim() : '';

            const selectedOption = select ? select.querySelector('.custom-option.selected') : null;
            let genre = selectedOption ? selectedOption.getAttribute('data-value') : '';

            if (genre === 'other' && customInput) {
                const manualGenre = customInput.value.trim();
                if (manualGenre !== '') genre = manualGenre;
            }

            const url = new URL(window.location.origin + window.location.pathname);
            if (query) url.searchParams.set('search', query);
            if (genre) url.searchParams.set('genre', genre);
            if (year) url.searchParams.set('year', year);
            if (author) url.searchParams.set('author', author);

            url.searchParams.set('page', 1);
            window.location.href = url.href;
        };

        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleSearch();
        });

        [searchInput, yearInput, authorInput, customInput].forEach(el => {
            if (el) {
                el.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') handleSearch();
                });
            }
        });
    }

    const showToast = (message) => {
        const toast = document.createElement('div');
        toast.className = 'status-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    };

    // === 5. МОДАЛЬНОЕ ОКНО ПОДРОБНОСТЕЙ ===
    const modal = document.getElementById('book-modal');
    const closeModal = document.querySelector('.close-modal');
    const catalogGrid = document.querySelector('.catalog-main-grid');

    if (catalogGrid && modal) {
        catalogGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.open-modal-btn');
            if (!btn) return;
            e.preventDefault();

            // 1. Извлекаем данные из атрибутов кнопки
            const bookId = btn.getAttribute('data-id');
            const bookTitle = btn.getAttribute('data-title');
            const fileUrl = btn.getAttribute('data-file-url');
            const cover = btn.getAttribute('data-cover');
            const avgRating = btn.getAttribute('data-avg-rating') || "0.0"; // СРЕДНИЙ РЕЙТИНГ

            // Элементы внутри модалки
            const statusOptions = document.querySelectorAll('#optionsDropdown .dropdown-item');
            const noteTextarea = document.getElementById('book-note-text');
            const noteContainer = document.getElementById('note-container');
            const downloadBtn = document.getElementById('modal-download-btn');
            const noteBtn = document.getElementById('modal-note-btn');
            const saveNoteBtn = document.getElementById('save-note-btn');
            const readBtn = document.getElementById('modal-read-btn');
            const modalCover = modal.querySelector('.book-cover-img');
            const stars = document.querySelectorAll('#interactive-rating .star-icon');

            // 2. Сброс состояния перед показом
            statusOptions.forEach(opt => opt.classList.remove('active-status'));
            if (noteContainer) noteContainer.classList.add('hidden');
            if (noteTextarea) noteTextarea.value = "Загрузка...";

            let currentSelectedRating = 0; // Для хранения личной оценки пользователя

            // 3. Заполнение текстовых полей
            const safeSetText = (id, text) => {
                const el = document.getElementById(id);
                if (el) el.textContent = text;
            };
            const downloadCount = btn.getAttribute('data-downloads') || "0";
            safeSetText('modal-downloads', `${downloadCount} скачиваний`);
            safeSetText('modal-name', bookTitle);
            safeSetText('modal-author', btn.getAttribute('data-author'));
            safeSetText('modal-description', btn.getAttribute('data-desc'));
            safeSetText('modal-pages', `Страницы: ${btn.getAttribute('data-pages') || '—'}`);
            safeSetText('modal-year', `Год издания: ${btn.getAttribute('data-year') || '—'}`);
            safeSetText('modal-genre', btn.getAttribute('data-genre'));
            safeSetText('modal-avg-rating', avgRating); // Устанавливаем средний рейтинг в модалку

            if (modalCover) modalCover.src = cover;

            // 4. Загрузка данных пользователя (Заметка, Статус, Личный рейтинг)
            fetch(`/get_book_user_data/${bookId}`)
                .then(res => res.json())
                .then(data => {
                    // Заметка
                    if (noteTextarea) {
                        noteTextarea.value = (data.note === "Без заметки") ? "" : (data.note || "");
                    }

                    // Статус
                    if (data.status && data.status !== 'none') {
                        statusOptions.forEach(opt => {
                            if (opt.textContent.trim() === data.status) opt.classList.add('active-status');
                        });
                    }

                    // Личный рейтинг (Звезды)
                    currentSelectedRating = data.user_rating || 0;
                    highlightStars(currentSelectedRating);
                })
                .catch(() => {
                    if (noteTextarea) noteTextarea.value = "";
                    highlightStars(0);
                });

            // 5. Логика СТАТУСОВ
            statusOptions.forEach(option => {
                option.onclick = async function(event) {
                    event.preventDefault();
                    const selectedStatus = this.textContent.trim();

                    try {
                        const response = await fetch('/update_library_status', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ book_id: bookId, status: selectedStatus })
                        });
                        const result = await response.json();

                        if (result.status === 'removed' || result.status === 'status_none') {
                            this.classList.remove('active-status');
                            showToast("Статус удален");
                        } else {
                            statusOptions.forEach(opt => opt.classList.remove('active-status'));
                            this.classList.add('active-status');
                            showToast(`Статус: ${selectedStatus}`);
                        }
                        document.getElementById('optionsDropdown').classList.remove('active');
                    } catch (err) { console.error("Ошибка обновления статуса:", err); }
                };
            });

            // 6. Логика ЛИЧНОГО РЕЙТИНГА (ЗВЁЗДЫ)
            function highlightStars(count) {
                stars.forEach((s, index) => {
                    if (index < count) {
                        s.style.filter = "invert(70%) sepia(90%) saturate(500%) hue-rotate(10deg)";
                        s.style.opacity = "1";
                    } else {
                        s.style.filter = "grayscale(100%) brightness(40%)";
                        s.style.opacity = "0.5";
                    }
                });
            }

            stars.forEach(star => {
                const val = parseInt(star.getAttribute('data-value'));

                star.onmouseenter = () => highlightStars(val);
                star.onmouseleave = () => highlightStars(currentSelectedRating);

                star.onclick = async () => {
                    try {
                        const response = await fetch('/rate_book', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ book_id: bookId, rating: val })
                        });
                        const result = await response.json();

                        if (result.status === 'success') {
                            currentSelectedRating = val;
                            highlightStars(val);
                            // Обновляем средний рейтинг в модалке сразу после оценки
                            safeSetText('modal-avg-rating', result.new_average.toFixed(1));
                            showToast(`Оценка ${val} сохранена!`);
                        }
                    } catch (err) { console.error("Ошибка сохранения рейтинга:", err); }
                };
            });

            // 7. Логика СКАЧИВАНИЯ
            if (downloadBtn) {
                downloadBtn.onclick = async function(event) {
                    event.preventDefault();
                    if (!fileUrl) return;

                    const originalContent = this.innerHTML;
                    this.innerHTML = "...";
                    this.style.pointerEvents = "none";

                    try {
                        // Сначала уведомляем сервер о скачивании для статистики
                        const trackRes = await fetch('/track_download', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ book_id: bookId })
                        });
                        const trackData = await trackRes.json();

                        // Если счетчик обновился, меняем цифру в модалке
                        if (trackData.status === 'counted') {
                            const downloadText = modal.querySelector('.downloads');
                            if (downloadText) downloadText.textContent = `${trackData.new_count} скачиваний`;
                        }

                        // Теперь запускаем само скачивание файла
                        const res = await fetch(fileUrl);
                        const blob = await res.blob();
                        const extension = fileUrl.split('?')[0].split('.').pop().toLowerCase() || 'pdf';
                        const downloadUrl = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = downloadUrl;
                        a.download = `${bookTitle}.${extension}`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(downloadUrl);
                        document.body.removeChild(a);

                    } catch (err) {
                        console.error("Ошибка скачивания:", err);
                        window.open(fileUrl, '_blank');
                    } finally {
                        this.innerHTML = originalContent;
                        this.style.pointerEvents = "auto";
                    }
                };
            }

            // 8. Логика ЗАМЕТОК
            if (noteBtn) {
                noteBtn.onclick = (event) => {
                    event.stopPropagation();
                    noteContainer.classList.toggle('hidden');
                    if (!noteContainer.classList.contains('hidden')) noteTextarea.focus();
                };
            }

            if (saveNoteBtn) {
                saveNoteBtn.onclick = async () => {
                    const text = noteTextarea.value.trim();
                    try {
                        const response = await fetch('/save_book_note', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ book_id: bookId, note: text })
                        });
                        if (response.ok) {
                            showToast("Заметка сохранена");
                            noteContainer.classList.add('hidden');
                        }
                    } catch (err) { console.error("Ошибка сохранения заметки:", err); }
                };
            }

            // 9. Кнопка ЧТЕНИЯ
            if (readBtn) {
                readBtn.onclick = () => { window.location.href = `/read/${bookId}`; };
            }

            // Показываем модалку
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });

        // Обработчик закрытия по кнопке "X"
        if (closeModal) {
            closeModal.onclick = () => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            };
        }

        // Обработчик кликов по окну
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }

            const noteContainer = document.getElementById('note-container');
            const noteBtn = document.getElementById('modal-note-btn');
            if (noteContainer && !noteContainer.classList.contains('hidden')) {
                if (!noteContainer.contains(e.target) && !noteBtn.contains(e.target)) {
                    noteContainer.classList.add('hidden');
                }
            }
        });
    }

    // === 6. ДОПОЛНИТЕЛЬНОЕ МЕНЮ В МОДАЛКЕ (Options Dropdown) ===
    // Используем ID, который прописан в HTML: moreOptionsBtn
    const moreOptionsBtn = document.getElementById('moreOptionsBtn');
    const optionsDropdown = document.getElementById('optionsDropdown');

    if (moreOptionsBtn && optionsDropdown) {
        moreOptionsBtn.addEventListener('click', (e) => {
            // Останавливаем всплытие, чтобы клик не дошел до окна и не закрыл его
            e.stopPropagation();
            optionsDropdown.classList.toggle('active');
        });

        // Закрываем выпадашку, если кликнули куда угодно еще
        document.addEventListener('click', (e) => {
            if (!moreOptionsBtn.contains(e.target)) {
                optionsDropdown.classList.remove('active');
            }
        });
    }
});

