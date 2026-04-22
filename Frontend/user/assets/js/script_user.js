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

    // === 1. КАСТОМНЫЙ СЕЛЕКТ (Фильтры) ===
    const wrapper = document.querySelector('.custom-select-wrapper');
    const select = document.querySelector('.custom-select');
    const trigger = document.querySelector('.custom-select__trigger');
    const options = document.querySelectorAll(".custom-option");

    if (wrapper && select) {
        wrapper.addEventListener('click', (e) => {
            select.classList.toggle('open');
            e.stopPropagation();
        });

        options.forEach(option => {
            option.addEventListener('click', function() {
                if (!this.classList.contains('selected')) {
                    const selectedOption = select.querySelector('.custom-option.selected');
                    if (selectedOption) selectedOption.classList.remove('selected');
                    this.classList.add('selected');
                    trigger.querySelector('span').textContent = this.textContent;
                }
            });
        });
    }

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