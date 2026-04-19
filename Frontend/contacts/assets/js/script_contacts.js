document.addEventListener('DOMContentLoaded', () => {
    const btnUp = document.querySelector('.btn-up');

    if (btnUp) {
        window.addEventListener('scroll', () => {
            // Если прокрутили больше 300px
            if (window.scrollY > 300) {
                btnUp.style.opacity = '1';
                btnUp.style.visibility = 'visible';
                btnUp.style.transform = 'translateY(0)';
            } else {
                btnUp.style.opacity = '0';
                btnUp.style.visibility = 'hidden';
                btnUp.style.transform = 'translateY(20px)'; // Добавим эффект вылета
            }
        });

        btnUp.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});