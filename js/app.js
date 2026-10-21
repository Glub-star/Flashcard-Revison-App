const defaultCards = [
    { question: "What does HTML stand for?", answer: "HyperText Markup Language" },
    { question: "What does CSS stand for?", answer: "Cascading Style Sheets" },
    { question: "What keyword declares a constant in JS?", answer: "const" }
];

function loadPacks() {
    try {
        const savedPacks = JSON.parse(localStorage.getItem('packs'));
        if (Array.isArray(savedPacks)) return savedPacks;

        const oldCards = JSON.parse(localStorage.getItem('cards'));
        const cards = Array.isArray(oldCards) ? oldCards : defaultCards;
        return [{ id: Date.now(), name: 'My Cards', cards }];

    } catch {
        return [{ id: Date.now(), name: 'My Cards', cards: defaultCards }];
    }
}

function saveCards() {
     localStorage.setItem('packs', JSON.stringify(packs));
}

function createPack(name) {
    const pack = { id: Date.now(), name, cards: [] };
    packs.push(pack);
    currentPackId = pack.id;
    saveCards();
    renderPacks();
    renderList();
}

function renderPacks() {
    packSelect.innerHTML = '';
    packs.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name} (${p.cards.length})`;
        packSelect.appendChild(opt);
    });
    packSelect.value = currentPackId;
}
function renderPackChoices() {
    const list = document.getElementById('pack-choices');
    list.innerHTML = '';
    packs.forEach(pack => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.textContent = `${pack.name} (${pack.cards.length})`;
        btn.addEventListener('click', () => startStudy(pack.id));
        li.appendChild(btn);
        list.appendChild(li);
    });
}

function getCurrentPack() {
    return packs.find(p => p.id === currentPackId);
}

function getCards() {
    return getCurrentPack().cards;
}

const flipHint = document.getElementById('flip-hint');
const SWIPE_MINIMUM = 20;
let startX = null;
let startY = null
let lastSwipeTime = 0;
let packs = loadPacks();
let currentPackId = null;
let current = 0;
let showingAnswer = false;
let animating = false;

// Getting the element thingies
const themeBtn = document.getElementById('themeToggle');
const flipCard = document.getElementById('flashcard');
const frontText = document.getElementById('front-text');
const backText = document.getElementById('back-text');
const counter = document.getElementById('counter');
const progressFill = document.getElementById('progress-fill');
const questionInput = document.getElementById('question');
const answerInput = document.getElementById('answer');
const errorMsg = document.getElementById('error');
const cardList = document.getElementById('card-list');
const deck = document.getElementById('deck');
const nextText = document.getElementById('next-text');
const packSelect = document.getElementById('pack-select');
const newPackName = document.getElementById('new-pack-name');

// mnavigation
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'manage') document.getElementById('new-pack').classList.add('active');
}

// study page here
function renderStudy() {
    const cards = getCards();
deck.classList.toggle('single', cards.length < 2);

    if (cards.length === 0) {
        frontText.textContent = "No cards yet. Add some in Manage cards!";
        backText.textContent = "";
        nextText.textContent = "";
        flipCard.classList.remove('flipped');
        counter.textContent = "0 / 0";
        return;
    }
    if (current >= cards.length) current = 0;

    frontText.textContent = cards[current].question;
    backText.textContent = cards[current].answer;
    nextText.textContent = cards[(current + 1) % cards.length].question;
    flipCard.classList.toggle('flipped', showingAnswer);
    counter.textContent = `${current + 1} / ${cards.length}`;
}

function startStudy(packId) {
    currentPackId = packId;
    current = 0;
    showingAnswer = false;
    showPage('study');
    renderStudy();
    updateProgress(current);
}

function updateProgress(index) {
    const cards = getCards();
    if (cards.length === 0) {
        counter.textContent = "0 / 0";
        progressFill.style.width = '0%';
        return;
    }
    counter.textContent = `${index + 1} / ${cards.length}`;
    progressFill.style.width = `${((index + 1) / cards.length) * 100}%`;
}

function move(step) {
    hideHint();
    const cards = getCards();
    if (cards.length === 0 || animating) return;

    const newIndex = (current + step + cards.length) % cards.length;
    updateProgress(newIndex);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (cards.length === 1 || reduceMotion) {
        current = (current + step + cards.length) % cards.length;
        showingAnswer = false;
        renderStudy();
        return;
    }

    animating = true;

    if (step > 0) {
        flipCard.classList.add('fly-left');
        deck.classList.add('advancing');

        setTimeout(() => {
            deck.classList.add('no-transition');
            flipCard.classList.remove('fly-left');
            deck.classList.remove('advancing');
            current = (current + 1) % cards.length;
            showingAnswer = false;
            renderStudy();
            void deck.offsetWidth;            
            deck.classList.remove('no-transition');
            animating = false;
        }, 400);

    } else {
        deck.classList.add('no-transition');
        current = (current - 1 + cards.length) % cards.length;
        showingAnswer = false;
        renderStudy();
        flipCard.classList.add('fly-left'); 
        void deck.offsetWidth;
        deck.classList.remove('no-transition');
        flipCard.classList.remove('fly-left');

        setTimeout(() => { animating = false; }, 400);
    }
}

function flip() {
    const cards = getCards();
    if (cards.length === 0) return;
    showingAnswer = !showingAnswer;
    renderStudy();
    hideHint();
}

// page manegerment
function hideHint() {
    if (flipHint.classList.contains('hidden')) return;
    flipHint.classList.add('hidden');
    try { localStorage.setItem('hintSeen', '1'); } catch {}
}

function renderList() {
    const cards = getCards();
    cardList.innerHTML = '';
    cards.forEach((card, index) => {
        const li = document.createElement('li');

        const text = document.createElement('span');
        text.textContent = card.question;  

        const del = document.createElement('button');
        del.textContent = 'Delete';
        del.setAttribute('aria-label', `Delete card: ${card.question}`);
        del.addEventListener('click', () => deleteCard(index));

        li.append(text, del);
        cardList.appendChild(li);
    });
}
function loadTheme() {
    try {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'light';
    } catch {}
    // nothing saved yet, so follow the device setting
    return window.matchMedia('(prefers-color-scheme: light)').matches;
}

function applyTheme(light) {
    document.body.classList.toggle('light-theme', light);
    themeBtn.textContent = light ? 'Dark mode' : 'Light mode';
}

function addCard() {
    const cards = getCards();
    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();

    if (!question || !answer) {
        errorMsg.textContent = "Please fill in both the question and the answer.";
        return;
    }

    cards.push({ question, answer });
    saveCards();
    questionInput.value = '';
    answerInput.value = '';
    errorMsg.textContent = '';
    renderList();
}

function deleteCard(index) {
    const cards = getCards();
    cards.splice(index, 1);
    saveCards();
    renderList();
}

// listen closely here
document.getElementById('manage-btn').addEventListener('click', () => {
    showPage('manage');
    renderPacks();
    renderList();
});
document.getElementById('back-btn').addEventListener('click', () => showPage('home'));
document.getElementById('manage-back-btn').addEventListener('click', () => showPage('home'));
document.getElementById('next').addEventListener('click', () => move(1));
document.getElementById('prev').addEventListener('click', () => move(-1));
document.getElementById('flip').addEventListener('click', flip);
document.getElementById('add-btn').addEventListener('click', addCard);
flipCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        flip();
    }
});
document.addEventListener('keydown', (e) => {
    if (!document.getElementById('study').classList.contains('active')) return;
    if (e.key === 'ArrowRight') move(1);
    if (e.key === 'ArrowLeft') move(-1);
});
flipCard.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
});
flipCard.addEventListener('pointerup', (e) =>
{
    if (startX === null) return;
    const dx = e.clientX -startX;
    const dy = e.clientY - startY;
    console.log("movment on card found, ${dx} , ${dy}");
    startX = startY = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MINIMUM) return;
    lastSwipeTime = Date.now()

    if (Math.abs(dx) > Math.abs(dy)){
        move (dx < 0 ? 1 : -1);
    }
    else{
        flip();
    }
});

flipCard.addEventListener('pointercancel', () => {
    startX = startY = null;
});
flipCard.addEventListener('click', () => {
    if (Date.now() - lastSwipeTime < 400) return; // ignore the click that follows a swipe
    flip();
});
themeBtn.addEventListener('click', () => {
    const light = !document.body.classList.contains('light-theme');
    applyTheme(light);
    try {
        localStorage.setItem('theme', light ? 'light' : 'dark');
    } catch {}
});
packSelect.addEventListener('change', () => {
    currentPackId = Number(packSelect.value);
    current = 0;
    showingAnswer = false;
    renderList();
});
document.getElementById('add-pack-btn').addEventListener('click', () => {
    const name = newPackName.value.trim();
    if (!name) return;
    createPack(name);
    newPackName.value = '';
    showPage('manage');
});
document.getElementById('view-btn').addEventListener('click', () => {
    renderPackChoices();
    showPage('pack-picker');
});
document.getElementById('picker-back-btn').addEventListener('click', () => showPage('home'));


applyTheme(loadTheme());
try {
    if (localStorage.getItem('hintSeen')) flipHint.classList.add('hidden');
} catch {}
currentPackId = packs[0].id;
renderPacks();