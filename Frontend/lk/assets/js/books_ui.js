// books_ui.js
import { openModal } from './modals.js';

export function openFullBookModal(element) {
    const card = element.closest('.profile-book-card');
    if (!card) return;

    const infoModal = document.getElementById("book-modal");
    infoModal.setAttribute('data-current-id', card.getAttribute('data-id'));
    infoModal.setAttribute('data-file-url', card.getAttribute('data-file'));

    document.getElementById("modal-name").textContent = card.querySelector('h3').textContent;
    document.getElementById("modal-description").textContent = card.querySelector('.p-desc').textContent;
    document.getElementById("modal-pages").textContent = card.getAttribute('data-pages') || "—";
    document.getElementById("modal-year").textContent = card.getAttribute('data-year') || "----";

    infoModal.querySelector(".modal-author").textContent = card.querySelector('.p-author').textContent;
    infoModal.querySelector(".book-cover-img").src = card.querySelector('.book-cover-img').src;
    infoModal.querySelector(".tag").textContent = card.getAttribute('data-genre') || "Книга";

    openModal(infoModal);
}

export function renderBooks(books, container) {
    if (!container) return;
    container.innerHTML = books.map(book => `
        <div class="profile-book-card" 
             data-id="${book.id}" 
             data-pages="${book.pages}" 
             data-year="${book.release_year}" 
             data-genre="${book.genre}" 
             data-file="${book.file_url}">
            <div class="book-visual"><div class="css-book-shape"><img src="${book.cover_url}" class="book-cover-img"></div></div>
            <div class="p-book-info">
                <h3>${book.title}</h3>
                <p class="p-author">${book.author_name}</p>
                <p class="p-desc">${book.description}</p>
                <a href="#" class="btn-read-more" onclick="openFullBookModal(this); return false;">Подробнее</a>
            </div>
        </div>`).join('');
}

export function renderPagination(total, current, container, callback) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 1; i <= total; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === current ? 'active' : ''}`;
        btn.textContent = i;
        btn.onclick = () => callback(i);
        container.appendChild(btn);
    }
}

export function initSearch(input) {
    if (!input) return;
    input.oninput = (e) => {
        const val = e.target.value.toLowerCase();
        document.querySelectorAll('.profile-book-card').forEach(card => {
            const text = card.innerText.toLowerCase();
            card.style.display = text.includes(val) ? '' : 'none';
        });
    };
}