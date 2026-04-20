document.addEventListener('DOMContentLoaded', () => {

    // === 1. КАСТОМНЫЙ СЕЛЕКТ ===
    const selectWrapper = document.querySelector('.custom-select-wrapper');
    const select = document.querySelector('.custom-select');
    const trigger = document.querySelector('.custom-select__trigger');
    const options = document.querySelectorAll('.custom-option');
    const customInput = document.getElementById('custom-genre-input');

    if (selectWrapper && trigger) {
        // Открытие/закрытие
        trigger.addEventListener('click', (e) => {
            select.classList.toggle('open');
            e.stopPropagation();
        });

        // Выбор опции
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

    // === 4. ОБРАБОТКА ПОИСКА И ФИЛЬТРАЦИИ (Исправлено) ===
    const searchInput = document.querySelector('.search-bar input');
    const searchBtn = document.querySelector('.search-btn');
    const yearInput = document.getElementById('filter-year');
    const authorInput = document.getElementById('filter-author');

    if (searchBtn) {
        const handleSearch = () => {
            const query = searchInput ? searchInput.value.trim() : '';
            const year = yearInput ? yearInput.value.trim() : '';
            const author = authorInput ? authorInput.value.trim() : '';

            const selectedOption = select.querySelector('.custom-option.selected');
            let genre = selectedOption ? selectedOption.getAttribute('data-value') : '';

            if (genre === 'other') {
                const manualGenre = customInput.value.trim();
                if (manualGenre !== '') {
                    genre = manualGenre;
                }
            }

            const url = new URL(window.location.origin + window.location.pathname);

            // ОБЯЗАТЕЛЬНО добавляем все параметры в URL:
            if (query) url.searchParams.set('search', query);
            if (genre) url.searchParams.set('genre', genre);
            if (year) url.searchParams.set('year', year);   // Было пропущено!
            if (author) url.searchParams.set('author', author); // Было пропущено!

            url.searchParams.set('page', 1);

            window.location.href = url.href;
        };

        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleSearch();
        });

        // Поиск по нажатию Enter в любом из полей
        [searchInput, yearInput, authorInput, customInput].forEach(el => {
            if (el) {
                el.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') handleSearch();
                });
            }
        });
    }
});