// === КНОПКА "НАВЕРХ" ===
const btnUp = document.querySelector('.btn-up');

if (btnUp) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btnUp.style.opacity = '1';
            btnUp.style.visibility = 'visible';
        } else {
            btnUp.style.opacity = '0';
            btnUp.style.visibility = 'hidden';
        }
    });

    btnUp.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// === ВЫПАДАЮЩЕЕ МЕНЮ ПРОФИЛЯ ===
const profileTrigger = document.getElementById('profileDropdownTrigger');
const profileMenu = document.getElementById('headerProfileMenu');

if (profileTrigger && profileMenu) {
    profileTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        profileMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!profileTrigger.contains(e.target)) {
            profileMenu.classList.remove('active');
        }
    });
}