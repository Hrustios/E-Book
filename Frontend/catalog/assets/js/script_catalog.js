document.addEventListener('DOMContentLoaded', () => {
    /* --- 1. КАСТОМНЫЙ СЕЛЕКТ (ЖАНРЫ) --- */
    const selectWrapper = document.querySelector('.custom-select-wrapper');
    const select = document.querySelector('.custom-select');
    const trigger = document.querySelector('.custom-select__trigger');
    const options = document.querySelectorAll('.custom-option');
    const customInput = document.getElementById('custom-genre-input');

    if (trigger && select) {
        // Открытие/закрытие списка
        trigger.addEventListener('click', (e) => {
            select.classList.toggle('open');
            e.stopPropagation();
        });

        // Выбор опции
        options.forEach(option => {
            option.addEventListener('click', function () {
                const val = this.getAttribute('data-value');
                const currentSelected = select.querySelector('.custom-option.selected');
                
                if (currentSelected) currentSelected.classList.remove('selected');
                this.classList.add('selected');

                const triggerSpan = trigger.querySelector('span');
                if (triggerSpan) triggerSpan.textContent = this.textContent;
                
                select.classList.remove('open');

                // Логика для поля "Другое"
                if (customInput) {
                    if (val === 'other') {
                        customInput.classList.remove('hidden');
                        customInput.focus();
                    } else {
                        customInput.classList.add('hidden');
                        customInput.value = '';
                    }
                }
            });
        });
    }

    /* --- 2. МОДАЛЬНОЕ ОКНО ПРОСМОТРА КНИГИ --- */
    const infoModal = document.getElementById("book-modal");
    const readMoreButtons = document.querySelectorAll(".catalog-main-btn");
    const closeInfoBtn = document.querySelector("#book-modal .close-modal");

    const openModal = (modal) => {
        if (!modal) return;
        modal.classList.add('is-visible');
        document.body.style.overflow = "hidden";
    };

    const closeModal = (modal) => {
        if (!modal) return;
        modal.classList.remove('is-visible');
        document.body.style.overflow = "auto";
    };

    readMoreButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(infoModal);
        });
    });

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

    /* --- 5. ГЛОБАЛЬНЫЕ КЛИКИ (ЗАКРЫТИЕ ВСЕГО) --- */
    window.addEventListener('click', (e) => {
        // Закрытие селекта при клике вне
        if (select && selectWrapper && !selectWrapper.contains(e.target)) {
            select.classList.remove('open');
        }

        // Закрытие модалки при клике на оверлей (фон)
        if (e.target === infoModal) {
            closeModal(infoModal);
        }

        // Закрытие выпадающего меню
        if (moreBtn && dropdown && !moreBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('is-open');
        }
    });
});