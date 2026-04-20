// select.js
export function initCustomSelect() {
    const select = document.querySelector('.custom-select');
    const trigger = document.querySelector('.custom-select__trigger');
    const options = document.querySelectorAll('.custom-option');

    if (!select || !trigger) return;

    trigger.addEventListener('click', (e) => {
        select.classList.toggle('open');
        e.stopPropagation();
    });

    options.forEach(option => {
        option.addEventListener('click', function() {
            if (!this.classList.contains('selected')) {
                options.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');

                const span = trigger.querySelector('span');
                if (span) span.textContent = this.textContent;

                const filterValue = this.getAttribute('data-value');
                if (window.loadData) {
                    window.loadData(1, filterValue);
                }
            }
            select.classList.remove('open');
        });
    });

    window.addEventListener('click', () => {
        if (select) select.classList.remove('open');
    });
}