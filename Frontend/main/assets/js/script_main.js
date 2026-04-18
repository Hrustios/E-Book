document.addEventListener('DOMContentLoaded', () => {
    //1. КНОПКА "ВВЕРХ" 
    const btnUp = document.querySelector('.btn-up');

    if (btnUp) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                btnUp.style.opacity = '1';
                btnUp.style.visibility = 'visible';
            } else {
                btnUp.style.opacity = '0';
                btnUp.style.visibility = 'hidden';
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

    //2. СЛАЙДЕР КАТАЛОГа
    const grid = document.querySelector('.book-grid');
    const nextBtn = document.querySelector('.nav-btn.next');
    const prevBtn = document.querySelector('.nav-btn.prev');

    // Проверяем, что все элементы слайдера есть на странице
    if (grid && nextBtn && prevBtn) {
        
        const getScrollStep = () => {
            const card = grid.querySelector('.book-card');
            if (!card) return 0; // Защита, если карточек нет

            const cardWidth = card.offsetWidth;
            const gap = parseInt(window.getComputedStyle(grid).gap) || 0;
            
            return cardWidth + gap;
        };

        nextBtn.addEventListener('click', () => {
            grid.scrollBy({
                left: getScrollStep(),
                behavior: 'smooth'
            });
        });

        prevBtn.addEventListener('click', () => {
            grid.scrollBy({
                left: -getScrollStep(),
                behavior: 'smooth'
            });
        });

        // Визуальное состояние кнопок при скролле
        grid.addEventListener('scroll', () => {
            const isAtStart = grid.scrollLeft <= 0;
            const isAtEnd = grid.scrollLeft + grid.offsetWidth >= grid.scrollWidth - 1;
            
            prevBtn.style.opacity = isAtStart ? '0.3' : '1';
            prevBtn.style.pointerEvents = isAtStart ? 'none' : 'auto';
            
            nextBtn.style.opacity = isAtEnd ? '0.3' : '1';
            nextBtn.style.pointerEvents = isAtEnd ? 'none' : 'auto';
        });

        // Инициализация состояния кнопок при загрузке
        grid.dispatchEvent(new Event('scroll'));
    }
});