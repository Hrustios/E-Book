// validation.js

export const clearErrors = () => {
    document.querySelectorAll('.error-text').forEach(el => el.classList.remove('is-visible'));
    document.querySelectorAll('.form-input, .form-textarea, .invalid').forEach(el => el.classList.remove('invalid'));
    document.getElementById('coverDropzone')?.classList.remove('invalid');
    document.getElementById('editDropzoneContent')?.parentElement?.classList.remove('invalid'); // Для формы редактирования
    document.getElementById('fileNameDisplay')?.classList.remove('invalid');
};

export const showError = (id, msg) => {
    const errEl = document.getElementById(`err-${id}`);
    const inputEl = document.getElementById(id);
    if (errEl) {
        errEl.textContent = msg;
        errEl.classList.add('is-visible');
    }
    if (inputEl) inputEl.classList.add('invalid');
};

export function validateForm(formId) {
    let isValid = true;
    clearErrors();
    const prefix = formId === 'editBookForm' ? 'edit-' : '';
    const currentYear = 2026;

    // 1. Валидация файлов (только для загрузки)
    if (formId === 'uploadBookForm') {
        const coverFile = document.getElementById('coverInput').files[0];
        const bookFile = document.getElementById('fileInput').files[0];

        if (!coverFile) {
            document.getElementById('coverDropzone').classList.add('invalid');
            isValid = false;
        }

        if (!bookFile) {
            document.getElementById('fileNameDisplay').classList.add('invalid');
            isValid = false;
        }
    }

    // 2. Валидация текстовых полей
    const fields = ['book-title', 'book-author', 'book-year', 'book-genre', 'book-description'];

    fields.forEach(f => {
        const fullId = prefix + f;
        const el = document.getElementById(fullId);
        if (!el) return;

        const value = el.value.trim();

        // Проверка на пустые поля
        if (!value) {
            showError(fullId, 'Обязательное поле');
            isValid = false;
        }
        // Специфическая проверка для ГОДА
        else if (f === 'book-year') {
            const year = parseInt(value);
            if (isNaN(year) || year < 1000 || year > currentYear) {
                showError(fullId, `Год должен быть от 1000 до ${currentYear}`);
                isValid = false;
            }
        }
    });

    return isValid;
}

export function initValidationListeners() {
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('form-input') || e.target.classList.contains('form-textarea')) {
            e.target.classList.remove('invalid');
            const errId = `err-${e.target.id}`;
            const errEl = document.getElementById(errId);
            if (errEl) errEl.classList.remove('is-visible');
        }
    });
}