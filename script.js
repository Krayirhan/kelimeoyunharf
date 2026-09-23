const ANSWERS = window.HARFANE_ANSWERS;
const VALID_WORDS = new Set(window.HARFANE_WORDS);

const KEY_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'ı', 'o', 'p', 'ğ', 'ü'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ş', 'i'],
  ['enter', 'z', 'c', 'v', 'b', 'n', 'm', 'ö', 'ç', 'backspace']
];
const MAX_TRIES = 6;
const WORD_LENGTH = 5;
const STORAGE_KEY = 'harfane-state-v1';
const STATS_STORAGE_KEY = 'harfane-stats-v1';

const state = {
  mode: 'home', answer: '', guesses: [], current: '', gameOver: false, won: false,
  seriesLevel: 1, seriesWins: 0, seriesBest: 0,
  keyStates: {}, user: null,
  stats: { played: 0, wins: 0, streak: 0, best: 0, distribution: [0, 0, 0, 0, 0, 0] }
};

const board = document.querySelector('#board');
const keyboard = document.querySelector('#keyboard');
const message = document.querySelector('#message');
const shareButton = document.querySelector('#share-button');
const toast = document.querySelector('#toast');
const authButton = document.querySelector('#auth-button');
const homeAuthButton = document.querySelector('#home-auth-button');
const homeAccountLabel = document.querySelector('#home-account-label');
const homeScreen = document.querySelector('#home-screen');
const gameScreen = document.querySelector('#game-screen');
const modeLabel = document.querySelector('#mode-label');
const nextLevelButton = document.querySelector('#next-level-button');
let firebaseBridge = null;
let authMode = 'signin';

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function puzzleNumber() {
  const start = new Date(2024, 0, 1);
  const today = new Date();
  start.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0);
  return Math.max(1, Math.floor((today - start) / 86400000) + 1);
}

function progressDocumentId(mode) {
  return mode === 'daily' ? `daily-${todayKey()}` : mode;
}

function answerForMode(mode) {
  if (mode === 'daily') return ANSWERS[(puzzleNumber() - 1) % ANSWERS.length];
  if (mode === 'series') return ANSWERS[(state.seriesLevel - 1) % ANSWERS.length];
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
}

function loadState() {
  const stats = JSON.parse(localStorage.getItem(STATS_STORAGE_KEY) || 'null');
  const progress = JSON.parse(localStorage.getItem(`${STORAGE_KEY}-series-progress`) || 'null');
  state.stats = normalizeStats(stats || state.stats);
  state.seriesLevel = progress?.level || 1;
  state.seriesWins = progress?.wins || 0;
  state.seriesBest = progress?.best || 0;
}

function saveState() {
  localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(state.stats));
  localStorage.setItem(`${STORAGE_KEY}-series-progress`, JSON.stringify({
    level: state.seriesLevel, wins: state.seriesWins, best: state.seriesBest
  }));
  if (state.mode !== 'home') localStorage.setItem(`${STORAGE_KEY}-${state.mode}`, JSON.stringify({
    date: todayKey(), answer: state.answer, guesses: state.guesses, current: state.current,
    gameOver: state.gameOver, won: state.won, keyStates: state.keyStates, level: state.seriesLevel
  }));
}

function normalizeStats(stats = {}) {
  return {
    played: Number(stats.played) || 0,
    wins: Number(stats.wins) || 0,
    streak: Number(stats.streak) || 0,
    best: Number(stats.best) || 0,
    distribution: Array.isArray(stats.distribution) && stats.distribution.length === 6
      ? stats.distribution.map(value => Number(value) || 0)
      : [0, 0, 0, 0, 0, 0]
  };
}

