/* ============================
   StudySpark — App Logic
   ============================ */

// ---- State ----
let currentNotes = '';
let flashcards = [];
let currentCardIndex = 0;
let cardDifficulty = {};
let quizData = [];
let quizAnswers = {};
let quizSubmitted = false;
let cardsStudied = parseInt(localStorage.getItem('studyspark_cards') || '0');
let streak = parseInt(localStorage.getItem('studyspark_streak') || '0');

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
    
    initNavigation();
    updateStats();
    
    // Character count
    const textarea = document.getElementById('notes-input');
    textarea.addEventListener('input', () => {
        const count = textarea.value.length;
        document.getElementById('char-count').textContent = `${count.toLocaleString()} characters`;
    });

    // Enter key for explain
    document.getElementById('concept-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') explainConcept();
    });
});

// ---- Particles ----
function initParticles() {
    const container = document.getElementById('particles');
    const colors = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b'];
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        const size = Math.random() * 6 + 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            left: ${Math.random() * 100}%;
            animation-duration: ${Math.random() * 20 + 15}s;
            animation-delay: ${Math.random() * 10}s;
        `;
        container.appendChild(particle);
    }
}

// ---- Navigation ----
function initNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            navigateTo(section);
        });
    });
}

function navigateTo(sectionId) {
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeLink) activeLink.classList.add('active');
    
    // Update sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(`section-${sectionId}`);
    if (section) section.classList.add('active');
}

// ---- Stats ----
function updateStats() {
    
    document.getElementById('cards-studied').textContent = cardsStudied;
}

function incrementCards() {
    cardsStudied++;
    localStorage.setItem('studyspark_cards', cardsStudied);
    updateStats();
}

// ---- Loading ----
function showLoading(text = 'Generating with Gemma AI...') {
    document.getElementById('loading-text').textContent = text;
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

// ---- Toast ----
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// ---- API Calls ----
async function apiCall(endpoint, data) {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Something went wrong');
    return result;
}

// ============================
// FLASHCARDS
// ============================
async function generateFlashcards() {
    const notes = document.getElementById('notes-input').value.trim();
    if (!notes) {
        showToast('Please paste your notes first!', 'error');
        return;
    }
    
    currentNotes = notes;
    showLoading('Creating flashcards from your notes...');
    
    try {
        const result = await apiCall('/api/generate-flashcards', { notes, num_cards: 10 });
        flashcards = result.flashcards;
        currentCardIndex = 0;
        cardDifficulty = {};
        renderFlashcard();
        navigateTo('flashcards');
        showToast(`${flashcards.length} flashcards created! ⚡`, 'success');
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
    } finally {
        hideLoading();
    }
}

function renderFlashcard() {
    const container = document.getElementById('flashcards-container');
    const controls = document.getElementById('flashcard-controls');
    const empty = document.getElementById('flashcards-empty');
    
    if (flashcards.length === 0) {
        empty.classList.remove('hidden');
        controls.classList.add('hidden');
        return;
    }
    
    empty.classList.add('hidden');
    controls.classList.remove('hidden');
    
    const card = flashcards[currentCardIndex];
    const difficulty = cardDifficulty[currentCardIndex] || '';
    
    container.innerHTML = `
        <div class="flashcard-wrapper" onclick="flipCard()">
            <div class="flashcard" id="current-flashcard">
                <div class="flashcard-face flashcard-front">
                    <p class="flashcard-text">${escapeHtml(card.front)}</p>
                    <p class="flashcard-hint">Click to reveal answer</p>
                </div>
                <div class="flashcard-face flashcard-back">
                    <p class="flashcard-text">${escapeHtml(card.back)}</p>
                    <p class="flashcard-hint">Click to see question</p>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('card-current').textContent = currentCardIndex + 1;
    document.getElementById('card-total').textContent = flashcards.length;
}

function flipCard() {
    const card = document.getElementById('current-flashcard');
    if (card) card.classList.toggle('flipped');
}

function nextCard() {
    if (currentCardIndex < flashcards.length - 1) {
        currentCardIndex++;
        renderFlashcard();
        incrementCards();
    }
}

function prevCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        renderFlashcard();
    }
}

