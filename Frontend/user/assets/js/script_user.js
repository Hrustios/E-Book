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

    // === 3. ОБЩАЯ ЛОГИКА МОДАЛЬНЫХ ОКОН ===
    const openModal = (modal) => {
        modal.classList.add("is-visible");
        document.body.style.overflow = "hidden";
        document.body.style.paddingRight = "15px"; 
    };

    const closeModal = (modal) => {
        modal.classList.remove("is-visible");
        setTimeout(() => {
            document.body.style.overflow = "auto";
            document.body.style.paddingRight = "0";
        }, 400);
    };

    // --- Окно просмотра книги ---
    const infoModal = document.getElementById("book-modal");
    const readMoreButtons = document.querySelectorAll(".btn-read-more");
    const closeInfoBtn = document.querySelector("#book-modal .close-modal");

    readMoreButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(infoModal);
        });
    });

    if (closeInfoBtn) {
        closeInfoBtn.addEventListener('click', () => closeModal(infoModal));
    }

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