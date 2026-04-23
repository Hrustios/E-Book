document.addEventListener('DOMContentLoaded', () => {
    const toggleButtons = document.querySelectorAll('.js-toggle-icon');

    toggleButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const img = this.querySelector('img');
            const originalIcon = img.src;
            const activeIcon = this.getAttribute('data-active-icon');

            // Если текущая иконка — старая, меняем на новую, и наоборот
            if (activeIcon) {
                // Сохраняем текущий src, чтобы можно было переключить обратно
                img.src = activeIcon;
                this.setAttribute('data-active-icon', originalIcon);
                
                // Добавим класс для стилизации "активного" состояния (по желанию)
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
    /* --- 2. МОДАЛЬНОЕ ОКНО ПРОСМОТРА КНИГИ --- */
    /* --- МОДАЛЬНОЕ ОКНО ПРОСМОТРА КНИГИ --- */
    const infoModal = document.getElementById("book-modal");
    const closeInfoBtn = document.querySelector("#book-modal .close-modal");

    // Используем делегирование событий, чтобы работало на всех кнопках
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.open-modal-btn');
        if (!btn) return;

        e.preventDefault();

        // 1. Извлекаем данные из атрибутов кнопки
        const title = btn.getAttribute('data-title');
        const author = btn.getAttribute('data-author');
        const desc = btn.getAttribute('data-desc');
        const cover = btn.getAttribute('data-cover');
        const pages = btn.getAttribute('data-pages');
        const year = btn.getAttribute('data-year');

        // 2. Наполняем модалку данными
        infoModal.querySelector('#modal-name').textContent = title;
        infoModal.querySelector('.modal-author').textContent = author;
        infoModal.querySelector('#modal-description').textContent = desc;
        infoModal.querySelector('.book-cover-img').src = cover;

        // Находим спаны с мета-данными (страницы и год)
        const metaSpans = infoModal.querySelectorAll('.modal-book-meta span');
        if (metaSpans.length >= 2) {
            metaSpans[0].textContent = `Страницы: ${pages}`;
            metaSpans[1].textContent = `Год издания: ${year}`;
        }

        // 3. Открываем
        openModal(infoModal);
    });

    const openModal = (modal) => {
        if (!modal) return;
        modal.style.display = "block"; // Используем block, если в CSS нет .is-visible
        modal.classList.add('is-visible');
        document.body.style.overflow = "hidden";
    };

    const closeModal = (modal) => {
        if (!modal) return;
        modal.style.display = "none";
        modal.classList.remove('is-visible');
        document.body.style.overflow = "auto";
    };

    if (closeInfoBtn) {
        closeInfoBtn.addEventListener('click', () => closeModal(infoModal));
    }

    /* --- 3. ВЫПАДАЮЩЕЕ МЕНЮ (MORE OPTIONS) --- */
    const moreBtn = document.getElementById('moreBtn');
    const dropdown = document.getElementById('optionsDropdown');

    if (moreBtn && dropdown) {
        moreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('is-open');
        });
    }

    /* --- 4. ИНТЕРАКТИВНЫЙ РЕЙТИНГ (ЗВЕЗДЫ) --- */
    const stars = document.querySelectorAll('#interactive-rating .star-icon');
    
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            stars.forEach(s => s.classList.remove('active'));
            for (let i = 0; i <= index; i++) {
                stars[i].classList.add('active');
            }
        });
    });


    // --- Закрытие любых окон по клику на фон или Escape ---
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === "Escape") {
            const visibleModal = document.querySelector('.modal.is-visible');
            if (visibleModal) closeModal(visibleModal);
        }
    });

});