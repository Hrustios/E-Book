// === КНОПКА "НАВЕРХ" ===
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