function restoreCloudData(data, mode = state.mode) {
  if (data.profile?.stats?.played != null) state.stats = normalizeStats(data.profile.stats);
  if (mode === 'series' && data.game?.level) {
    state.seriesLevel = Number(data.game.level) || state.seriesLevel;
    state.seriesWins = Number(data.game.seriesWins) || state.seriesWins;
    state.seriesBest = Number(data.game.seriesBest) || state.seriesBest;
  }
  if (data.game && (mode !== 'daily' || data.game.date === todayKey())) {
    state.answer = mode === 'series' ? answerForMode('series') : state.answer;
    state.guesses = Array.isArray(data.game.guesses) ? data.game.guesses : [];
    state.gameOver = Boolean(data.game.gameOver ?? (data.game.won != null));
    state.won = Boolean(data.game.won);
    state.current = '';
    state.keyStates = {};
    state.guesses.forEach(guess => [...guess].forEach((letter, index) => updateKeyState(letter, scoreGuess(guess)[index])));
  }
  shareButton.disabled = !state.gameOver;
  if (mode === 'series') {
    nextLevelButton.textContent = state.won ? 'Sonraki level ↗' : 'Leveli tekrar dene ↗';
    nextLevelButton.classList.toggle('hidden', !state.gameOver);
    document.querySelector('#puzzle-number').textContent = `LEVEL ${String(state.seriesLevel).padStart(2, '0')}`;
  }
  document.querySelector('#streak-value').textContent = mode === 'series' ? state.seriesWins : state.stats.streak;
  renderBoard(); renderKeyboard(); saveState();
}

function syncCloudGame() {
  if (!firebaseBridge || !state.user) return;
  firebaseBridge.saveGame(state.user, progressDocumentId(state.mode), {
    mode: state.mode, level: state.seriesLevel, seriesWins: state.seriesWins, seriesBest: state.seriesBest,
    puzzleNumber: puzzleNumber(), guesses: state.guesses,
    gameOver: state.gameOver, won: state.won
  }, state.stats).catch(() => showToast('Bulut kaydı yapılamadı.'));
}

async function loadCloudMode(mode) {
  if (!firebaseBridge || !state.user) return;
  try {
    const data = await firebaseBridge.loadUserData(state.user, progressDocumentId(mode));
    restoreCloudData(data, mode);
  } catch {
    showToast('Bulut ilerlemesi okunamadı.');
  }
}

function buildBoard() {
  board.innerHTML = '';
  for (let row = 0; row < MAX_TRIES; row += 1) {
    for (let col = 0; col < WORD_LENGTH; col += 1) {
      const tile = document.createElement('div');
      tile.className = 'tile'; tile.dataset.row = row; tile.dataset.col = col;
      tile.setAttribute('aria-label', `${row + 1}. satır ${col + 1}. harf`);
      board.appendChild(tile);
    }
  }
  renderBoard();
}

function renderBoard() {
  [...board.children].forEach(tile => {
    const row = Number(tile.dataset.row); const col = Number(tile.dataset.col);
    const guess = state.guesses[row];
    let letter = guess?.[col] || (row === state.guesses.length ? state.current[col] || '' : '');
    tile.textContent = letter.toLocaleUpperCase('tr-TR');
    tile.className = `tile${letter ? ' filled' : ''}`;
    if (!guess && row === state.guesses.length && state.invalidGuess) tile.classList.add('invalid');
    if (guess) tile.classList.add(scoreGuess(guess)[col]);
  });
}

function scoreGuess(guess) {
  const result = Array(WORD_LENGTH).fill('absent');
  const remaining = {};
  [...state.answer].forEach(letter => { remaining[letter] = (remaining[letter] || 0) + 1; });
  [...guess].forEach((letter, index) => {
    if (letter === [...state.answer][index]) { result[index] = 'correct'; remaining[letter] -= 1; }
  });
  [...guess].forEach((letter, index) => {
    if (result[index] === 'correct') return;
    if (remaining[letter] > 0) { result[index] = 'present'; remaining[letter] -= 1; }
  });
  return result;
}

function renderKeyboard() {
  keyboard.innerHTML = '';
  KEY_ROWS.forEach(row => row.forEach(key => {
    const button = document.createElement('button');
    button.className = `key${key.length > 1 ? ' wide' : ''}${state.keyStates[key] ? ` ${state.keyStates[key]}` : ''}`;
    button.dataset.key = key;
    button.textContent = key === 'backspace' ? '⌫' : key === 'enter' ? 'GÖNDER' : key;
    button.setAttribute('aria-label', key === 'backspace' ? 'Sil' : key === 'enter' ? 'Tahmini gönder' : key);
    button.addEventListener('click', () => handleKey(key));
    keyboard.appendChild(button);
  }));
}

