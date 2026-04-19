// modals.js

export const openModal = (modal) => {
    if (!modal) return;
    modal.classList.add("is-visible");
    document.body.style.overflow = "hidden";
};

export const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove("is-visible");
    setTimeout(() => {
        if (!document.querySelector('.modal.is-visible')) {
            document.body.style.overflow = "";
        }
    }, 400);
};

export function initModalSystem() {
    // 1. Закрытие модалок по крестику
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = () => closeModal(btn.closest('.modal'));
    });

    // 2. Закрытие по клику на фон (оверлей)
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });

    // 3. ПЛАВНЫЙ СКРОЛЛ НАВЕРХ (кнопка .btn-up)
    const scrollToTopBtn = document.querySelector('.btn-up');

    if (scrollToTopBtn) {
        scrollToTopBtn.onclick = (e) => {
            e.preventDefault(); // Чтобы страница не прыгала из-за href="#"

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        };

        // Опционально: скрывать/показывать кнопку при прокрутке
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollToTopBtn.style.opacity = '1';
                scrollToTopBtn.style.pointerEvents = 'auto';
            } else {
                scrollToTopBtn.style.opacity = '0';
                scrollToTopBtn.style.pointerEvents = 'none';
            }
        });
    }
}