// Cards
const defaultCards = [
    { question: "What does HTML stand for?", answer: "HyperText Markup Language" },
    { question: "What does CSS stand for?", answer: "Cascading Style Sheets" },
    { question: "What keyword declares a constant in JS?", answer: "const" }
];

function loadCards() {
    try {
        const saved = JSON.parse(localStorage.getItem('cards'));
        return Array.isArray(saved) ? saved : defaultCards;
    } catch {
        return defaultCards;
    }
}

function saveCards() {
    localStorage.setItem('cards', JSON.stringify(cards));
}

let cards = loadCards();
let current = 0;
let showingAnswer = false;
let animating = false;

// Getting the element thingies
const flipCard = document.getElementById('flashcard');
const frontText = document.getElementById('front-text');
const backText = document.getElementById('back-text');
const counter = document.getElementById('counter');
const questionInput = document.getElementById('question');
const answerInput = document.getElementById('answer');
const errorMsg = document.getElementById('error');
const cardList = document.getElementById('card-list');
const deck = document.getElementById('deck');
const nextText = document.getElementById('next-text');

// mnavigation
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// study page here
function renderStudy() {
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


function move(step) {
    if (cards.length === 0 || animating) return;

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
        // PREVIOUS: the earlier card flies back in from the left
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
    if (cards.length === 0) return;
    showingAnswer = !showingAnswer;
    renderStudy();
}

// page manegerment
function renderList() {
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

function addCard() {
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
    cards.splice(index, 1);
    saveCards();
    renderList();
}

// listen closely here
document.getElementById('view-btn').addEventListener('click', () => { showPage('study'); renderStudy(); });
document.getElementById('manage-btn').addEventListener('click', () => { showPage('manage'); renderList(); });
document.getElementById('back-btn').addEventListener('click', () => showPage('home'));
document.getElementById('manage-back-btn').addEventListener('click', () => showPage('home'));
document.getElementById('next').addEventListener('click', () => move(1));
document.getElementById('prev').addEventListener('click', () => move(-1));
document.getElementById('flip').addEventListener('click', flip);
document.getElementById('flashcard').addEventListener('click', flip);
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