function startMode(mode) {
  state.mode = mode;
  state.answer = answerForMode(mode);
  const saved = JSON.parse(localStorage.getItem(`${STORAGE_KEY}-${mode}`) || 'null');
  const validSavedGame = saved && (mode !== 'daily' || saved.date === todayKey()) && saved.answer === state.answer;
  state.guesses = validSavedGame ? saved.guesses || [] : [];
  state.current = validSavedGame ? saved.current || '' : '';
  state.gameOver = validSavedGame ? Boolean(saved.gameOver) : false;
  state.won = validSavedGame ? Boolean(saved.won) : false;
  state.keyStates = validSavedGame ? saved.keyStates || {} : {};
  homeScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  modeLabel.textContent = mode === 'daily' ? 'GÜNÜN KAYDI' : mode === 'series' ? 'SERİ OYUN' : 'ANTRENMAN';
  document.querySelector('#puzzle-number').textContent = mode === 'daily'
    ? `#${String(puzzleNumber()).padStart(3, '0')}`
    : mode === 'series' ? `LEVEL ${String(state.seriesLevel).padStart(2, '0')}` : '∞';
  nextLevelButton.classList.toggle('hidden', !(mode === 'series' && state.gameOver && state.won));
  if (mode === 'series' && state.gameOver) nextLevelButton.textContent = state.won ? 'Sonraki level ↗' : 'Leveli tekrar dene ↗';
  shareButton.disabled = !state.gameOver;
  document.querySelector('#streak-value').textContent = mode === 'series' ? state.seriesWins : state.stats.streak;
  renderBoard(); renderKeyboard(); saveState();
  loadCloudMode(mode);
}

function returnHome() {
  state.mode = 'home';
  homeScreen.classList.remove('hidden');
  gameScreen.classList.add('hidden');
  saveState();
}

function advanceSeries() {
  if (state.mode !== 'series' || !state.gameOver) return;
  if (state.won) {
    state.seriesLevel += 1;
    state.seriesWins += 1;
    state.seriesBest = Math.max(state.seriesBest, state.seriesWins);
  }
  state.answer = answerForMode('series');
  state.guesses = []; state.current = ''; state.gameOver = false; state.won = false; state.keyStates = {};
  nextLevelButton.classList.add('hidden');
  document.querySelector('#puzzle-number').textContent = `LEVEL ${String(state.seriesLevel).padStart(2, '0')}`;
  document.querySelector('#streak-value').textContent = state.seriesWins;
  shareButton.disabled = true;
  renderBoard(); renderKeyboard(); saveState();
  syncCloudGame();
}

function handleKey(key) {
  if (state.gameOver) return;
  state.invalidGuess = false;
  message.classList.remove('error');
  if (key === 'backspace') state.current = [...state.current].slice(0, -1).join('');
  else if (key === 'enter') submitGuess();
  else if ([...state.current].length < WORD_LENGTH) state.current += key;
  renderBoard(); renderKeyboard(); saveState();
}

function submitGuess() {
  const guess = state.current.toLocaleLowerCase('tr-TR');
  if ([...guess].length !== WORD_LENGTH) return showMessage('Beş harfli bir kelime yazmalısın.', 'error');
  if (!VALID_WORDS.has(guess)) {
    state.invalidGuess = true;
    showMessage('Böyle bir kelime yok.', 'error');
    return;
  }
  state.guesses.push(guess); state.current = '';
  const result = scoreGuess(guess);
  [...guess].forEach((letter, index) => updateKeyState(letter, result[index]));
  if (guess === state.answer) finishGame(true); else if (state.guesses.length === MAX_TRIES) finishGame(false);
  renderBoard(); renderKeyboard(); saveState();
}

const priority = { absent: 0, present: 1, correct: 2 };
function updateKeyState(letter, status) {
  if (!state.keyStates[letter] || priority[status] > priority[state.keyStates[letter]]) state.keyStates[letter] = status;
}

function finishGame(won) {
  state.gameOver = true; state.won = won; state.stats.played += 1;
  if (won) {
    const attempts = state.guesses.length;
    state.stats.wins += 1; state.stats.streak += 1; state.stats.best = Math.max(state.stats.best, state.stats.streak);
    state.stats.distribution[attempts - 1] += 1;
    showMessage(state.mode === 'series' ? `Level ${state.seriesLevel} tamamlandı.` : `${attempts} denemede buldun. Harika!`);
  } else {
    state.stats.streak = 0; showMessage(`Bugünün kelimesi: ${state.answer.toLocaleUpperCase('tr-TR')}`);
  }
  if (state.mode === 'series') {
    nextLevelButton.textContent = state.won ? 'Sonraki level ↗' : 'Leveli tekrar dene ↗';
    nextLevelButton.classList.remove('hidden');
  }
  shareButton.disabled = false; saveState(); syncCloudGame();
}

