// main.js
import { initModalSystem, openModal, closeModal } from './modals.js';
import { validateForm, initValidationListeners, clearErrors } from './validation.js';
import { renderBooks, renderPagination, initSearch, openFullBookModal } from './books_ui.js';
import { fetchMyBooks, downloadBook } from './api_handlers.js';
import { initCustomSelect } from './select.js';

document.addEventListener('DOMContentLoaded', () => {
    // === 1. ГЛОБАЛЬНЫЕ ПРИВЯЗКИ ===
    // Прокидываем функции в window, чтобы они были доступны из HTML (onclick) и других скриптов (select.js)
    window.openFullBookModal = openFullBookModal;
    window.closeModal = closeModal;

    const infoModal = document.getElementById("book-modal");
    const editModal = document.getElementById('editBookModal');
    const uploadForm = document.getElementById('uploadBookForm');
    const editForm = document.getElementById('editBookForm');

    const coverInput = document.getElementById('coverInput');
    const coverDropzone = document.getElementById('dropzoneContent');
    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileNameDisplay');

    // === 2. ИНИЦИАЛИЗАЦИЯ СИСТЕМ ===
    initModalSystem();
    initValidationListeners();
    initSearch(document.getElementById('search-books'));
    initCustomSelect();

    /**
     * Основная функция загрузки данных.
     * Теперь поддерживает фильтрацию.
     */
    const loadData = (page = 1, filter = 'all') => {
        fetchMyBooks(page, filter).then(data => {
            const container = document.querySelector('.profile-book-grid');
            if (container) {
                renderBooks(data.books, container);
                renderPagination(
                    data.total_pages,
                    data.current_page,
                    document.getElementById('pagination'),
                    (p) => loadData(p, filter)
                );
            }
        }).catch(err => console.error("Ошибка загрузки данных:", err));
    };

    // Делаем loadData доступной для select.js
    window.loadData = loadData;

    // === 3. ПРЕДПРОСМОТР ФАЙЛОВ (ЗАГРУЗКА) ===
    if (coverInput) {
        coverInput.onchange = function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    coverDropzone.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:28px;">`;
                };
                reader.readAsDataURL(file);
            }
        };
    }

    if (fileInput) {
        fileInput.onchange = function() {
            if (this.files[0]) {
                fileNameDisplay.textContent = `Выбрано: ${this.files[0].name}`;
                fileNameDisplay.style.color = "#27ae60";
            }
        };
    }

    // === 4. КНОПКИ В МОДАЛКЕ ПОДРОБНОСТЕЙ (INFO) ===

    // Кнопка Чтения (Новая логика перехода)
    const readBtn = infoModal ? infoModal.querySelector('.btn-read') : null;
    if (readBtn) {
        readBtn.onclick = function(e) {
            e.preventDefault();
            // Получаем ID из атрибута, который прописывает books_ui.js при открытии
            const currentId = infoModal.getAttribute('data-current-id');
            if (currentId) {
                console.log("Переход к чтению книги ID:", currentId);
                // Редирект на роут Flask (папка Frontend/read/read_page.html)
                window.location.href = `/read/${currentId}`;
            } else {
                console.error("ID книги не найден в атрибутах модалки!");
            }
        };
    }

    // Кнопка Скачивания
    const downloadBtn = document.getElementById('btn-download');
    if (downloadBtn) {
        downloadBtn.onclick = function(e) {
            e.preventDefault();
            const url = infoModal.getAttribute('data-file-url');
            const title = document.getElementById("modal-name").textContent;
            downloadBook(url, title, this);
        };
    }

    // Кнопка Перехода к редактированию
    const editBtnInInfo = infoModal.querySelector('img[alt="Edit"]')?.closest('.btn-icon');
    if (editBtnInInfo) {
        editBtnInInfo.onclick = function() {
            const currentId = infoModal.getAttribute('data-current-id');

            closeModal(infoModal);

            const idInput = document.getElementById('edit-book-id');
            if (idInput) {
                idInput.value = currentId;
            }

            document.getElementById('edit-book-title').value = document.getElementById("modal-name").textContent.trim();

            const authorEl = infoModal.querySelector(".modal-author");
            document.getElementById('edit-book-author').value = authorEl ? authorEl.textContent.trim() : "";

            document.getElementById('edit-book-year').value = document.getElementById("modal-year").textContent.trim();

            const genreEl = infoModal.querySelector(".tag");
            document.getElementById('edit-book-genre').value = genreEl ? genreEl.textContent.trim() : "";

            document.getElementById('edit-book-description').value = document.getElementById("modal-description").textContent.trim();

            document.getElementById('edit-cover-preview').src = infoModal.querySelector(".book-cover-img").src;

            const readonlyFields = ['edit-book-title', 'edit-book-author'];
            readonlyFields.forEach(fieldId => {
                const el = document.getElementById(fieldId);
                if (el) {
                    el.setAttribute('readonly', true);
                    el.style.opacity = '0.7';
                    el.style.pointerEvents = 'none';
                }
            });

            setTimeout(() => {
                clearErrors();
                openModal(editModal);
            }, 450);
        };
    }

    // === 5. ОБРАБОТКА ОТПРАВКИ ФОРМ ===

    if (uploadForm) {
        uploadForm.onsubmit = async function(e) {
            e.preventDefault();
            if (!validateForm('uploadBookForm')) return;

            const btn = this.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = "Загрузка...";

            const res = await fetch('/add_book', { method: 'POST', body: new FormData(this) });
            if (res.ok) {
                document.getElementById('addBookFormGrid').style.display = 'none';
                document.getElementById('successMessage').style.display = 'flex';
                loadData();
            } else {
                alert("Ошибка при сохранении книги");
            }
            btn.disabled = false;
            btn.textContent = "Добавить книгу";
        };
    }

    if (editForm) {
        editForm.onsubmit = async function(e) {
            e.preventDefault();
            if (!validateForm('editBookForm')) return;

            const btn = document.getElementById('submitEditBook');
            btn.disabled = true;
            btn.textContent = "Сохранение...";

            const formData = new FormData(editForm);

            try {
                const res = await fetch('/update_book', {
                    method: 'POST',
                    body: formData
                });

                const result = await res.json();

                if (res.ok && result.status === 'success') {
                    closeModal(editModal);
                    const currentFilter = document.querySelector('.custom-option.selected')?.getAttribute('data-value') || 'all';
                    loadData(1, currentFilter);
                } else {
                    alert("Ошибка: " + (result.message || "Неизвестная ошибка"));
                }
            } catch (err) {
                console.error("Ошибка сети:", err);
                alert("Ошибка сети. Проверьте соединение.");
            } finally {
                btn.disabled = false;
                btn.textContent = "Сохранить изменения";
            }
        };
    }

    const addBtn = document.querySelector('.btn-add-book');
    if (addBtn) {
        addBtn.onclick = () => {
            uploadForm.reset();
            clearErrors();
            coverDropzone.innerHTML = `<img src="/lk/images/place.svg" class="placeholder-icon"><p>Загрузить обложку</p>`;
            fileNameDisplay.textContent = 'Добавить файл книги';
            fileNameDisplay.style.color = "";

            document.getElementById('addBookFormGrid').style.display = 'grid';
            document.getElementById('successMessage').style.display = 'none';
            openModal(document.getElementById('addBookModal'));
        };
    }

    // Первоначальная загрузка
    loadData();
});