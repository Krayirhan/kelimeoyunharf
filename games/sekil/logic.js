// Şekil Birleştir kuralları: 8×8 tahta, her turda üç parça, dolan satır ve sütunlar temizlenir.
// Tahta 64 hücrelik düz bir dizi; 0 boş, 1–7 parçanın renk numarası.

export const SIZE = 8;
export const TRAY_SIZE = 3;
export const COLORS = 7;

// Parçalar [satır, sütun] hücre listeleri; her biri sol üst köşeden başlar.
const line = (length, vertical) => Array.from({ length }, (_, index) => (vertical ? [index, 0] : [0, index]));
export const SHAPES = [
  [[0, 0]],
  line(2, false), line(2, true),
  line(3, false), line(3, true),
  line(4, false), line(4, true),
  line(5, false), line(5, true),
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 0], [1, 1]], [[0, 0], [0, 1], [1, 0]], [[0, 0], [0, 1], [1, 1]], [[0, 1], [1, 0], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [2, 1]], [[0, 0], [0, 1], [0, 2], [1, 0]], [[0, 0], [0, 1], [1, 1], [2, 1]], [[0, 2], [1, 0], [1, 1], [1, 2]],
  [[0, 1], [1, 1], [2, 1], [2, 0]], [[0, 0], [1, 0], [1, 1], [1, 2]], [[0, 0], [0, 1], [1, 0], [2, 0]], [[0, 0], [0, 1], [0, 2], [1, 2]],
  [[0, 0], [0, 1], [0, 2], [1, 1]], [[0, 1], [1, 0], [1, 1], [2, 1]], [[0, 1], [1, 0], [1, 1], [1, 2]], [[0, 0], [1, 0], [1, 1], [2, 0]],
  [[0, 1], [0, 2], [1, 0], [1, 1]], [[0, 0], [1, 0], [1, 1], [2, 1]], [[0, 0], [0, 1], [1, 1], [1, 2]], [[0, 1], [1, 0], [1, 1], [2, 0]],
  [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]], [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]], [[0, 2], [1, 2], [2, 0], [2, 1], [2, 2]]
];

export const shapeSize = shape => ({
  rows: Math.max(...SHAPES[shape].map(([row]) => row)) + 1,
  cols: Math.max(...SHAPES[shape].map(([, col]) => col)) + 1
});

export function randomPiece(random = Math.random) {
  return { shape: Math.floor(random() * SHAPES.length), color: 1 + Math.floor(random() * COLORS) };
}

export function canPlace(board, piece, row, col) {
  return SHAPES[piece.shape].every(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;
    return r >= 0 && r < SIZE && c >= 0 && c < SIZE && !board[r * SIZE + c];
  });
}

export function fitsAnywhere(board, piece) {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) if (canPlace(board, piece, row, col)) return true;
  }
  return false;
}

// Yeni üçlüden en az bir parçanın tahtaya sığmasını dener; tahta çok doluysa rastgele üçlü döner.
function freshTray(board, random) {
  let tray = [];
  for (let attempt = 0; attempt < 20; attempt += 1) {
    tray = Array.from({ length: TRAY_SIZE }, () => randomPiece(random));
    if (tray.some(piece => fitsAnywhere(board, piece))) break;
  }
  return tray;
}

export function createGame(random = Math.random, best = 0) {
  const board = Array(SIZE * SIZE).fill(0);
  return { board, tray: freshTray(board, random), score: 0, best, streak: 0, lines: 0, status: 'playing' };
}

// Bir parça konunca dolacak satır ve sütunlar (önizleme ve temizleme için).
export function linesToClear(board, piece, row, col) {
  const next = [...board];
  for (const [dr, dc] of SHAPES[piece.shape]) next[(row + dr) * SIZE + col + dc] = piece.color;
  const rows = [];
  const cols = [];
  for (let index = 0; index < SIZE; index += 1) {
    if (next.slice(index * SIZE, index * SIZE + SIZE).every(Boolean)) rows.push(index);
    if (Array.from({ length: SIZE }, (_, r) => next[r * SIZE + index]).every(Boolean)) cols.push(index);
  }
  return { rows, cols, board: next };
}

// Puan: her hücre 1, temizlenen çizgiler 10 · 1 + 2 + … + n, art arda temizleme her turda +10 · seri.
export function lineBonus(count) {
  return (10 * count * (count + 1)) / 2;
}

export function placePiece(game, trayIndex, row, col, random = Math.random) {
  const piece = game.tray[trayIndex];
  if (game.status !== 'playing' || !piece || !canPlace(game.board, piece, row, col)) return null;
  const { rows, cols, board } = linesToClear(game.board, piece, row, col);
  const cleared = new Set();
  for (const r of rows) for (let c = 0; c < SIZE; c += 1) cleared.add(r * SIZE + c);
  for (const c of cols) for (let r = 0; r < SIZE; r += 1) cleared.add(r * SIZE + c);
  for (const index of cleared) board[index] = 0;

  const count = rows.length + cols.length;
  const streak = count ? game.streak + 1 : 0;
  const gained = SHAPES[piece.shape].length + lineBonus(count) + (count && streak > 1 ? 10 * (streak - 1) : 0);
  let tray = game.tray.map((item, index) => (index === trayIndex ? null : item));
  if (tray.every(item => !item)) tray = freshTray(board, random);
  const score = game.score + gained;
  const next = { ...game, board, tray, score, best: Math.max(game.best, score), streak, lines: game.lines + count };
  if (!tray.some(item => item && fitsAnywhere(board, item))) next.status = 'over';
  return { game: next, gained, rows, cols, cleared: [...cleared] };
}

export function isValidGame(game) {
  const validPiece = piece => piece === null || (piece && Number.isInteger(piece.shape) && piece.shape >= 0 && piece.shape < SHAPES.length
    && Number.isInteger(piece.color) && piece.color >= 1 && piece.color <= COLORS);
  return Boolean(game && typeof game === 'object'
    && Array.isArray(game.board) && game.board.length === SIZE * SIZE && game.board.every(cell => Number.isInteger(cell) && cell >= 0 && cell <= COLORS)
    && Array.isArray(game.tray) && game.tray.length === TRAY_SIZE && game.tray.every(validPiece) && game.tray.some(Boolean)
    && ['playing', 'over'].includes(game.status)
    && [game.score, game.best, game.streak, game.lines].every(value => Number.isInteger(value) && value >= 0)
    && game.best >= game.score);
}
