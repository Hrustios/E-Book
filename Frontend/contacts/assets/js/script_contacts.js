document.addEventListener('DOMContentLoaded', () => {

    // === 1. КНОПКА "НАВЕРХ" ===
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

    // === 2. ВЫПАДАЮЩЕЕ МЕНЮ ПРОФИЛЯ ===
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

    // === 3. ЛОГИКА ФОРМЫ ОБРАТНОЙ СВЯЗИ ===
    const feedbackForm = document.getElementById('feedbackFormMain');
    const modalOverlay = document.getElementById('modalOverlay');

    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = feedbackForm.querySelector('.btn-submit');
            const originalBtnText = submitBtn.innerText;

            // Собираем данные
            const formData = {
                name: document.getElementById('user-name').value,
                email: document.getElementById('user-email').value,
                subject: document.getElementById('user-subject').value,
                message: document.getElementById('user-message').value
            };

            try {
                submitBtn.disabled = true;
                submitBtn.innerText = 'Отправка...';

                const response = await fetch('/send_feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok && result.status === 'success') {
                    if (modalOverlay) modalOverlay.style.display = 'flex';
                    feedbackForm.reset();
                } else {
                    alert('Ошибка: ' + (result.message || 'Ошибка сервера'));
                }
            } catch (error) {
                console.error('Fetch error:', error);
                alert('Не удалось связаться с сервером');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            }
        });
    }
});

// === 4. ФУНКЦИЯ ЗАКРЫТИЯ МОДАЛКИ ===
// Выносим за пределы DOMContentLoaded, чтобы onclick в HTML её видел
window.closeSuccessModal = function() {
    const modal = document.getElementById('modalOverlay');
    if (modal) {
        modal.style.display = 'none';
    }
};