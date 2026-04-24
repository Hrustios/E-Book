let lastScrollTop = 0;
let currentZoom = 1;
const ICON_PATH = '/read/images/';
let serverNotes = {};

document.addEventListener('DOMContentLoaded', async () => {
    const themeIcon = document.getElementById('themeIcon');
    const savedTheme = localStorage.getItem('reader-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeIcon) themeIcon.src = `${ICON_PATH}moon.svg`;
    }
    await loadBookmarksFromDB();
});

function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}
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

async function loadBookmarksFromDB() {
    const bookId = document.body.getAttribute('data-book-id');
    try {
        const res = await fetch(`/get_bookmarks/${bookId}`);
        if (res.ok) {
            serverNotes = await res.json();
            updateTabStates();
            renderBookmarks();
        }
    } catch (e) {
        console.error("Ошибка загрузки закладок из БД:", e);
    }
}

window.toggleNoteInput = function(pageNum) {
    const form = document.getElementById(`note-form-${pageNum}`);
    const textarea = document.getElementById(`textarea-${pageNum}`);

    textarea.value = serverNotes[pageNum] || "";

    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
        textarea.focus();
    }
};

window.saveNote = async function(pageNum) {
    const bookId = document.body.getAttribute('data-book-id');
    const textarea = document.getElementById(`textarea-${pageNum}`);
    const text = textarea.value.trim();

    if (!text) {
        showToast("Введите текст заметки");
        return;
    }

    try {
        const res = await fetch('/save_bookmark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                book_id: bookId,
                page: pageNum,
                content: text
            })
        });

        if (res.ok) {
            serverNotes[pageNum] = text; // Обновляем локальный кэш
            showToast(`Заметка на стр. ${pageNum} сохранена`);
            document.getElementById(`note-form-${pageNum}`).classList.add('hidden');
            updateTabStates();
            renderBookmarks();
        } else {
            showToast("Ошибка при сохранении");
        }
    } catch (e) {
        console.error(e);
        showToast("Сервер недоступен");
    }
};

window.deleteNote = async function(pageNum) {
    const bookId = document.body.getAttribute('data-book-id');

    if (!confirm(`Удалить заметку на странице ${pageNum}?`)) return;

    try {
        const res = await fetch('/delete_bookmark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                book_id: bookId,
                page: pageNum
            })
        });

        if (res.ok) {
            delete serverNotes[pageNum]; // Удаляем из локального кэша
            document.getElementById(`textarea-${pageNum}`).value = '';
            document.getElementById(`note-form-${pageNum}`).classList.add('hidden');
            updateTabStates();
            renderBookmarks();
            showToast('Заметка удалена');
        }
    } catch (e) {
        console.error(e);
        showToast("Ошибка при удалении");
    }
};

window.toggleBookmarkList = function() {
    const menu = document.getElementById('bookmarks-menu');
    menu.classList.toggle('hidden');
    if (!menu.classList.contains('hidden')) renderBookmarks();
};

function renderBookmarks() {
    const ul = document.getElementById('bookmarks-ul');
    ul.innerHTML = '';

    const pages = Object.keys(serverNotes).sort((a, b) => Number(a) - Number(b));

    if (pages.length === 0) {
        ul.innerHTML = '<li style="opacity:0.5; text-align:center; padding: 10px;">Нет заметок</li>';
        return;
    }

    pages.forEach(page => {
        const li = document.createElement('li');
        li.className = 'bookmark-item';
        const previewText = serverNotes[page].length > 30
            ? serverNotes[page].substring(0, 30) + '...'
            : serverNotes[page];

        li.innerHTML = `<strong>Стр. ${page}:</strong> <span>${previewText}</span>`;

        li.onclick = () => {
            const targetPage = document.getElementById(`page-${page}`);
            if (targetPage) {
                targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            document.getElementById('bookmarks-menu').classList.add('hidden');
        };
        ul.appendChild(li);
    });
}

function updateTabStates() {
    document.querySelectorAll('.page-wrapper').forEach((wrapper) => {
        const pageImg = wrapper.querySelector('.pdf-page-img');
        const pageNum = pageImg.getAttribute('data-page');
        const tab = wrapper.querySelector('.note-tab');

        if (serverNotes[pageNum]) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
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