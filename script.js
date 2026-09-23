const ANSWERS = [
  'araba', 'bahçe', 'badem', 'balık', 'bebek', 'çadır', 'çakıl', 'çanta', 'çiçek', 'çorap',
  'davet', 'değiş', 'deniz', 'dünya', 'ekmek', 'elmas', 'emlak', 'fikir', 'gizem', 'gölge',
  'güneş', 'haber', 'hafif', 'hamur', 'hayal', 'hedef', 'iklim', 'insan', 'kahve', 'kalem',
  'kapak', 'karar', 'kavun', 'kayık', 'kekik', 'kepek', 'kitap', 'kolye', 'köprü', 'kural',
  'kürek', 'limon', 'masal', 'meyve', 'mutlu', 'nehir', 'orman', 'pamuk', 'parça', 'perde',
  'resim', 'sabah', 'sahil', 'sarma', 'sepet', 'sınır', 'sokak', 'tahta', 'takım', 'tarak',
  'tavan', 'tepsi', 'topuz', 'tulum', 'vapur', 'yarın', 'yemek', 'yılan', 'zaman', 'zafer'
];

const EXTRA_WORDS = [
  'acemi', 'adres', 'akşam', 'altın', 'anlam', 'aslan', 'aşkın', 'avize', 'bilet', 'birim',
  'boyun', 'bölüm', 'bulut', 'çevre', 'çizgi', 'damar', 'diken', 'dilim', 'duman', 'durum',
  'düşün', 'eşya', 'fener', 'forma', 'fiyat', 'geçit', 'gelen', 'giriş', 'görev', 'gurur',
  'hızlı', 'incir', 'içerik', 'ilham', 'izmir', 'kablo', 'kader', 'kalın', 'kanat', 'karga',
  'kasım', 'katır', 'kayıt', 'keman', 'kemik', 'konak', 'konum', 'kokuş', 'koyun', 'kredi',
  'kumsal', 'leylek', 'makas', 'merak', 'model', 'moral', 'nehir', 'nokta', 'ocak', 'ödev',
  'ödül', 'ölçek', 'pasta', 'pilav', 'posta', 'radyo', 'renkli', 'sabır', 'sakin', 'sanat',
  'saray', 'sedef', 'sıcak', 'sınav', 'sofra', 'sözlük', 'tabak', 'tatlı', 'temiz', 'terzi',
  'toprak', 'umut', 'ünlü', 'uyarı', 'vergi', 'yapıt', 'yazar', 'yeten', 'yolcu', 'yürek'
].filter(word => [...word].length === 5);

const KEY_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'ı', 'o', 'p', 'ğ', 'ü'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ş', 'i'],
  ['enter', 'z', 'c', 'v', 'b', 'n', 'm', 'ö', 'ç', 'backspace']
];
const MAX_TRIES = 6;
const WORD_LENGTH = 5;
const STORAGE_KEY = 'harfane-state-v1';

const state = {
  answer: '', guesses: [], current: '', gameOver: false, won: false,
  keyStates: {}, stats: { played: 0, wins: 0, streak: 0, best: 0, distribution: [0, 0, 0, 0, 0, 0] }
};

const board = document.querySelector('#board');
const keyboard = document.querySelector('#keyboard');
const message = document.querySelector('#message');
const shareButton = document.querySelector('#share-button');
const toast = document.querySelector('#toast');

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

function loadState() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  if (saved && saved.date === todayKey()) {
    Object.assign(state, saved.game);
    state.stats = saved.stats || state.stats;
  } else {
    const answer = ANSWERS[(puzzleNumber() - 1) % ANSWERS.length];
    state.answer = answer;
    state.stats = saved?.stats || state.stats;
    saveState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), game: {
    answer: state.answer, guesses: state.guesses, current: state.current, gameOver: state.gameOver,
    won: state.won, keyStates: state.keyStates
  }, stats: state.stats }));
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

function handleKey(key) {
  if (state.gameOver) return;
  if (key === 'backspace') state.current = [...state.current].slice(0, -1).join('');
  else if (key === 'enter') submitGuess();
  else if ([...state.current].length < WORD_LENGTH) state.current += key;
  renderBoard(); renderKeyboard(); saveState();
}

function submitGuess() {
  const guess = state.current.toLocaleLowerCase('tr-TR');
  if ([...guess].length !== WORD_LENGTH) return showMessage('Beş harfli bir kelime yazmalısın.');
  if (!EXTRA_WORDS.includes(guess) && !ANSWERS.includes(guess)) return showMessage('Bu kelime listede yok.');
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
    showMessage(`${attempts} denemede buldun. Harika!`);
  } else {
    state.stats.streak = 0; showMessage(`Bugünün kelimesi: ${state.answer.toLocaleUpperCase('tr-TR')}`);
  }
  shareButton.disabled = false; saveState();
}

function showMessage(text) {
  message.textContent = text;
  message.classList.remove('message-pulse'); void message.offsetWidth; message.classList.add('message-pulse');
}

function showToast(text) {
  toast.textContent = text; toast.classList.add('show');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function openModal(type) {
  const content = document.querySelector('#modal-content');
  if (type === 'help') {
    content.innerHTML = `<h2 id="modal-title">Nasıl oynanır?</h2><p>Günün beş harfli kelimesini altı denemede bulmaya çalış. Her tahmininden sonra renkler sana yol gösterecek.</p><ul class="rules"><li><span class="rule-tile green">A</span> Yeşil harf doğru yerde.</li><li><span class="rule-tile yellow">R</span> Sarı harf kelimede var, yeri yanlış.</li><li><span class="rule-tile gray">T</span> Gri harf kelimede yok.</li></ul><p>Her gün yeni bir kelime. İyi şanslar!</p>`;
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
  if (event.key === 'Enter') handleKey('enter');
  else if (event.key === 'Backspace') handleKey('backspace');
  else {
    const key = event.key.toLocaleLowerCase('tr-TR');
    if (KEY_ROWS.flat().includes(key)) handleKey(key);
  }
});

document.querySelector('#help-button').addEventListener('click', () => openModal('help'));
document.querySelector('#stats-button').addEventListener('click', () => openModal('stats'));
document.querySelector('#modal-close').addEventListener('click', () => document.querySelector('#modal-backdrop').classList.add('hidden'));
document.querySelector('#modal-backdrop').addEventListener('click', event => { if (event.target.id === 'modal-backdrop') event.currentTarget.classList.add('hidden'); });
shareButton.addEventListener('click', shareResult);

loadState();
document.querySelector('#puzzle-number').textContent = `#${String(puzzleNumber()).padStart(3, '0')}`;
document.querySelector('#streak-value').textContent = state.stats.streak;
shareButton.disabled = !state.gameOver;
buildBoard(); renderKeyboard(); updateCountdown();
setInterval(updateCountdown, 1000);
