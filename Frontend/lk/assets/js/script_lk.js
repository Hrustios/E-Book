document.addEventListener('DOMContentLoaded', () => {
    // === 1. ЭЛЕМЕНТЫ И ПЕРЕМЕННЫЕ ===
    const bookGrid = document.querySelector('.profile-book-grid');
    const paginationBox = document.getElementById('pagination');
    const infoModal = document.getElementById("book-modal");
    const addModal = document.getElementById('addBookModal');
    const addBtn = document.querySelector('.btn-add-book');
    const closeAddBtn = document.getElementById('closeAddBook');
    const closeInfoBtn = document.querySelector("#book-modal .close-modal");
    const wrapper = document.querySelector('.custom-select-wrapper');
    const select = document.querySelector('.custom-select');
    const trigger = document.querySelector('.custom-select__trigger');
    const options = document.querySelectorAll(".custom-option");
    const uploadForm = document.getElementById('uploadBookForm');
    const submitBtn = document.getElementById('submitBook');
    const formGrid = document.getElementById('addBookFormGrid');
    const mainTitle = document.getElementById('addModalTitle');
    const successMsg = document.getElementById('successMessage');

    const currentYearLimit = 2026;

    // === 2. ОБЩАЯ ЛОГИКА МОДАЛЬНЫХ ОКОН ===
    const openModal = (modal) => {
        if (!modal) return;
        modal.classList.add("is-visible");
        document.body.style.overflow = "hidden";
    };

    const closeModal = (modal) => {
        if (!modal) return;
        modal.classList.remove("is-visible");
        setTimeout(() => {
            if (!document.querySelector('.modal.is-visible')) {
                document.body.style.overflow = "";
            }
        }, 400);
    };

    if (addBtn) addBtn.addEventListener('click', () => {
        // Сброс формы при открытии
        uploadForm.reset();
        formGrid.style.display = 'grid';
        mainTitle.style.display = 'block';
        successMsg.style.display = 'none';
        document.querySelectorAll('.error-message').forEach(e => e.style.display = 'none');
        document.querySelectorAll('.form-input').forEach(e => e.classList.remove('input-error'));
        openModal(addModal);
    });

    if (closeAddBtn) closeAddBtn.addEventListener('click', () => closeModal(addModal));
    if (closeInfoBtn) closeInfoBtn.addEventListener('click', () => closeModal(infoModal));

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) closeModal(e.target);
    });

    // === 3. ОТКРЫТИЕ КНИГИ (ДАННЫЕ) ===
    window.openFullBookModal = function(element) {
        const card = element.closest('.profile-book-card');
        if (!card) return;

        const data = {
            title: card.querySelector('h3').textContent,
            author: card.querySelector('.p-author').textContent,
            desc: card.querySelector('.p-desc').textContent,
            cover: card.querySelector('.book-cover-img').src,
            year: card.getAttribute('data-year') || "---",
            pages: card.getAttribute('data-pages') || "---",
            genre: card.getAttribute('data-genre') || "Жанр"
        };

        const modalTitle = document.getElementById("modal-name");
        const modalAuthor = infoModal.querySelector(".modal-author");
        const modalDesc = document.getElementById("modal-description");
        const modalCover = infoModal.querySelector(".modal-book-view .book-cover-img");
        const modalGenreTag = infoModal.querySelector(".tag");
        const modalMeta = infoModal.querySelector(".modal-book-meta");

        modalTitle.textContent = data.title;
        modalAuthor.textContent = data.author;
        modalDesc.textContent = data.desc;
        modalCover.src = data.cover;
        modalGenreTag.textContent = data.genre;
        modalMeta.innerHTML = `<span>Страницы: ${data.pages}</span><span>Год издания: ${data.year}</span>`;

        openModal(infoModal);
    };

    // === 4. ВАЛИДАЦИЯ И ОТПРАВКА ===
    const showError = (inputId, message) => {
        const input = document.getElementById(inputId) || document.getElementsByName(inputId)[0];
        const errorSpan = input.closest('.form-group')?.querySelector('.error-message') ||
                          input.nextElementSibling;

        if (input) input.classList.add('input-error');
        if (errorSpan) {
            errorSpan.textContent = message;
            errorSpan.style.display = 'block';
        }
    };

    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Сброс ошибок
            document.querySelectorAll('.error-message').forEach(e => e.style.display = 'none');
            document.querySelectorAll('.form-input, .form-textarea').forEach(e => e.classList.remove('input-error'));

            let isValid = true;
            const formData = new FormData(this);

            // Проверка текстовых полей
            const check = (name, msg) => {
                if (!formData.get(name).trim()) {
                    showError(name === 'author' ? 'book-author' : `book-${name}`, msg);
                    isValid = false;
                }
            };

            check('title', 'Введите название');
            check('author', 'Укажите автора');
            check('genre', 'Выберите жанр');
            check('description', 'Добавьте описание');

            // Проверка года
            const yearVal = formData.get('year');
            if (!yearVal) {
                showError('book-year', 'Укажите год');
                isValid = false;
            } else if (parseInt(yearVal) > currentYearLimit) {
                showError('book-year', `Максимум ${currentYearLimit} год`);
                isValid = false;
            }

            // Проверка файлов
            if (!document.getElementById('fileInput').files.length) {
                showError('fileInput', 'Выберите файл книги');
                isValid = false;
            }
            if (!document.getElementById('coverInput').files.length) {
                const errCover = document.getElementById('error-cover');
                if (errCover) { errCover.textContent = "Нужна обложка"; errCover.style.display = "block"; }
                isValid = false;
            }

            if (isValid) {
                submitBtn.textContent = "Считаем страницы и загружаем...";
                submitBtn.disabled = true;

                fetch('/add_book', { method: 'POST', body: formData })
                    .then(res => {
                        if (res.ok) {
                            formGrid.style.display = 'none';
                            mainTitle.style.display = 'none';
                            successMsg.style.display = 'flex';
                        } else { throw new Error(); }
                    })
                    .catch(() => {
                        alert("Ошибка при загрузке. Проверьте соединение.");
                        submitBtn.textContent = "Добавить книгу";
                        submitBtn.disabled = false;
                    });
            }
        });
    }

    // === 5. ПРЕВЬЮ И СЕЛЕКТ ===
    const coverInput = document.getElementById('coverInput');
    const dropzoneContent = document.getElementById('dropzoneContent');
    if (coverInput) {
        coverInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    dropzoneContent.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:28px;">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            fileNameDisplay.textContent = this.files[0] ? this.files[0].name : "Добавить файл книги";
            fileNameDisplay.style.color = "#27ae60";
        });
    }

    // Логика фильтров (селект)
    if (wrapper && select) {
        wrapper.addEventListener('click', (e) => { select.classList.toggle('open'); e.stopPropagation(); });
        options.forEach(opt => {
            opt.addEventListener('click', function() {
                options.forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                trigger.querySelector('span').textContent = this.textContent;
                if (this.getAttribute('data-value') === 'my-books') fetchMyBooks(1);
            });
        });
    }

    // === 6. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
    function fetchMyBooks(page = 1) {
        fetch(`/get_my_books?page=${page}`)
            .then(res => res.json())
            .then(data => {
                renderBooks(data.books);
                renderPagination(data.total_pages, data.current_page);
            });
    }

    function renderBooks(books) {
        if (!bookGrid) return;
        bookGrid.innerHTML = books.length ? '' : '<p>У вас пока нет загруженных книг</p>';
        books.forEach(book => {
            const card = `
                <div class="profile-book-card" data-pages="${book.pages}" data-year="${book.release_year}" data-genre="${book.genre}">
                    <div class="book-visual"><div class="css-book-shape">
                        <img src="${book.cover_url}" class="book-cover-img">
                    </div></div>
                    <div class="p-book-info">
                        <h3>${book.title}</h3>
                        <p class="p-author">${book.author_name}</p>
                        <p class="p-desc">${book.description}</p>
                        <a href="#" class="btn-read-more" onclick="openFullBookModal(this); return false;">Читать больше</a>
                    </div>
                </div>`;
            bookGrid.insertAdjacentHTML('beforeend', card);
        });
    }

    function renderPagination(total, current) {
        if (!paginationBox) return;
        paginationBox.innerHTML = '';
        if (total <= 1) return;
        for (let i = 1; i <= total; i++) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === current ? 'active' : ''}`;
            btn.textContent = i;
            btn.onclick = () => { fetchMyBooks(i); window.scrollTo({top: 0, behavior: 'smooth'}); };
            paginationBox.appendChild(btn);
        }
    }

    // Кнопка наверх
    const btnUp = document.querySelector('.btn-up');
    window.addEventListener('scroll', () => {
        btnUp.style.visibility = window.scrollY > 300 ? 'visible' : 'hidden';
        btnUp.style.opacity = window.scrollY > 300 ? '1' : '0';
    });
});