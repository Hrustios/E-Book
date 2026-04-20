let lastScrollTop = 0;
let currentZoom = 1;
const ICON_PATH = '/read/images/';

document.addEventListener('DOMContentLoaded', () => {
    const themeIcon = document.getElementById('themeIcon');
    const savedTheme = localStorage.getItem('reader-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeIcon) themeIcon.src = `${ICON_PATH}moon.svg`;
    }
    renderBookmarks();
    updateTabStates();
});

function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// --- ТЕМА И ЗУМ ---
window.toggleTheme = function() {
    const isDark = document.body.classList.toggle('dark-theme');
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) themeIcon.src = isDark ? `${ICON_PATH}moon.svg` : `${ICON_PATH}sun.svg`;
    localStorage.setItem('reader-theme', isDark ? 'dark' : 'light');
};

window.changeZoom = function(delta) {
    const area = document.querySelector('.readable-area');
    currentZoom = Math.min(Math.max(currentZoom + delta, 0.5), 2.5);
    area.style.setProperty('--zoom-level', currentZoom);
};

// --- ЛОГИКА ЗАМЕТОК ---

// Показать/скрыть ввод
window.toggleNoteInput = function(pageNum) {
    const form = document.getElementById(`note-form-${pageNum}`);
    const textarea = document.getElementById(`textarea-${pageNum}`);

    // Подгружаем существующий текст, если есть
    const bookId = document.body.getAttribute('data-book-id');
    const notes = JSON.parse(localStorage.getItem(`notes_${bookId}`)) || {};
    if (notes[pageNum]) textarea.value = notes[pageNum];

    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) textarea.focus();
};

// Сохранить заметку
window.saveNote = function(pageNum) {
    const bookId = document.body.getAttribute('data-book-id');
    const text = document.getElementById(`textarea-${pageNum}`).value.trim();
    let notes = JSON.parse(localStorage.getItem(`notes_${bookId}`)) || {};

    if (text) {
        notes[pageNum] = text;
        showToast(`Заметка на стр. ${pageNum} сохранена`);
    } else {
        delete notes[pageNum];
    }

    localStorage.setItem(`notes_${bookId}`, JSON.stringify(notes));
    document.getElementById(`note-form-${pageNum}`).classList.add('hidden');
    updateTabStates();
    renderBookmarks();
};

// Удалить заметку
window.deleteNote = function(pageNum) {
    const bookId = document.body.getAttribute('data-book-id');
    let notes = JSON.parse(localStorage.getItem(`notes_${bookId}`)) || {};
    delete notes[pageNum];
    localStorage.setItem(`notes_${bookId}`, JSON.stringify(notes));

    document.getElementById(`textarea-${pageNum}`).value = '';
    document.getElementById(`note-form-${pageNum}`).classList.add('hidden');
    updateTabStates();
    renderBookmarks();
    showToast('Заметка удалена');
};

// Список закладок
window.toggleBookmarkList = function() {
    const menu = document.getElementById('bookmarks-menu');
    menu.classList.toggle('hidden');
    if (!menu.classList.contains('hidden')) renderBookmarks();
};

function renderBookmarks() {
    const bookId = document.body.getAttribute('data-book-id');
    const notes = JSON.parse(localStorage.getItem(`notes_${bookId}`)) || {};
    const ul = document.getElementById('bookmarks-ul');
    ul.innerHTML = '';

    const pages = Object.keys(notes).sort((a, b) => a - b);

    if (pages.length === 0) {
        ul.innerHTML = '<li style="opacity:0.5; text-align:center;">Нет заметок</li>';
        return;
    }

    pages.forEach(page => {
        const li = document.createElement('li');
        li.className = 'bookmark-item';
        li.innerHTML = `<strong>Стр. ${page}:</strong> <span>${notes[page].substring(0, 30)}${notes[page].length > 30 ? '...' : ''}</span>`;
        li.onclick = () => {
            document.getElementById(`page-${page}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.getElementById('bookmarks-menu').classList.add('hidden');
        };
        ul.appendChild(li);
    });
}

function updateTabStates() {
    const bookId = document.body.getAttribute('data-book-id');
    const notes = JSON.parse(localStorage.getItem(`notes_${bookId}`)) || {};

    document.querySelectorAll('.note-tab').forEach((tab, index) => {
        const pageNum = index + 1;
        if (notes[pageNum]) tab.classList.add('active');
        else tab.classList.remove('active');
    });
}

window.addEventListener('scroll', () => {
    const toolbar = document.getElementById('readerToolbar');
    let st = window.pageYOffset || document.documentElement.scrollTop;
    if (st > lastScrollTop && st > 150) {
        toolbar.classList.add('hidden');
        document.getElementById('bookmarks-menu').classList.add('hidden');
    } else {
        toolbar.classList.remove('hidden');
    }
    lastScrollTop = st <= 0 ? 0 : st;
});