document.addEventListener('DOMContentLoaded', () => {

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

    // === ЛОГИКА ВЫПАДАЮЩЕГО СПИСКА (ЛИЧНЫЙ КАБИНЕТ) ===
    const profileTrigger = document.getElementById('profileDropdownTrigger');
    const profileMenu = document.getElementById('headerProfileMenu');

    if (profileTrigger && profileMenu) {
        // Открытие/закрытие при клике на блок профиля
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation(); // Важно: чтобы клик не улетал на document
            profileMenu.classList.toggle('active');
        });

        // Закрытие меню, если кликнули в любое другое место страницы
        document.addEventListener('click', (e) => {
            if (!profileTrigger.contains(e.target)) {
                profileMenu.classList.remove('active');
            }
        });
    }
});