document.addEventListener('DOMContentLoaded', () => {
    // === 1. КНОПКА "ВВЕРХ" ===
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

    // === 3. СЛАЙДЕР КАТАЛОГА (ГЛАВНАЯ) ===
    const grid = document.querySelector('.book-grid');
    const nextBtn = document.querySelector('.nav-btn.next');
    const prevBtn = document.querySelector('.nav-btn.prev');

    if (grid && nextBtn && prevBtn) {
        const getScrollStep = () => {
            const card = grid.querySelector('.book-card');
            if (!card) return 0;
            const cardWidth = card.offsetWidth;
            const gap = parseInt(window.getComputedStyle(grid).gap) || 0;
            return cardWidth + gap;
        };

        nextBtn.addEventListener('click', () => {
            grid.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
        });

        prevBtn.addEventListener('click', () => {
            grid.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
        });

        grid.addEventListener('scroll', () => {
            const isAtStart = grid.scrollLeft <= 0;
            const isAtEnd = grid.scrollLeft + grid.offsetWidth >= grid.scrollWidth - 1;

            prevBtn.style.opacity = isAtStart ? '0.3' : '1';
            prevBtn.style.pointerEvents = isAtStart ? 'none' : 'auto';

            nextBtn.style.opacity = isAtEnd ? '0.3' : '1';
            nextBtn.style.pointerEvents = isAtEnd ? 'none' : 'auto';
        });

        grid.dispatchEvent(new Event('scroll'));
    }

    // === 4. ВИДЖЕТ ЛИДЕРА ЧТЕНИЙ ===
    fetchLeaderBook();
});

// Функция загрузки лидера чтений
async function fetchLeaderBook() {
    try {
        const response = await fetch('/get_leader_book');
        if (!response.ok) return;

        const book = await response.json();

        // Заполнение текстовых данных
        const titleEl = document.getElementById('leader-title');
        const authorEl = document.getElementById('leader-author');
        const descEl = document.getElementById('leader-desc');
        const coverImg = document.getElementById('leader-cover');
        const widget = document.getElementById('leader-widget');

        if (titleEl) titleEl.textContent = book.title;
        if (authorEl) authorEl.textContent = book.author_name;
        if (descEl) descEl.textContent = book.description;

        // Обновление обложки
        if (coverImg && book.cover_url) {
            coverImg.src = book.cover_url;
            coverImg.style.width = "100%";
            coverImg.style.height = "100%";
            coverImg.style.objectFit = "cover";
            coverImg.style.borderRadius = "8px";

            // Если был плейсхолдер с фоном, убираем его визуально
            const placeholder = document.getElementById('leader-cover-parent');
            if (placeholder) placeholder.style.background = "none";
        }


    } catch (error) {
        console.error("Ошибка при загрузке лидера чтений:", error);
    }
}

// === 5. ЛОГИКА ЗАМЕТОК В МОДАЛКЕ ===
const notesBtn = document.getElementById('btn-notes');
const notesSection = document.getElementById('notes-section');
const noteTextArea = document.getElementById('book-note');

if (notesBtn && notesSection) {
    notesBtn.onclick = (e) => {
        e.stopPropagation();

        // Переключаем класс hidden (как в каталоге)
        const isHidden = notesSection.classList.toggle('hidden');
        notesBtn.classList.toggle('active');

        // Если открыли — фокусимся на поле ввода
        if (!isHidden && noteTextArea) {
            noteTextArea.focus();
        }
    };
}

// Сохранение заметки
const saveNoteBtn = document.getElementById('save-note-btn');
if (saveNoteBtn) {
    saveNoteBtn.onclick = async () => {
        const infoModal = document.getElementById("book-modal");
        const bookId = infoModal.getAttribute('data-current-id');
        const noteText = noteTextArea ? noteTextArea.value : "";

        try {
            const res = await fetch('/save_book_note', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ book_id: bookId, note: noteText })
            });

            if (res.ok) {
                alert("Заметка сохранена!");
                // Опционально: скрываем после сохранения
                notesSection.classList.add('hidden');
                notesBtn.classList.remove('active');
            }
        } catch (err) {
            console.error("Ошибка сохранения заметки:", err);
        }
    };
}