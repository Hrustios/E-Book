document.addEventListener('DOMContentLoaded', () => {
    // Основные элементы интерфейса
    const bookGrid = document.querySelector('.profile-book-grid');
    const paginationBox = document.getElementById('pagination');
    const infoModal = document.getElementById("book-modal");
    const addModal = document.getElementById('addBookModal');

    // Кнопки и формы
    const addBtn = document.querySelector('.btn-add-book');
    const closeAddBtn = document.getElementById('closeAddBook');
    const closeInfoBtn = document.querySelector("#book-modal .close-modal");
    const uploadForm = document.getElementById('uploadBookForm');
    const submitBtn = document.getElementById('submitBook');

    // Элементы формы добавления
    const formGrid = document.getElementById('addBookFormGrid');
    const mainTitle = document.getElementById('addModalTitle');
    const successMsg = document.getElementById('successMessage');
    const coverInput = document.getElementById('coverInput');
    const dropzoneContent = document.getElementById('dropzoneContent');
    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileNameDisplay');

    // --- УПРАВЛЕНИЕ МОДАЛЬНЫМИ ОКНАМИ ---

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

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) closeModal(e.target);
    });

    if (closeAddBtn) closeAddBtn.addEventListener('click', () => closeModal(addModal));
    if (closeInfoBtn) closeInfoBtn.addEventListener('click', () => closeModal(infoModal));

    // --- ЛОГИКА ВАЛИДАЦИИ И ОШИБОК ---

    const clearErrors = () => {
        document.querySelectorAll('.error-text').forEach(el => {
            el.textContent = '';
            el.classList.remove('is-visible');
        });
        document.querySelectorAll('.form-input, .form-textarea, .file-upload-design, .cover-dropzone').forEach(el => {
            el.classList.remove('invalid');
        });
    };

    const showError = (id, msg) => {
        const errEl = document.getElementById(`err-${id}`);
        let inputEl = document.getElementById(id);

        // Для файлов подсвечиваем их визуальные оболочки
        if (id === 'fileInput') inputEl = document.getElementById('fileNameDisplay');
        if (id === 'coverInput') inputEl = document.getElementById('coverDropzone');

        if (errEl) {
            errEl.textContent = msg;
            errEl.classList.add('is-visible');
        }
        if (inputEl) inputEl.classList.add('invalid');
    };

    // "Живое" снятие ошибок при вводе
    const inputs = document.querySelectorAll('.form-input, .form-textarea');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('invalid');
            const err = document.getElementById(`err-${input.id}`);
            if (err) err.classList.remove('is-visible');
        });
    });

    function validateForm() {
        let isValid = true;
        clearErrors();

        const title = document.getElementById('book-title');
        const author = document.getElementById('book-author');
        const year = document.getElementById('book-year');
        const genre = document.getElementById('book-genre');
        const desc = document.getElementById('book-description');

        if (!coverInput.files[0]) { showError('coverInput', 'Выберите обложку'); isValid = false; }
        if (!title.value.trim()) { showError('book-title', 'Введите название'); isValid = false; }
        if (!author.value.trim()) { showError('book-author', 'Укажите автора'); isValid = false; }
        if (!year.value) { showError('book-year', 'Укажите год'); isValid = false; }
        if (!genre.value.trim()) { showError('book-genre', 'Укажите жанр'); isValid = false; }
        if (!fileInput.files[0]) { showError('fileInput', 'Выберите файл'); isValid = false; }
        if (!desc.value.trim()) { showError('book-description', 'Добавьте описание'); isValid = false; }

        return isValid;
    }

    // --- ОБРАБОТКА ФАЙЛОВ ---

    if (addBtn) addBtn.addEventListener('click', () => {
        uploadForm.reset();
        clearErrors();
        dropzoneContent.innerHTML = `
            <img src="/static/lk/images/place.svg" class="placeholder-icon" alt="">
            <p>Загрузить обложку книги</p>
        `;
        fileNameDisplay.textContent = 'Добавить файл книги';
        fileNameDisplay.style.color = "";
        formGrid.style.display = 'grid';
        mainTitle.style.display = 'block';
        successMsg.style.display = 'none';
        openModal(addModal);
    });

    if (coverInput) {
    coverInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                // ПРАВКА ТУТ:
                // Мы не заменяем innerHTML, а добавляем класс родителю и вставляем <img>
                dropzoneContent.classList.add('has-image');

                // Удаляем старую картинку, если она была, и добавляем новую
                const existingImg = dropzoneContent.querySelector('.uploaded-cover');
                if (existingImg) existingImg.remove();

                dropzoneContent.insertAdjacentHTML('beforeend', `
                    <img src="${e.target.result}" class="uploaded-cover" alt="Обложка">
                `);
            };
            reader.readAsDataURL(file);
            document.getElementById('coverDropzone').classList.remove('invalid');
            document.getElementById('err-coverInput').classList.remove('is-visible');
        }
    });
}

    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files[0]) {
                fileNameDisplay.textContent = `Выбрано: ${this.files[0].name}`;
                fileNameDisplay.style.color = "#27ae60";
                fileNameDisplay.classList.remove('invalid');
                document.getElementById('err-fileInput').classList.remove('is-visible');
            }
        });
    }

    // --- ОТКРЫТИЕ КНИГИ И СКАЧИВАНИЕ ---

    window.openFullBookModal = function(element) {
        const card = element.closest('.profile-book-card');
        if (!card) return;

        const title = card.querySelector('h3').textContent;
        const fileUrl = card.getAttribute('data-file');
        const pages = card.getAttribute('data-pages') || "—";
        const year = card.getAttribute('data-year') || "----";

        document.getElementById("modal-name").textContent = title;
        document.getElementById("modal-description").textContent = card.querySelector('.p-desc').textContent;

        const modalPagesElem = document.getElementById("modal-pages");
        const modalYearElem = document.getElementById("modal-year");
        if (modalPagesElem) modalPagesElem.textContent = pages;
        if (modalYearElem) modalYearElem.textContent = year;

        infoModal.querySelector(".modal-author").textContent = card.querySelector('.p-author').textContent;
        infoModal.querySelector(".book-cover-img").src = card.querySelector('.book-cover-img').src;
        infoModal.querySelector(".tag").textContent = card.getAttribute('data-genre') || "Книга";

        const downloadBtn = document.getElementById('btn-download');
        if (downloadBtn) {
            downloadBtn.onclick = async (e) => {
                e.preventDefault();
                const originalContent = downloadBtn.innerHTML;
                downloadBtn.innerHTML = "<span style='font-size:10px;'>...</span>";
                try {
                    const response = await fetch(fileUrl);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = title.replace(/[/\\?%*:|"<>]/g, '-') + ".pdf";
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } catch (err) {
                    window.open(fileUrl, '_blank');
                } finally {
                    downloadBtn.innerHTML = originalContent;
                }
            };
        }
        openModal(infoModal);
    };

    // --- ОТПРАВКА ФОРМЫ НА СЕРВЕР ---

    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();

            if (!validateForm()) return;

            const formData = new FormData(this);
            submitBtn.textContent = "Загрузка...";
            submitBtn.disabled = true;

            fetch('/add_book', {
                method: 'POST',
                body: formData
            })
            .then(res => {
                if (res.ok) {
                    formGrid.style.display = 'none';
                    mainTitle.style.display = 'none';
                    successMsg.style.display = 'flex';
                    // Перезагрузка списка не нужна, если пользователь нажмет "Закрыть" (reload там)
                } else {
                    throw new Error("Ошибка сервера");
                }
            })
            .catch(err => {
                alert("Произошла ошибка при загрузке книги.");
                submitBtn.textContent = "Добавить книгу";
                submitBtn.disabled = false;
            });
        });
    }

    // --- РАБОТА С БАЗОЙ (ОТРИСОВКА) ---

    function fetchMyBooks(page = 1) {
        fetch(`/get_my_books?page=${page}`).then(res => res.json()).then(data => {
            renderBooks(data.books);
            renderPagination(data.total_pages, data.current_page);
        });
    }

    function renderBooks(books) {
        if (!bookGrid) return;
        bookGrid.innerHTML = books.length ? '' : '<p style="grid-column: 1/-1; text-align:center; opacity:0.5;">У вас пока нет добавленных книг</p>';
        books.forEach(book => {
            const card = `
                <div class="profile-book-card" data-pages="${book.pages}" data-year="${book.release_year}" data-genre="${book.genre}" data-file="${book.file_url}">
                    <div class="book-visual">
                        <div class="css-book-shape"><img src="${book.cover_url}" class="book-cover-img"></div>
                    </div>
                    <div class="p-book-info">
                        <h3>${book.title}</h3>
                        <p class="p-author">${book.author_name}</p>
                        <p class="p-desc">${book.description}</p>
                        <a href="#" class="btn-read-more" onclick="openFullBookModal(this); return false;">Подробнее</a>
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
            btn.onclick = () => fetchMyBooks(i);
            paginationBox.appendChild(btn);
        }
    }

    // Инициализация
    fetchMyBooks(1);
});