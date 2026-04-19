// main.js
import { initModalSystem, openModal, closeModal } from './modals.js';
import { validateForm, initValidationListeners, clearErrors } from './validation.js';
import { renderBooks, renderPagination, initSearch, openFullBookModal } from './books_ui.js';
import { fetchMyBooks, downloadBook } from './api_handlers.js';

document.addEventListener('DOMContentLoaded', () => {
    // === 1. ГЛОБАЛЬНЫЕ ПРИВЯЗКИ ===
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

    const loadData = (page = 1) => {
        fetchMyBooks(page).then(data => {
            const container = document.querySelector('.profile-book-grid');
            renderBooks(data.books, container);
            renderPagination(data.total_pages, data.current_page, document.getElementById('pagination'), loadData);
        }).catch(err => console.error("Ошибка обновления списка:", err));
    };

    // === 3. ПРЕДПРОСМОТР ФАЙЛОВ ===
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

    // === 4. КНОПКИ В МОДАЛКЕ ПОДРОБНОСТЕЙ ===

    const downloadBtn = document.getElementById('btn-download');
    if (downloadBtn) {
        downloadBtn.onclick = function(e) {
            e.preventDefault();
            const url = infoModal.getAttribute('data-file-url');
            const title = document.getElementById("modal-name").textContent;
            downloadBook(url, title, this);
        };
    }

    // --- ИСПРАВЛЕННЫЙ БЛОК РЕДАКТИРОВАНИЯ ---
    // --- БЛОК РЕДАКТИРОВАНИЯ ---
    const editBtnInInfo = infoModal.querySelector('img[alt="Edit"]')?.closest('.btn-icon');
    if (editBtnInInfo) {
        editBtnInInfo.onclick = function() {
            const currentId = infoModal.getAttribute('data-current-id');
            closeModal(infoModal);

            const idInput = document.getElementById('edit-book-id');
            if (idInput) {
                idInput.value = currentId;
            }

            // ИСПРАВЛЕННЫЙ БЛОК КОПИРОВАНИЯ:
            // Название
            document.getElementById('edit-book-title').value = document.getElementById("modal-name").textContent.trim();

            // Автор (ищем внутри infoModal по классу .modal-author)
            const authorElement = infoModal.querySelector(".modal-author");
            document.getElementById('edit-book-author').value = authorElement ? authorElement.textContent.trim() : "";

            // Год
            document.getElementById('edit-book-year').value = document.getElementById("modal-year").textContent.trim();

            // Жанр
            const genreElement = infoModal.querySelector(".tag");
            document.getElementById('edit-book-genre').value = genreElement ? genreElement.textContent.trim() : "";

            // Описание
            document.getElementById('edit-book-description').value = document.getElementById("modal-description").textContent.trim();

            // Обложка
            document.getElementById('edit-cover-preview').src = infoModal.querySelector(".book-cover-img").src;

            // Блокируем поля
            const readonlyFields = ['edit-book-title', 'edit-book-author'];
            readonlyFields.forEach(fieldId => {
                const el = document.getElementById(fieldId);
                if (el) {
                    el.setAttribute('readonly', true);
                    el.style.opacity = '0.7';
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

            // ВАЛИДАЦИЯ ПЕРЕД ОТПРАВКОЙ
            if (!validateForm('editBookForm')) {
                console.log("Валидация редактирования не пройдена");
                return;
            }

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
                    loadData();
                } else {
                    alert("Ошибка: " + (result.message || "Ошибка сервера"));
                }
            } catch (err) {
                console.error(err);
                alert("Ошибка сети.");
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
            coverDropzone.innerHTML = `<img src="/static/lk/images/place.svg" class="placeholder-icon"><p>Загрузить обложку</p>`;
            fileNameDisplay.textContent = 'Добавить файл книги';
            fileNameDisplay.style.color = "";
            document.getElementById('addBookFormGrid').style.display = 'grid';
            document.getElementById('successMessage').style.display = 'none';
            openModal(document.getElementById('addBookModal'));
        };
    }

    loadData();
});