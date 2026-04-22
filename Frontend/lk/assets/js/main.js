import { openFullBookModal, renderBooks, renderPagination, initSearch } from './books_ui.js';
import { validateForm, clearErrors, initValidationListeners } from './validation.js';

document.addEventListener('DOMContentLoaded', () => {
    const bookGrid = document.querySelector('.profile-book-grid');
    const paginationContainer = document.getElementById('pagination');
    let currentPage = 1, currentFilter = 'all';
    const editForm = document.getElementById('editBookForm');
    const editModal = document.getElementById('editBookModal');
    const btnUp = document.querySelector('.btn-up');

        if (btnUp) {
            // Показываем/скрываем кнопку при скролле
            window.addEventListener('scroll', () => {
                if (window.scrollY > 400) {
                    btnUp.style.opacity = '1';
                    btnUp.style.visibility = 'visible';
                } else {
                    btnUp.style.opacity = '0';
                    btnUp.style.visibility = 'hidden';
                }
            });

            // Плавный скролл при клике
            btnUp.addEventListener('click', (e) => {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    if (editForm) {
        editForm.onsubmit = async (e) => {
            e.preventDefault();

            const btn = document.getElementById('submitEditBook');
            const originalText = btn.textContent;

            // Собираем данные
            const formData = new FormData(editForm);
            const bookId = formData.get('book_id');

            btn.disabled = true;
            btn.textContent = "Сохранение...";

            try {
                const res = await fetch(`/update_book/${bookId}`, {
                    method: 'POST',
                    body: formData // Или JSON.stringify, если на сервере только текст
                });

                if (res.ok) {
                    window.showToast("Изменения сохранены!");
                    editModal.style.display = 'none';
                    document.body.style.overflow = '';

                    // Перезагружаем данные в сетке, чтобы увидеть изменения
                    if (typeof loadData === 'function') {
                        loadData(currentPage, currentFilter);
                    }
                } else {
                    const error = await res.text();
                    window.showToast("Ошибка: " + error);
                }
            } catch (err) {
                console.error(err);
                window.showToast("Ошибка соединения с сервером");
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        };
    }

    // Закрытие модалки редактирования
    const closeEdit = document.getElementById('closeEditBook');
    if (closeEdit) {
        closeEdit.onclick = () => {
            editModal.style.display = 'none';
            document.body.style.overflow = '';
        };
    }
    // Делаем функции глобальными для доступа из HTML/других модулей
    window.openFullBookModal = openFullBookModal;

    // --- СИСТЕМА УВЕДОМЛЕНИЙ (ЕДИНАЯ) ---
    window.showToast = function(message) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:10000; display:flex; flex-direction:column; align-items:flex-end; pointer-events:none;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.style.cssText = `
            background-color: #442D1C;
            color: #F4EFE6;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-size: 14px;
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateX(20px);
            font-family: sans-serif;
            pointer-events: auto;
        `;

        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // Включаем "живое" скрытие ошибок при вводе
    initValidationListeners();

    // --- 1. ЗАГРУЗКА ДАННЫХ ---
    async function loadData(page = 1, filter = 'all') {
        try {
            const res = await fetch(`/get_my_books?page=${page}&filter=${filter}`);
            const data = await res.json();
            renderBooks(data.books, bookGrid);
            renderPagination(data.total_pages, data.current_page, paginationContainer, (p) => {
                currentPage = p; loadData(currentPage, currentFilter);
            });
        } catch (err) { console.error("Ошибка загрузки книг:", err); }
    }
    loadData();

    // --- 2. ОБРАБОТКА ФАЙЛОВ ---
    const fileInp = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const coverInp = document.getElementById('coverInput');

    if (fileInp) {
        fileInp.addEventListener('change', function() {
            if (this.files.length > 0) {
                fileNameDisplay.textContent = this.files[0].name;
                fileNameDisplay.style.color = "#442D1C";
                fileNameDisplay.classList.remove('invalid'); // Убираем красную рамку
            }
        });
    }

    if (coverInp) {
        coverInp.addEventListener('change', function() {
            if (this.files.length > 0) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dz = document.getElementById('dropzoneContent');
                    if (dz) {
                        dz.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:28px;">`;
                        document.getElementById('coverDropzone')?.classList.remove('invalid');
                    }
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    // Сохранение заметки
    const saveNoteBtn = document.getElementById('save-note-btn');
    if (saveNoteBtn) {
        saveNoteBtn.onclick = async () => {
            const modal = document.getElementById('book-modal');
            const bookId = modal.getAttribute('data-current-id');
            const noteText = document.getElementById('book-note-text').value;

            try {
                const res = await fetch('/save_book_note', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ book_id: bookId, note: noteText })
                });
                if (res.ok) {
                    window.showToast("Заметка сохранена!");
                    document.getElementById('note-container').classList.add('hidden');
                }
            } catch (err) { console.error("Ошибка сохранения заметки:", err); }
        };
    }

    // --- 3. ОТПРАВКА ФОРМЫ ---
    const uploadForm = document.getElementById('uploadBookForm'); // Это твоя форма добавления
    const successMessage = document.getElementById('successMessage');
    const addBookFormGrid = document.getElementById('addBookFormGrid');
    const addModalTitle = document.getElementById('addModalTitle');

    if (uploadForm) {
        uploadForm.onsubmit = async function(e) {
            e.preventDefault();

            // Валидация (если используешь внешний модуль)
            if (typeof validateForm === 'function' && !validateForm('uploadBookForm')) {
                window.showToast("Заполните все обязательные поля");
                return;
            }

            const btn = document.getElementById('submitBook');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = "Загрузка...";

            const formData = new FormData(this);
            try {
                const res = await fetch('/add_book', { method: 'POST', body: formData });

                if (res.ok) {
                    // СКРЫВАЕМ элементы формы внутри модалки
                    if (addBookFormGrid) addBookFormGrid.style.display = 'none';
                    if (addModalTitle) addModalTitle.style.display = 'none';

                    // ПОКАЗЫВАЕМ блок успеха
                    if (successMessage) {
                        successMessage.style.display = 'flex';
                        successMessage.classList.remove('hidden');
                    }

                    // Обновляем список книг в фоне
                    loadData(1, currentFilter);
                } else {
                    const errorMsg = await res.text();
                    window.showToast("Ошибка: " + errorMsg);
                    btn.disabled = false;
                    btn.textContent = originalText;
                }
            } catch (err) {
                console.error("Ошибка при отправке:", err);
                window.showToast("Ошибка соединения с сервером");
                btn.disabled = false;
                btn.textContent = originalText;
            }
        };
    }

    // --- 4. ИНТЕРФЕЙС ---

    const btnAddBook = document.querySelector('.btn-add-book');
    const addBookModal = document.getElementById('addBookModal');
    if (btnAddBook && addBookModal) {
        btnAddBook.onclick = () => {
            uploadForm.reset();
            if (typeof clearErrors === 'function') clearErrors();

            fileNameDisplay.textContent = "Добавить файл книги";
            const dz = document.getElementById('dropzoneContent');
            if (dz) dz.innerHTML = '<img src="/lk/images/place.svg" class="placeholder-icon"><p>Загрузить обложку книги</p>';

            // ВОЗВРАЩАЕМ видимость формы и скрываем успех
            if (addBookFormGrid) addBookFormGrid.style.display = 'grid';
            if (addModalTitle) addModalTitle.style.display = 'block';
            if (successMessage) {
                successMessage.style.display = 'none';
                successMessage.classList.add('hidden');
            }

            addBookModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        };
    }

    // Фильтры
    document.querySelectorAll('.custom-option').forEach(opt => {
        opt.onclick = function() {
            document.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            const triggerText = document.querySelector('.custom-select__trigger span');
            if (triggerText) triggerText.textContent = this.textContent;

            currentFilter = this.getAttribute('data-value');
            currentPage = 1;
            loadData(currentPage, currentFilter);
        };
    });

    initSearch(document.getElementById('book-search-input'));
    // --- ЛОГИКА КАСТОМНОГО ФИЛЬТРА ---
    const select = document.querySelector('.custom-select');
    const trigger = document.querySelector('.custom-select__trigger');
    const options = document.querySelectorAll('.custom-option');

    if (trigger) {
        // Открытие/закрытие списка
        trigger.onclick = (e) => {
            e.stopPropagation();
            select.classList.toggle('open');
        };
    }

    options.forEach(option => {
        option.onclick = function() {
            // 1. Визуальное переключение
            options.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');

            // 2. Обновляем текст в триггере
            const label = trigger.querySelector('span');
            if (label) label.textContent = this.textContent;

            // 3. Закрываем список
            select.classList.remove('open');

            // 4. ЛОГИКА ФИЛЬТРАЦИИ
            currentFilter = this.getAttribute('data-value');
            currentPage = 1; // Всегда сбрасываем на 1 страницу при смене фильтра

            // Вызываем загрузку данных с новым фильтром
            loadData(currentPage, currentFilter);

            window.showToast(`Фильтр: ${this.textContent}`);
        };
    });

    // Закрытие списка при клике в любое другое место
    window.addEventListener('click', () => {
        if (select) select.classList.remove('open');
    });
    window.addEventListener('click', (e) => {
    const editModal = document.getElementById('editBookModal');
    if (e.target === editModal) {
        editModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    });
    // Скачивание
    const downloadBtn = document.getElementById('modal-download-btn');
    if (downloadBtn) {
        downloadBtn.onclick = async function(e) {
            e.preventDefault();
            const modal = document.getElementById('book-modal');
            const bookId = modal.getAttribute('data-current-id');
            const fileUrl = modal.getAttribute('data-file-url');
            const bookTitle = document.getElementById('modal-name').textContent;

            const originalBtnText = downloadBtn.innerHTML;
            downloadBtn.innerHTML = "Загрузка...";

            try {
                // 1. Учет загрузки в БД (таблицы Downloads и Books)
                const trackRes = await fetch('/track_download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ book_id: bookId })
                });
                const trackData = await trackRes.json();

                // 2. Обновляем текст в модалке, если сервер вернул новый счетчик
                if (trackData.status === 'counted') {
                    const downloadDisplay = document.getElementById('modal-downloads');
                    if (downloadDisplay) {
                        downloadDisplay.textContent = `${trackData.new_count} скачиваний`;
                    }
                }

                // 3. Сама процедура скачивания файла (Blob метод)
                const res = await fetch(fileUrl);
                const blob = await res.blob();

                // ОПРЕДЕЛЯЕМ РАСШИРЕНИЕ ИЗ URL
                // fileUrl обычно выглядит как .../files/uuid.epub
                const extension = fileUrl.split('.').pop().split(/\#|\?/)[0] || 'pdf';

                const a = document.createElement('a');
                a.href = window.URL.createObjectURL(blob);

                // Формируем имя файла с правильным расширением
                a.download = `${bookTitle}.${extension}`;

                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                window.showToast("Книга скачана!");
            } catch (err) {
                console.error("Ошибка:", err);
                window.open(fileUrl, '_blank');
            } finally {
                downloadBtn.innerHTML = originalBtnText;
            }
        };
    }

    // Закрытие модалок
    document.querySelectorAll('.close-modal, #closeAddBook').forEach(btn => {
        btn.onclick = () => {
            const m = btn.closest('.modal');
            if (m) {
                m.style.display = 'none';
                document.body.style.overflow = '';
                // Скрываем дропдаун и заметку при закрытии основной модалки
                document.getElementById('optionsDropdown')?.classList.remove('active');
                document.getElementById('note-container')?.classList.add('hidden');
            }
        };
    });
});