// Sudoku kuralları: bulmaca üretimi, hamleler, notlar, geri alma, ipucu ve kazanma kontrolü.
// Tahta 81 hücrelik düz bir dizi; 0 boş hücre demek.

export const LEVELS = {
  easy: { label: 'Kolay', givens: 40 },
  medium: { label: 'Orta', givens: 32 },
  hard: { label: 'Zor', givens: 26 }
};

const UNDO_LIMIT = 200;

export const rowOf = index => Math.floor(index / 9);
export const colOf = index => index % 9;
export const boxOf = index => Math.floor(rowOf(index) / 3) * 3 + Math.floor(colOf(index) / 3);

// Her hücrenin aynı satır, sütun ya da kutudaki 20 komşusu.
export const PEERS = Array.from({ length: 81 }, (_, index) => {
  const peers = [];
  for (let other = 0; other < 81; other += 1) {
    if (other !== index && (rowOf(other) === rowOf(index) || colOf(other) === colOf(index) || boxOf(other) === boxOf(index))) peers.push(other);
  }
  return peers;
});

function shuffled(values, random) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export function canPlace(board, index, value) {
  return PEERS[index].every(peer => board[peer] !== value);
}

// Çözüm sayısını en fazla `limit` kadar sayar; en az seçeneği olan boş hücreden dallanır.
export function countSolutions(board, limit = 2) {
  const grid = [...board];
  let count = 0;
  function search() {
    let best = -1;
    let bestOptions = null;
    for (let index = 0; index < 81; index += 1) {
      if (grid[index]) continue;
      const options = [];
      for (let value = 1; value <= 9; value += 1) if (canPlace(grid, index, value)) options.push(value);
      if (!options.length) return;
      if (!bestOptions || options.length < bestOptions.length) { best = index; bestOptions = options; if (options.length === 1) break; }
    }
    if (best === -1) { count += 1; return; }
    for (const value of bestOptions) {
      grid[best] = value;
      search();
      if (count >= limit) break;
    }
    grid[best] = 0;
  }
  search();
  return count;
}

export function solve(board) {
  const grid = [...board];
  function search(index) {
    while (index < 81 && grid[index]) index += 1;
    if (index === 81) return true;
    for (let value = 1; value <= 9; value += 1) {
      if (!canPlace(grid, index, value)) continue;
      grid[index] = value;
      if (search(index + 1)) return true;
    }
    grid[index] = 0;
    return false;
  }
  return search(0) ? grid : null;
}

function fullGrid(random) {
  const grid = Array(81).fill(0);
  function fill(index) {
    if (index === 81) return true;
    for (const value of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9], random)) {
      if (!canPlace(grid, index, value)) continue;
      grid[index] = value;
      if (fill(index + 1)) return true;
    }
    grid[index] = 0;
    return false;
  }
  fill(0);
  return grid;
}

// Tek çözümlü bir bulmaca üretir: tam çözümden hücre silinir, çözüm tek kaldıkça silme sürer.
// Hedef ipucu sayısına inilemezse birkaç kez yeniden denenir ve en yakın sonuç tutulur.
export function generatePuzzle(level = 'easy', random = Math.random) {
  const target = (LEVELS[level] || LEVELS.easy).givens;
  let best = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const solution = fullGrid(random);
    const puzzle = [...solution];
    let filled = 81;
    for (const index of shuffled([...Array(81).keys()], random)) {
      if (filled <= target) break;
      const kept = puzzle[index];
      puzzle[index] = 0;
      if (countSolutions(puzzle, 2) === 1) filled -= 1;
      else puzzle[index] = kept;
    }
    if (!best || filled < best.filled) best = { puzzle, solution, filled };
    if (filled <= target) break;
  }
  return { puzzle: best.puzzle, solution: best.solution };
}

export function createGame(level = 'easy', random = Math.random, now = Date.now()) {
  const { puzzle, solution } = generatePuzzle(level, random);
  return {
    level: LEVELS[level] ? level : 'easy',
    puzzle,
    solution,
    board: [...puzzle],
    notes: Array(81).fill(0),
    history: [],
    hints: 0,
    mistakes: 0,
    startedAt: now,
    elapsedMs: 0,
    status: 'playing'
  };
}

const bit = value => 1 << (value - 1);
export const hasNote = (game, index, value) => Boolean(game.notes[index] & bit(value));
export const noteValues = (game, index) => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(value => hasNote(game, index, value));

function snapshot(game, index) {
  return { index, value: game.board[index], notes: game.notes[index], peerNotes: PEERS[index].map(peer => game.notes[peer]) };
}

function withHistory(game, index) {
  return [...game.history, snapshot(game, index)].slice(-UNDO_LIMIT);
}

