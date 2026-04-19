let lastScrollTop = 0;
let currentZoom = 1;

// Объявляем переменные, но инициализируем их позже
let toolbar;
let readerText;
let themeIcon;

// Ждем полной загрузки DOM, прежде чем искать элементы
document.addEventListener('DOMContentLoaded', () => {
    toolbar = document.getElementById('readerToolbar');
    readerText = document.getElementById('readerText');
    themeIcon = document.getElementById('themeIcon');

    // Проверка сохраненной темы при загрузке
    const savedTheme = localStorage.getItem('reader-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeIcon) themeIcon.src = 'images/moon.svg';
    }
});

// 1. Переключение темы и смена иконки
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    
    if (themeIcon) {
        // Добавляем проверку на существование элемента
        themeIcon.src = isDark ? 'images/moon.svg' : 'images/sun.svg';
    }

    localStorage.setItem('reader-theme', isDark ? 'dark' : 'light');
}

// 2. Скрытие меню при скролле
window.addEventListener('scroll', () => {
    if (!toolbar) return; // Защита от ошибок, если элемент еще не найден

    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Прячем, если скроллим вниз и пролистали больше 150px
    if (scrollTop > lastScrollTop && scrollTop > 150) {
        toolbar.classList.add('hidden');
    } else {
        toolbar.classList.remove('hidden');
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // Для корректной работы на мобильных
});

// 3. Управление масштабом
function changeZoom(delta) {
    if (!readerText) return;
    
    currentZoom += delta;
    if (currentZoom < 0.7) currentZoom = 0.7;
    if (currentZoom > 2.0) currentZoom = 2.0;
    
    readerText.style.fontSize = `${18 * currentZoom}px`;
}

// 4. Закладка
function toggleBookmark() {
    const btn = document.getElementById('bookmarkBtn');
    if (btn) btn.classList.toggle('active');
}