function showMessage(text, variant = '') {
  message.textContent = text;
  message.classList.toggle('error', variant === 'error');
  message.classList.remove('message-pulse'); void message.offsetWidth; message.classList.add('message-pulse');
}

function showToast(text) {
  toast.textContent = text; toast.classList.add('show');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function closeModal() {
  document.querySelector('#modal-backdrop').classList.add('hidden');
}

function authErrorMessage(error) {
  const messages = {
    'auth/email-already-in-use': 'Bu e-posta zaten kayıtlı.',
    'auth/invalid-credential': 'E-posta veya şifre hatalı.',
    'auth/invalid-email': 'Geçerli bir e-posta yaz.',
    'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
    'auth/network-request-failed': 'İnternet bağlantını kontrol et.'
  };
  return messages[error.code] || 'İşlem tamamlanamadı. Lütfen tekrar dene.';
}

function openAuthModal(mode = authMode) {
  authMode = mode;
  openModal('auth');
}

function openModal(type) {
  const content = document.querySelector('#modal-content');
  if (type === 'help') {
    content.innerHTML = `<h2 id="modal-title">Nasıl oynanır?</h2><p>Günün beş harfli kelimesini altı denemede bulmaya çalış. Her tahmininden sonra renkler sana yol gösterecek.</p><ul class="rules"><li><span class="rule-tile green">A</span> Yeşil harf doğru yerde.</li><li><span class="rule-tile yellow">R</span> Sarı harf kelimede var, yeri yanlış.</li><li><span class="rule-tile gray">T</span> Gri harf kelimede yok.</li></ul><p>Her gün yeni bir kelime. İyi şanslar!</p>`;
  } else if (type === 'auth') {
    const isSignUp = authMode === 'signup';
    content.innerHTML = `<h2 id="modal-title">${isSignUp ? 'Hesap oluştur' : 'Tekrar hoş geldin'}</h2><p>${isSignUp ? 'Serini ve oyun geçmişini cihazlar arasında sakla.' : 'Hesabına giriş yap, kaldığın yerden devam et.'}</p><form class="auth-form" id="auth-form">${isSignUp ? '<label>Kullanıcı adı<input id="auth-name" type="text" maxlength="30" autocomplete="name" required /></label>' : ''}<label>E-posta<input id="auth-email" type="email" autocomplete="email" required /></label><label>Şifre<input id="auth-password" type="password" minlength="6" autocomplete="current-password" required /></label><button class="auth-submit" type="submit">${isSignUp ? 'Kayıt ol' : 'Giriş yap'}</button></form><p class="auth-error" id="auth-error"></p><button class="auth-switch" id="auth-switch" type="button">${isSignUp ? 'Zaten hesabın var mı? Giriş yap' : 'Hesabın yok mu? Kayıt ol'}</button>`;
    document.querySelector('#auth-form').addEventListener('submit', async event => {
      event.preventDefault();
      const errorElement = document.querySelector('#auth-error');
      if (!firebaseBridge) { errorElement.textContent = 'Firebase hazırlanıyor, birazdan tekrar dene.'; return; }
      const email = document.querySelector('#auth-email').value.trim();
      const password = document.querySelector('#auth-password').value;
      const name = document.querySelector('#auth-name')?.value.trim() || '';
      const submit = document.querySelector('.auth-submit');
      submit.disabled = true; errorElement.textContent = '';
      try {
        if (isSignUp) await firebaseBridge.signUp(email, password, name);
        else await firebaseBridge.signIn(email, password);
        closeModal(); showToast(isSignUp ? 'Hesabın oluşturuldu.' : 'Giriş yapıldı.');
      } catch (error) {
        errorElement.textContent = authErrorMessage(error); submit.disabled = false;
      }
    });
    document.querySelector('#auth-switch').addEventListener('click', () => openAuthModal(isSignUp ? 'signin' : 'signup'));
  } else {
    const winRate = state.stats.played ? Math.round((state.stats.wins / state.stats.played) * 100) : 0;
    const max = Math.max(1, ...state.stats.distribution);
    const rows = state.stats.distribution.map((count, i) => `<div class="distribution-row"><b>${i + 1}</b><span class="distribution-bar" style="width:${Math.max(9, (count / max) * 100)}%">${count}</span></div>`).join('');
    content.innerHTML = `<h2 id="modal-title">İstatistikler</h2><div class="stats-grid"><div class="stat"><strong>${state.stats.played}</strong><span>Oynanan</span></div><div class="stat"><strong>${winRate}%</strong><span>Kazanma</span></div><div class="stat"><strong>${state.stats.best}</strong><span>En iyi seri</span></div></div><h3>Deneme dağılımı</h3><div class="distribution">${rows}</div>`;
  }
  document.querySelector('#modal-backdrop').classList.remove('hidden');
}

function shareResult() {
  const score = state.guesses.map(guess => scoreGuess(guess).map(status => ({ correct: '🟩', present: '🟨', absent: '⬜' }[status])).join('')).join('\n');
  const result = `Harfane #${puzzleNumber()} ${state.won ? state.guesses.length : 'X'}/${MAX_TRIES}\n\n${score}`;
  if (navigator.clipboard) navigator.clipboard.writeText(result).then(() => showToast('Sonuç panoya kopyalandı.'));
  else showToast(result);
}

function updateCountdown() {
  const now = new Date(); const tomorrow = new Date(now); tomorrow.setHours(24, 0, 0, 0);
  const seconds = Math.max(0, Math.floor((tomorrow - now) / 1000));
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  document.querySelector('#countdown').textContent = `${h}:${m}:${s}`;
}

document.addEventListener('keydown', event => {
  if (typeof event.key !== 'string') return;
  if (event.key === 'Enter') handleKey('enter');
  else if (event.key === 'Backspace') handleKey('backspace');
  else {
    const key = event.key.toLocaleLowerCase('tr-TR');
    if (KEY_ROWS.flat().includes(key)) handleKey(key);
  }
});

document.querySelector('#help-button').addEventListener('click', () => openModal('help'));
document.querySelector('#stats-button').addEventListener('click', () => openModal('stats'));
document.querySelector('#modal-close').addEventListener('click', closeModal);
document.querySelector('#modal-backdrop').addEventListener('click', event => { if (event.target.id === 'modal-backdrop') closeModal(); });
document.querySelectorAll('.mode-card').forEach(card => card.addEventListener('click', () => startMode(card.dataset.mode)));
document.querySelector('#back-home-button').addEventListener('click', returnHome);
nextLevelButton.addEventListener('click', advanceSeries);
authButton.addEventListener('click', () => {
  if (state.user && firebaseBridge) firebaseBridge.signOut().catch(() => showToast('Çıkış yapılamadı.'));
  else openAuthModal();
});
homeAuthButton.addEventListener('click', () => {
  if (state.user && firebaseBridge) firebaseBridge.signOut().catch(() => showToast('Çıkış yapılamadı.'));
  else openAuthModal();
});
shareButton.addEventListener('click', shareResult);

function connectFirebase(bridge) {
  firebaseBridge = bridge;
  bridge.onAuthStateChanged(async user => {
    state.user = user;
    authButton.textContent = user ? 'Çıkış yap' : 'Giriş yap';
    authButton.title = user ? (user.email || 'Hesap') : 'Hesabına giriş yap';
    homeAuthButton.textContent = user ? 'Çıkış yap' : 'Giriş yap / kayıt ol';
    homeAccountLabel.textContent = user ? `${user.displayName || user.email} olarak giriş yapıldı.` : 'İlerlemeni kaydetmek için giriş yap.';
    if (!user) return;
    try {
      const data = await bridge.loadUserData(user, '__profile__');
      if (data.profile?.stats?.played != null) state.stats = normalizeStats(data.profile.stats);
      document.querySelector('#streak-value').textContent = state.mode === 'series' ? state.seriesWins : state.stats.streak;
      if (state.mode !== 'home') loadCloudMode(state.mode);
    } catch {
      showToast('Bulut hesabı okunamadı.');
    }
  });
}

window.addEventListener('firebase-ready', event => connectFirebase(event.detail));
if (window.firebaseBridge) connectFirebase(window.firebaseBridge);

loadState();
document.querySelector('#streak-value').textContent = state.stats.streak;
homeScreen.classList.remove('hidden');
gameScreen.classList.add('hidden');
buildBoard(); renderKeyboard(); updateCountdown();
setInterval(updateCountdown, 1000);