function markCard(difficulty) {
    cardDifficulty[currentCardIndex] = difficulty;
    
    const colors = { hard: '#ef4444', medium: '#f59e0b', easy: '#10b981' };
    const emojis = { hard: '😓', medium: '🤔', easy: '✅' };
    showToast(`Marked as ${difficulty} ${emojis[difficulty]}`, 'info');
    
    incrementCards();
    
    if (currentCardIndex < flashcards.length - 1) {
        setTimeout(() => nextCard(), 300);
    } else {
        showToast('🎉 You finished all cards! Great job!', 'success');
        // Update streak
        updateStats();
    }
}

function shuffleCards() {
    flashcards = flashcards.sort(() => Math.random() - 0.5);
    currentCardIndex = 0;
    cardDifficulty = {};
    renderFlashcard();
    showToast('Cards shuffled! 🔀', 'info');
}

// ============================
// QUIZ
// ============================
async function generateQuiz() {
    const notes = document.getElementById('notes-input').value.trim();
    if (!notes) {
        showToast('Please paste your notes first!', 'error');
        return;
    }
    
    currentNotes = notes;
    showLoading('Creating quiz questions...');
    
    try {
        const result = await apiCall('/api/generate-quiz', { notes, num_questions: 5 });
        quizData = result.quiz;
        quizAnswers = {};
        quizSubmitted = false;
        renderQuiz();
        navigateTo('quiz');
        showToast(`${quizData.length} questions ready! 🧠`, 'success');
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
    } finally {
        hideLoading();
    }
}

