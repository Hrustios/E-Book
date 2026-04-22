// validation.js

// 1. Очистка ошибок
export const clearErrors = () => {
    document.querySelectorAll('.error-text').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
        el.classList.remove('is-visible');
    });

    document.querySelectorAll('.form-input, .form-textarea, .invalid').forEach(el => {
        el.classList.remove('invalid');
    });

    document.getElementById('coverDropzone')?.classList.remove('invalid');
    document.getElementById('fileNameDisplay')?.classList.remove('invalid');
};

// 2. Универсальная функция установки ошибки
export function setError(inputId, message) {
    const errEl = document.getElementById(`err-${inputId}`);
    const inputEl = document.getElementById(inputId);

    if (errEl) {
        errEl.textContent = message;
        errEl.style.display = 'block';
        errEl.style.color = 'red';
        errEl.classList.add('is-visible');
    }

    if (inputEl) {
        inputEl.classList.add('invalid');
    }

    if (inputId === 'coverInput') {
        document.getElementById('coverDropzone')?.classList.add('invalid');
    }
    if (inputId === 'fileInput') {
        document.getElementById('fileNameDisplay')?.classList.add('invalid');
    }
}

// 3. Расширенная валидация
export function validateForm(formId) {
    clearErrors();
    let isValid = true;

    // Название
    const title = document.getElementById('book-title');
    if (!title || !title.value.trim()) {
        setError('book-title', 'Введите название книги');
        isValid = false;
    }

    // Автор
    const author = document.getElementById('book-author');
    if (!author || !author.value.trim()) {
        setError('book-author', 'Введите автора книги');
        isValid = false;
    }

    // Год издания
    const year = document.getElementById('book-year');
    const currentYear = new Date().getFullYear();
    if (!year || !year.value) {
        setError('book-year', 'Укажите год издания');
        isValid = false;
    } else if (parseInt(year.value) > currentYear) {
        setError('book-year', 'Год не может быть в будущем');
        isValid = false;
    } else if (parseInt(year.value) < 1000) {
        setError('book-year', 'Введите корректный год');
        isValid = false;
    }

    // Жанр
    const genre = document.getElementById('book-genre');
    if (!genre || !genre.value.trim()) {
        setError('book-genre', 'Выберите или введите жанр');
        isValid = false;
    }

    // Описание
    const description = document.getElementById('book-description');
    if (!description || !description.value.trim()) {
        setError('book-description', 'Добавьте описание книги');
        isValid = false;
    } else if (description.value.trim().length < 10) {
        setError('book-description', 'Описание слишком короткое');
        isValid = false;
    }

    // Файл книги
    const fileInput = document.getElementById('fileInput');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        setError('fileInput', 'Выберите файл книги (PDF)');
        isValid = false;
    }

    // Обложка
    const coverInput = document.getElementById('coverInput');
    if (!coverInput || !coverInput.files || coverInput.files.length === 0) {
        setError('coverInput', 'Загрузите обложку');
        isValid = false;
    }

    return isValid;
}

// 4. Слушатели для живой очистки
export function initValidationListeners() {
    // Обработка ввода (текст)
    document.addEventListener('input', (e) => {
        if (e.target.id) {
            const errEl = document.getElementById(`err-${e.target.id}`);
            if (errEl) {
                errEl.style.display = 'none';
                e.target.classList.remove('invalid');
            }
        }
    });

    // Обработка выбора (для жанра из datalist и файлов)
    document.addEventListener('change', (e) => {
        if (e.target.id) {
            const errEl = document.getElementById(`err-${e.target.id}`);
            if (errEl) {
                errEl.style.display = 'none';
                e.target.classList.remove('invalid');

                // Специальный сброс для визуальных зон
                if (e.target.id === 'fileInput') {
                    document.getElementById('fileNameDisplay')?.classList.remove('invalid');
                }
                if (e.target.id === 'coverInput') {
                    document.getElementById('coverDropzone')?.classList.remove('invalid');
                }
            }
        }
    });
}