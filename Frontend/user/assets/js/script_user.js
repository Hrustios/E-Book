document.addEventListener('DOMContentLoaded', () => {

    // === 1. ИКОНКИ-ПЕРЕКЛЮЧАТЕЛИ ===
    const toggleButtons = document.querySelectorAll('.js-toggle-icon');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const img = this.querySelector('img');
            if (!img) return;
            const originalIcon = img.src;
            const activeIcon = this.getAttribute('data-active-icon');

            if (activeIcon) {
                img.src = activeIcon;
                this.setAttribute('data-active-icon', originalIcon);
                this.classList.toggle('is-active');
            }
        });
    });

    // === 2. КНОПКА "НАВЕРХ" ===
    const btnUp = document.querySelector('.btn-up');
    if (btnUp) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
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

    // === 3. МЕНЮ ПРОФИЛЯ В ШАПКЕ ===
    const profileTrigger = document.getElementById('profileDropdownTrigger');
    const profileMenu = document.getElementById('headerProfileMenu');
    if (profileTrigger && profileMenu) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!profileTrigger.contains(e.target)) profileMenu.classList.remove('active');
        });
    }

    // === 4. МОДАЛЬНОЕ ОКНО ПРОСМОТРА КНИГИ ===
    const infoModal = document.getElementById("book-modal");
    const closeInfoBtn = document.querySelector("#book-modal .close-modal");

    const openModal = (modal) => {
        if (!modal) return;
        modal.style.display = "flex";
        setTimeout(() => modal.classList.add('is-visible'), 10);
        document.body.style.overflow = "hidden";
    };

    const closeModal = (modal) => {
        if (!modal) return;
        modal.classList.remove('is-visible');
        setTimeout(() => {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        }, 400);
    };

    // ГЛАВНЫЙ СЛУШАТЕЛЬ КЛИКА ПО КАРТОЧКЕ
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.open-modal-btn');
        if (!btn) return;
        e.preventDefault();

        // 1. Извлекаем данные
        const data = {
            id: btn.getAttribute('data-id'),
            title: btn.getAttribute('data-title'),
            author: btn.getAttribute('data-author'),
            desc: btn.getAttribute('data-desc'),
            cover: btn.getAttribute('data-cover'),
            pages: btn.getAttribute('data-pages') || '—',
            year: btn.getAttribute('data-year') || '—',
            file: btn.getAttribute('data-file-url')
        };

        // 2. Наполняем верстку
        infoModal.querySelector('#modal-name').textContent = data.title;
        infoModal.querySelector('.modal-author').textContent = data.author;
        infoModal.querySelector('#modal-description').textContent = data.desc;
        infoModal.querySelector('.book-cover-img').src = data.cover;
        const avgRating = btn.getAttribute('data-avg-rating') || "0.0";
        const downloads = btn.getAttribute('data-downloads') || "0";

        const modalRating = infoModal.querySelector('#modal-avg-rating-value');
        const modalDownloads = infoModal.querySelector('#modal-downloads-count');

        if (modalRating) modalRating.textContent = avgRating.replace('.', ',');
        if (modalDownloads) modalDownloads.textContent = `${downloads} скачиваний`;
        const metaSpans = infoModal.querySelectorAll('.modal-book-meta span');
        if (metaSpans.length >= 2) {
            metaSpans[0].textContent = `Страницы: ${data.pages}`;
            metaSpans[1].textContent = `Год издания: ${data.year}`;
        }

        // 3. ПРИВЯЗКА ЛОГИКИ КНОПОК
        const readBtn = infoModal.querySelector('.btn-read');
        if (readBtn) readBtn.onclick = () => window.location.href = `/read/${data.id}`;

        const downloadBtn = document.getElementById('modal-download-btn');
        if (downloadBtn) {
            downloadBtn.onclick = async () => {
                if (!data.file) return alert('Файл недоступен');
                const link = document.createElement('a');
                link.href = data.file;
                link.download = `${data.title}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                try {
                    const res = await fetch('/track_download', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ book_id: data.id })
                    });
                    const result = await res.json();
                    if (result.status === 'counted' && modalDownloads) {
                        modalDownloads.textContent = `${result.new_count} скачиваний`;
                    }
                } catch (err) { console.error("Ошибка трекинга:", err); }
            };
        }

        // 4. ЛОГИКА ЗАМЕТОК И СТАТУСОВ
        const statusOptions = infoModal.querySelectorAll('#optionsDropdown .dropdown-item');
        const noteTextarea = document.getElementById('book-note-text');
        const noteContainer = document.getElementById('note-container');
        const saveNoteBtn = document.getElementById('save-note-btn');
        const noteBtn = document.getElementById('modal-note-btn');

        // === ЛОГИКА ИНТЕРАКТИВНОГО РЕЙТИНГА ===
        const stars = infoModal.querySelectorAll('#interactive-rating .star-icon');
        let currentSelectedRating = 0;

        const highlightStars = (count) => {
            stars.forEach((s, idx) => {
                if (idx < count) {
                    s.classList.add('active');
                    s.style.filter = "invert(78%) sepia(54%) saturate(644%) hue-rotate(354deg) brightness(101%) contrast(101%)";
                    s.style.opacity = "1";
                } else {
                    s.classList.remove('active');
                    s.style.filter = "grayscale(100%) brightness(40%)";
                    s.style.opacity = "0.5";
                }
            });
        };

        // Загрузка данных пользователя (Статус, Заметки, Рейтинг)
        fetch(`/get_book_user_data/${data.id}`)
        .then(res => res.json())
        .then(userData => {
            // Статус
            const statusMapReverse = {
                'read': 'Прочитана',
                'reading': 'Читаю',
                'dropped': 'В отложенные',
                'wish': 'В желаемые'
            };
            const humanStatus = statusMapReverse[userData.status];
            statusOptions.forEach(opt => {
                opt.classList.remove('active-status');
                if (opt.textContent.trim() === humanStatus) opt.classList.add('active-status');
            });

            // Заметки
            if (noteTextarea) {
                noteTextarea.value = (userData.note === "Без заметки") ? "" : (userData.note || "");
            }

            // Средний рейтинг (обновление цифры)
            if (userData.avg_rating && modalRating) {
                modalRating.textContent = userData.avg_rating.toFixed(1).replace('.', ',');
            }

            // Личный рейтинг (звезды)
            currentSelectedRating = userData.user_rating || 0;
            highlightStars(currentSelectedRating);
        })
        .catch(err => console.error("Ошибка загрузки данных:", err));

        // Рейтинг: события звезд
        stars.forEach(star => {
            const val = parseInt(star.getAttribute('data-value'));
            star.onmouseenter = () => highlightStars(val);
            star.onmouseleave = () => highlightStars(currentSelectedRating);
            star.onclick = async () => {
                try {
                    const res = await fetch('/rate_book', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ book_id: data.id, rating: val })
                    });
                    const result = await res.json();
                    if (result.status === 'success') {
                        currentSelectedRating = val;
                        highlightStars(val);
                        if (modalRating) modalRating.textContent = result.new_average.toFixed(1).replace('.', ',');
                    }
                } catch (err) { console.error("Ошибка сохранения рейтинга:", err); }
            };
        });

        // Клик по статусу
        statusOptions.forEach(option => {
            option.onclick = async function(event) {
                event.preventDefault();
                const selectedStatus = this.textContent.trim();
                try {
                    const res = await fetch('/update_library_status', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ book_id: data.id, status: selectedStatus })
                    });
                    const result = await res.json();
                    if (result.status === 'removed') {
                        this.classList.remove('active-status');
                    } else {
                        statusOptions.forEach(opt => opt.classList.remove('active-status'));
                        this.classList.add('active-status');
                    }
                } catch (err) { console.error("Ошибка смены статуса:", err); }
            };
        });

        // Заметки
        if (noteBtn && noteContainer) {
            noteBtn.onclick = (e) => {
                e.stopPropagation();
                if (noteContainer.classList.contains('hidden')) {
                    noteContainer.style.right = '0';
                    noteContainer.style.top = '100%';
                    noteContainer.classList.remove('hidden');
                    document.getElementById('book-note-text').focus();
                } else {
                    noteContainer.classList.add('hidden');
                }
            };
        }

        if (saveNoteBtn) {
            saveNoteBtn.onclick = async () => {
                const text = noteTextarea.value.trim();
                try {
                    const res = await fetch('/save_book_note', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ book_id: data.id, note: text })
                    });
                    if (res.ok) {
                        noteContainer.classList.add('hidden');
                    }
                } catch (err) { console.error(err); }
            };
        }

        openModal(infoModal);
    });

    if (closeInfoBtn) closeInfoBtn.addEventListener('click', () => closeModal(infoModal));

    // === 5. ВЫПАДАЮЩЕЕ МЕНЮ ОПЦИЙ (MoreBtn) ===
    const moreBtn = document.getElementById('moreBtn');
    const dropdown = document.getElementById('optionsDropdown');
    if (moreBtn && dropdown) {
        moreBtn.onclick = (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('is-open');
        };
    }

    // === 7. ГЛОБАЛЬНЫЕ КЛИКИ ===
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) closeModal(e.target);
        if (dropdown && moreBtn && !moreBtn.contains(e.target)) dropdown.classList.remove('is-open');
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            const visibleModal = document.querySelector('.modal.is-visible');
            if (visibleModal) closeModal(visibleModal);
        }
    });

    // === 8. ЛОГИКА ПОДПИСКИ ===
    const subscribeBtn = document.querySelector('.btn-subscribe');
    const noticeBtn = document.querySelector('.btn-notice');

    if (subscribeBtn && subscribeBtn.hasAttribute('data-author-id')) {
        const authorId = subscribeBtn.getAttribute('data-author-id');

        // 1. Проверяем статус подписки при загрузке
        fetch(`/check_subscription/${authorId}`)
            .then(res => res.json())
            .then(data => {
                if (data.is_subscribed) {
                    subscribeBtn.textContent = 'Отписаться';
                    subscribeBtn.classList.add('subscribed'); // Опционально для стилей
                    if (noticeBtn) noticeBtn.style.display = 'flex';
                }
            });

        // 2. Обработка клика
        subscribeBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/toggle_subscription', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ author_id: authorId })
                });
                const result = await response.json();

                if (result.status === 'subscribed') {
                    subscribeBtn.textContent = 'Отписаться';
                    if (noticeBtn) noticeBtn.style.display = 'flex';
                    // Обновляем счетчик подписчиков в UI (опционально)
                    const followersVal = document.querySelector('.stat-item:first-child .stat-value');
                    if (followersVal) followersVal.textContent = parseInt(followersVal.textContent) + 1;
                } else if (result.status === 'unsubscribed') {
                    subscribeBtn.textContent = 'Подписаться';
                    if (noticeBtn) noticeBtn.style.display = 'none';
                    const followersVal = document.querySelector('.stat-item:first-child .stat-value');
                    if (followersVal) followersVal.textContent = Math.max(0, parseInt(followersVal.textContent) - 1);
                }
            } catch (err) {
                console.error("Ошибка подписки:", err);
            }
        });
    }
});