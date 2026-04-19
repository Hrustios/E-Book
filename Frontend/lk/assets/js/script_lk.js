document.addEventListener('DOMContentLoaded', () => {
    // === 1. ЭЛЕМЕНТЫ УПРАВЛЕНИЯ ===
    const bookGrid = document.querySelector('.profile-book-grid');
    const paginationBox = document.getElementById('pagination');

    // Модалки
    const infoModal = document.getElementById("book-modal");
    const addModal = document.getElementById('addBookModal');

    // Кнопки открытия/закрытия
    const addBtn = document.querySelector('.btn-add-book');
    const closeAddBtn = document.getElementById('closeAddBook');
    const closeInfoBtn = document.querySelector("#book-modal .close-modal");

    // Форма и её элементы
    const uploadForm = document.getElementById('uploadBookForm');
    const submitBtn = document.getElementById('submitBook');
    const formGrid = document.getElementById('addBookFormGrid');
    const mainTitle = document.getElementById('addModalTitle');
    const successMsg = document.getElementById('successMessage');

    // Элементы для предпросмотра (Preview)
    const coverInput = document.getElementById('coverInput');
    const dropzoneContent = document.getElementById('dropzoneContent');
    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileNameDisplay');

    // === 2. ЛОГИКА МОДАЛЬНЫХ ОКОН ===
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
        uploadForm.reset();
        dropzoneContent.innerHTML = '<span>Загрузить обложку</span>'; // Сброс превью
        fileNameDisplay.textContent = 'Файл не выбран';
        formGrid.style.display = 'grid';
        mainTitle.style.display = 'block';
        successMsg.style.display = 'none';
        openModal(addModal);
    });

    if (closeAddBtn) closeAddBtn.addEventListener('click', () => closeModal(addModal));
    if (closeInfoBtn) closeInfoBtn.addEventListener('click', () => closeModal(infoModal));

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) closeModal(e.target);
    });

    // === 3. ПРЕДПРОСМОТР ПРИ ВЫБОРЕ ФАЙЛОВ ===

    // Превью обложки
    if (coverInput) {
        coverInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    dropzoneContent.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:15px;">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Отображение имени PDF файла
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files[0]) {
                fileNameDisplay.textContent = `Выбрано: ${this.files[0].name}`;
                fileNameDisplay.style.color = "#27ae60";
            }
        });
    }

    // === 4. ОТКРЫТИЕ КНИГИ И СКАЧИВАНИЕ ===
    window.openFullBookModal = function(element) {
        const card = element.closest('.profile-book-card');
        if (!card) return;

        const title = card.querySelector('h3').textContent;
        const fileUrl = card.getAttribute('data-file'); // Ссылка из Python (private_download_url)

        // Заполняем данные в модалке
        document.getElementById("modal-name").textContent = title;
        document.getElementById("modal-description").textContent = card.querySelector('.p-desc').textContent;
        infoModal.querySelector(".modal-author").textContent = card.querySelector('.p-author').textContent;
        infoModal.querySelector(".book-cover-img").src = card.querySelector('.book-cover-img').src;
        infoModal.querySelector(".tag").textContent = card.getAttribute('data-genre') || "Книга";

        const downloadBtn = document.getElementById('btn-download');
        if (downloadBtn) {
            downloadBtn.onclick = (e) => {
                e.preventDefault();
                if (fileUrl && fileUrl !== "None") {
                    console.log("Скачивание:", fileUrl);
                    window.location.href = fileUrl; // Переход по подписанной ссылке
                } else {
                    alert("Файл не найден. Загрузите книгу заново.");
                }
            };
        }
        openModal(infoModal);
    };

    // === 5. ОТПРАВКА ФОРМЫ (ЗАГРУЗКА НА СЕРВЕР) ===
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            submitBtn.textContent = "Считаем страницы и загружаем...";
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
                    // Обновляем список книг через 1.5 секунды
                    setTimeout(() => {
                        closeModal(addModal);
                        fetchMyBooks(1);
                    }, 1500);
                } else {
                    return res.text().then(text => { throw new Error(text) });
                }
            })
            .catch(err => {
                alert("Ошибка при загрузке. Проверьте форматы файлов.");
                console.error(err);
                submitBtn.textContent = "Добавить книгу";
                submitBtn.disabled = false;
            });
        });
    }

    // === 6. ОТОБРАЖЕНИЕ СПИСКА КНИГ ===
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
        bookGrid.innerHTML = books.length ? '' : '<p style="grid-column: 1/-1; text-align:center;">Библиотека пуста</p>';

        books.forEach(book => {
            const card = `
                <div class="profile-book-card" 
                     data-pages="${book.pages}" 
                     data-year="${book.release_year}" 
                     data-genre="${book.genre}"
                     data-file="${book.file_url}">
                    <div class="book-visual">
                        <div class="css-book-shape">
                            <img src="${book.cover_url}" class="book-cover-img" alt="Обложка">
                        </div>
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
            btn.onclick = () => {
                fetchMyBooks(i);
                window.scrollTo({top: 0, behavior: 'smooth'});
            };
            paginationBox.appendChild(btn);
        }
    }

    // Стартовый запуск
    fetchMyBooks(1);
});