function renderQuiz() {
    const container = document.getElementById('quiz-container');
    const empty = document.getElementById('quiz-empty');
    const results = document.getElementById('quiz-results');
    
    if (quizData.length === 0) {
        empty.classList.remove('hidden');
        results.classList.add('hidden');
        return;
    }
    
    empty.classList.add('hidden');
    results.classList.add('hidden');
    
    let html = '';
    quizData.forEach((q, qIndex) => {
        html += `
            <div class="quiz-question-card" id="quiz-q-${qIndex}">
                <div class="quiz-question-number">Question ${qIndex + 1} of ${quizData.length}</div>
                <div class="quiz-question-text">${escapeHtml(q.question)}</div>
                <div class="quiz-options">
                    ${q.options.map((opt, oIndex) => `
                        <div class="quiz-option ${quizAnswers[qIndex] === oIndex ? 'selected' : ''} ${quizSubmitted && oIndex === q.correct ? 'correct' : ''} ${quizSubmitted && quizAnswers[qIndex] === oIndex && oIndex !== q.correct ? 'incorrect' : ''}" 
                             onclick="selectOption(${qIndex}, ${oIndex})"
                             id="quiz-opt-${qIndex}-${oIndex}">
                            <div class="quiz-option-marker">${String.fromCharCode(65 + oIndex)}</div>
                            <span>${escapeHtml(opt)}</span>
                        </div>
                    `).join('')}
                </div>
                ${quizSubmitted ? `<div class="quiz-explanation">💡 ${escapeHtml(q.explanation)}</div>` : ''}
            </div>
        `;
    });
    
    if (!quizSubmitted) {
        html += `
            <div class="quiz-submit-area">
                <button class="btn btn-primary" onclick="submitQuiz()" id="btn-submit-quiz">
                    ✅ Submit Answers
                </button>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function selectOption(qIndex, oIndex) {
    if (quizSubmitted) return;
    quizAnswers[qIndex] = oIndex;
    renderQuiz();
}

function submitQuiz() {
    // Check all answered
    if (Object.keys(quizAnswers).length < quizData.length) {
        showToast('Please answer all questions first!', 'error');
        return;
    }
    
    quizSubmitted = true;
    
    let correct = 0;
    quizData.forEach((q, i) => {
        if (quizAnswers[i] === q.correct) correct++;
    });
    
    const score = Math.round((correct / quizData.length) * 100);
    
    renderQuiz();
    
    // Show results
    const results = document.getElementById('quiz-results');
    results.classList.remove('hidden');
    
    document.getElementById('results-score').textContent = `${score}%`;
    
    let message = '';
    if (score === 100) message = '🎉 Perfect score! You really know this!';
    else if (score >= 80) message = '🌟 Great job! Almost there!';
    else if (score >= 60) message = '👍 Good effort! Review the explanations.';
    else if (score >= 40) message = '📚 Keep studying! You\'re getting there.';
    else message = '💪 Don\'t give up! Review your notes and try again.';
    
    document.getElementById('results-message').textContent = message;
    document.getElementById('results-breakdown').innerHTML = `
        <div class="result-stat">
            <div class="result-stat-value" style="color: var(--success)">${correct}</div>
            <div class="result-stat-label">Correct</div>
        </div>
        <div class="result-stat">
            <div class="result-stat-value" style="color: var(--danger)">${quizData.length - correct}</div>
            <div class="result-stat-label">Incorrect</div>
        </div>
        <div class="result-stat">
            <div class="result-stat-value" style="color: var(--accent-secondary)">${quizData.length}</div>
            <div class="result-stat-label">Total</div>
        </div>
    `;
    
    // Update streak on good scores
    if (score >= 60) {
        updateStats();
    }
    
    // Scroll to results
    results.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function retakeQuiz() {
    quizAnswers = {};
    quizSubmitted = false;
    renderQuiz();
    document.getElementById('quiz-results').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================
// SUMMARY
// ============================
async function generateSummary() {
    const notes = document.getElementById('notes-input').value.trim();
    if (!notes) {
        showToast('Please paste your notes first!', 'error');
        return;
    }
    
    currentNotes = notes;
    showLoading('Summarizing your notes...');
    
    try {
        const result = await apiCall('/api/generate-summary', { notes });
        renderSummary(result.summary);
        navigateTo('summary');
        showToast('Summary ready! 📋', 'success');
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
    } finally {
        hideLoading();
    }
}

function renderSummary(summary) {
    const container = document.getElementById('summary-container');
    const empty = document.getElementById('summary-empty');
    
    empty.classList.add('hidden');
    
    let html = `<div class="summary-content">`;
    html += `<h2 class="summary-title">${escapeHtml(summary.title)}</h2>`;
    
    // Sections
    if (summary.sections) {
        summary.sections.forEach(section => {
            html += `
                <div class="summary-section">
                    <h3>${escapeHtml(section.heading)}</h3>
                    <ul class="summary-points">
                        ${section.points.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
                    </ul>
                </div>
            `;
        });
    }
    
    // Key terms
    if (summary.key_terms && summary.key_terms.length > 0) {
        html += `<h3 style="margin-top: 2rem; margin-bottom: 1rem; font-size: 1.2rem;">📖 Key Terms</h3>`;
        html += `<div class="key-terms-grid">`;
        summary.key_terms.forEach(term => {
            html += `
                <div class="key-term-card">
                    <div class="key-term-word">${escapeHtml(term.term)}</div>
                    <div class="key-term-def">${escapeHtml(term.definition)}</div>
                </div>
            `;
        });
        html += `</div>`;
    }
    
    html += `</div>`;
    container.innerHTML = html;
}

// ============================
// EXPLAIN
// ============================
async function explainConcept() {
    const concept = document.getElementById('concept-input').value.trim();
    if (!concept) {
        showToast('Please type a concept to explain!', 'error');
        return;
    }
    
    showLoading(`Explaining "${concept}"...`);
    
    try {
        const result = await apiCall('/api/explain', {
            concept,
            context: currentNotes
        });
        
        const exp = result.explanation;
        document.getElementById('explain-text').textContent = exp.explanation;
        document.getElementById('explain-analogy').textContent = exp.analogy;
        document.getElementById('explain-example').textContent = exp.example;
        document.getElementById('explain-tip').textContent = exp.tip;
        document.getElementById('explanation-result').classList.remove('hidden');
        
        showToast('Here you go! 💡', 'success');
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// ============================
// UTILS
// ============================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    const activeSection = document.querySelector('.section.active');
    if (!activeSection) return;
    
    if (activeSection.id === 'section-flashcards' && flashcards.length > 0) {
        if (e.key === 'ArrowRight' || e.key === 'd') nextCard();
        if (e.key === 'ArrowLeft' || e.key === 'a') prevCard();
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flipCard(); }
        if (e.key === '1') markCard('hard');
        if (e.key === '2') markCard('medium');
        if (e.key === '3') markCard('easy');
    }
});
