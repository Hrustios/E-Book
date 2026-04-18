document.addEventListener('DOMContentLoaded', () => {
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

    // --- Окно добавления книги ---
    const addModal = document.getElementById('addBookModal');
    const addBtn = document.querySelector('.btn-add-book');
    const closeAddBtn = document.getElementById('closeAddBook');

    if (addBtn && addModal) {
        addBtn.addEventListener('click', () => openModal(addModal));
        closeAddBtn.addEventListener('click', () => closeModal(addModal));
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

    // === 4. ВНУТРЕННЯЯ ЛОГИКА ФОРМЫ ДОБАВЛЕНИЯ ===
    const coverInput = document.getElementById('coverInput');
    const dropzoneContent = document.getElementById('dropzoneContent');
    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileNameDisplay');

    // Превью обложки
    if (coverInput) {
        coverInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    dropzoneContent.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:28px;">`;
                    document.querySelector('.cover-dropzone').style.border = 'none';
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // Отображение имени файла книги
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const fileName = this.files[0] ? this.files[0].name : "Добавить файл книги";
            fileNameDisplay.textContent = fileName;
            fileNameDisplay.style.color = "#84592B"; // Делаем акцент, что файл выбран
        });
    }

    // === 5. ВЫПАДАЮЩЕЕ МЕНЮ (Троеточие) ===
    const moreBtn = document.getElementById('moreBtn');
    const dropdown = document.getElementById('optionsDropdown');

    if (moreBtn && dropdown) {
        moreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('is-open');
        });

        window.addEventListener('click', (e) => {
            if (!moreBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('is-open');
            }
        });
    }

    // === 6. ИНТЕРАКТИВНЫЙ РЕЙТИНГ (Звезды) ===
    const stars = document.querySelectorAll('#interactive-rating .star-icon');
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            stars.forEach(s => s.classList.remove('active'));
            for (let i = 0; i <= index; i++) {
                stars[i].classList.add('active');
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // 1. Элементы модального окна
    const addBtn = document.querySelector('.btn-add-book'); // Кнопка в профиле
    const addModal = document.getElementById('addBookModal');
    const closeAddBtn = document.getElementById('closeAddBook');

    // 2. Элементы формы внутри модалки
    const submitBtn = document.getElementById('submitBook');
    const formGrid = document.getElementById('addBookFormGrid');
    const mainTitle = document.getElementById('addModalTitle');
    const successMsg = document.getElementById('successMessage');
    const closeSuccessBtn = document.getElementById('closeSuccess');

    // Открытие модального окна
    if (addBtn && addModal) {
        addBtn.addEventListener('click', () => {
            addModal.classList.add('is-visible');
        });
    }

    // Закрытие модального окна
    if (closeAddBtn) {
        closeAddBtn.addEventListener('click', () => {
            addModal.classList.remove('is-visible');
        });
    }

    // ЛОГИКА ОТПРАВКИ (РЕАЛЬНАЯ)
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // 1. Находим форму
            const form = document.getElementById('uploadBookForm');
            if (!form) {
                console.error("Форма не найдена! Проверь id='uploadBookForm' в HTML");
                return;
            }

            // 2. Собираем данные (включая файлы)
            const formData = new FormData(form);

            // Визуальный эффект загрузки
            this.textContent = "Загрузка в облако...";
            this.style.opacity = "0.7";
            this.disabled = true;

            // 3. Отправляем на сервер
            fetch('/add_book', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.ok) {
                    // Скрываем форму и заголовок
                    if (formGrid) formGrid.style.setProperty('display', 'none', 'important');
                    if (mainTitle) mainTitle.style.setProperty('display', 'none', 'important');

                    // Показываем сообщение об успехе
                    if (successMsg) {
                        successMsg.style.display = 'flex';
                        console.log("Книга успешно загружена и сохранена!");
                    }
                } else {
                    throw new Error('Ошибка сервера');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                alert("Не удалось загрузить книгу. Проверь файлы и подключение.");
                this.textContent = "Попробовать снова";
                this.style.opacity = "1";
                this.disabled = false;
            });
        });
    }

    // Кнопка "Отлично" в окне успеха
    if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener('click', () => {
        const addModal = document.getElementById('addBookModal');
        addModal.classList.remove('is-visible');
        
        // ВОТ ЭТА СТРОЧКА: Возвращаем прокрутку сайту
        document.body.style.overflow = ''; 

        // Возвращаем форму в исходное состояние через 500мс
        setTimeout(() => {
            if (formGrid) formGrid.style.display = 'grid';
            if (mainTitle) mainTitle.style.display = 'block';
            if (successMsg) successMsg.style.display = 'none';
            submitBtn.textContent = "Опубликовать";
            submitBtn.style.opacity = "1";
            submitBtn.disabled = false;
        }, 500);
    });
}

// При открытии ЛЮБОГО модального окна
function openModal(modal) {
    modal.classList.add('is-visible');
    document.body.classList.add('modal-open');
}

// При закрытии окна (в том числе через кнопку "Отлично")
function closeModal(modal) {
    modal.classList.remove('is-visible');
    
    // Проверяем, нет ли других открытых модалок перед тем как вернуть скролл
    if (!document.querySelector('.modal.is-visible')) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = ''; // Сброс инлайнового стиля
    }
}

// ПРИМЕР для вашей кнопки "Отлично":
if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener('click', () => {
        const addModal = document.getElementById('addBookModal');
        addModal.classList.remove('is-visible');
        
        // 1. Возвращаем стандартную прокрутку
        document.body.style.overflow = ''; 
        
        // 2. УДАЛЯЕМ ЗАЗОР: сбрасываем padding, который мог добавить браузер или скрипт
        document.body.style.paddingRight = '0px';

        // Возвращаем форму в исходное состояние для следующего раза
        setTimeout(() => {
            if (formGrid) formGrid.style.display = 'grid';
            if (mainTitle) mainTitle.style.display = 'block';
            if (successMsg) successMsg.style.display = 'none';
            submitBtn.textContent = "Опубликовать";
            submitBtn.style.opacity = "1";
            submitBtn.disabled = false;
        }, 500);
    });
}
});