document.addEventListener('DOMContentLoaded', () => {
    const selectWrapper = document.querySelector('.custom-select-wrapper');
    const select = document.querySelector('.custom-select');
    const trigger = document.querySelector('.custom-select__trigger');
    const options = document.querySelectorAll('.custom-option');
    const customInput = document.getElementById('custom-genre-input');

    // Открытие/закрытие
    trigger.addEventListener('click', (e) => {
        select.classList.toggle('open');
        e.stopPropagation();
    });

    // Выбор опции
    options.forEach(option => {
        option.addEventListener('click', function() {
            const val = this.getAttribute('data-value');
            
            // Убираем старый выбор
            const currentSelected = select.querySelector('.custom-option.selected');
            if (currentSelected) currentSelected.classList.remove('selected');
            this.classList.add('selected');
            
            // Меняем текст
            trigger.querySelector('span').textContent = this.textContent;
            select.classList.remove('open');

            // ЛОГИКА ДЛЯ "ДРУГОЕ"
            if (val === 'other') {
                customInput.classList.remove('hidden'); // Показываем инпут
                customInput.focus();
            } else {
                customInput.classList.add('hidden'); // Скрываем инпут
                customInput.value = ''; // Очищаем, если передумали
            }
        });
    });

    // Закрытие при клике вне
    window.addEventListener('click', (e) => {
        if (!selectWrapper.contains(e.target)) {
            select.classList.remove('open');
        }
    });
});