// Hücreye rakam yazar. Aynı rakam tekrar yazılırsa hücre temizlenir.
// Doğru rakam komşulardaki aynı notları siler; yanlış rakam hata sayar.
export function placeValue(game, index, value, now = Date.now()) {
  if (game.status !== 'playing' || game.puzzle[index] || !Number.isInteger(value) || value < 1 || value > 9) return null;
  const next = { ...game, board: [...game.board], notes: [...game.notes], history: withHistory(game, index) };
  if (game.board[index] === value) {
    next.board[index] = 0;
    return next;
  }
  next.board[index] = value;
  next.notes[index] = 0;
  for (const peer of PEERS[index]) next.notes[peer] &= ~bit(value);
  if (value !== game.solution[index]) next.mistakes = game.mistakes + 1;
  return finishIfSolved(next, now);
}

export function clearCell(game, index) {
  if (game.status !== 'playing' || game.puzzle[index] || (!game.board[index] && !game.notes[index])) return null;
  const next = { ...game, board: [...game.board], notes: [...game.notes], history: withHistory(game, index) };
  next.board[index] = 0;
  next.notes[index] = 0;
  return next;
}

export function toggleNote(game, index, value) {
  if (game.status !== 'playing' || game.puzzle[index] || game.board[index] || !Number.isInteger(value) || value < 1 || value > 9) return null;
  const next = { ...game, notes: [...game.notes], history: withHistory(game, index) };
  next.notes[index] ^= bit(value);
  return next;
}

export function undo(game) {
  if (game.status !== 'playing' || !game.history.length) return null;
  const history = [...game.history];
  const last = history.pop();
  const next = { ...game, board: [...game.board], notes: [...game.notes], history };
  next.board[last.index] = last.value;
  next.notes[last.index] = last.notes;
  PEERS[last.index].forEach((peer, position) => { next.notes[peer] = last.peerNotes[position]; });
  return next;
}

// Seçili hücre boşsa ya da yanlışsa oraya, değilse ilk boş ya da yanlış hücreye doğru rakamı yazar.
export function giveHint(game, preferred = -1, now = Date.now()) {
  if (game.status !== 'playing') return null;
  const needsHelp = index => !game.puzzle[index] && game.board[index] !== game.solution[index];
  const index = preferred >= 0 && needsHelp(preferred) ? preferred : game.board.findIndex((_, cell) => needsHelp(cell));
  if (index < 0) return null;
  const next = { ...game, board: [...game.board], notes: [...game.notes], history: withHistory(game, index), hints: game.hints + 1 };
  const value = game.solution[index];
  next.board[index] = value;
  next.notes[index] = 0;
  for (const peer of PEERS[index]) next.notes[peer] &= ~bit(value);
  return { game: finishIfSolved(next, now), index };
}

// Aynı satır, sütun ya da kutuda tekrar eden rakamların hücreleri.
export function conflicts(board) {
  const found = new Set();
  board.forEach((value, index) => {
    if (!value) return;
    for (const peer of PEERS[index]) if (board[peer] === value) { found.add(index); found.add(peer); }
  });
  return found;
}

export function isSolved(game) {
  return game.board.every((value, index) => value === game.solution[index]);
}

function finishIfSolved(game, now) {
  if (!isSolved(game)) return game;
  return { ...game, status: 'won', elapsedMs: elapsedMilliseconds(game, now), history: [] };
}

export function elapsedMilliseconds(game, now = Date.now()) {
  return game.status === 'playing' ? game.elapsedMs + Math.max(0, now - game.startedAt) : game.elapsedMs;
}

// Sayfa kapanırken süreyi dondurur, açılınca kaldığı yerden sürdürür.
export function pauseGame(game, now = Date.now()) {
  if (game.status !== 'playing') return game;
  return { ...game, elapsedMs: elapsedMilliseconds(game, now), startedAt: now };
}

export function resumeGame(game, now = Date.now()) {
  return game.status === 'playing' ? { ...game, startedAt: now } : game;
}

const isCellArray = (value, max) => Array.isArray(value) && value.length === 81 && value.every(cell => Number.isInteger(cell) && cell >= 0 && cell <= max);

export function isValidGame(game) {
  return Boolean(game && typeof game === 'object'
    && LEVELS[game.level]
    && isCellArray(game.puzzle, 9) && isCellArray(game.solution, 9) && isCellArray(game.board, 9) && isCellArray(game.notes, 511)
    && game.solution.every(Boolean)
    && game.puzzle.every((value, index) => !value || (value === game.solution[index] && game.board[index] === value))
    && Array.isArray(game.history)
    && ['playing', 'won'].includes(game.status)
    && Number.isInteger(game.hints) && game.hints >= 0
    && Number.isInteger(game.mistakes) && game.mistakes >= 0
    && Number.isFinite(game.startedAt) && Number.isFinite(game.elapsedMs) && game.elapsedMs >= 0);
}
