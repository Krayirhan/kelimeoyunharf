// Mahjong (eşleştirmeli solitaire) — pure game rules. Every function returns a new game object (or null
// for an illegal move); nothing here touches the DOM.
// Positions use half-tile units: a tile at (x, y, z) covers x..x+1 and y..y+1 on layer z.

// Faces: 0–8 dots, 9–17 bamboo, 18–26 characters, 27–30 winds, 31–33 dragons, 34–37 flowers, 38–41 seasons.
// Any two flowers match each other, and so do any two seasons.
export const FACE_COUNT = 42;
export const matchKey = face => (face < 34 ? face : face < 38 ? 34 : 38);
export const facesMatch = (a, b) => matchKey(a) === matchKey(b);

// Layers are rows of full tiles ('x' = tile) shifted by an offset in half-tile units.
function layer(z, [dx, dy], rows) {
  const positions = [];
  rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === 'x') positions.push({ x: dx + c * 2, y: dy + r * 2, z }); }));
  return positions;
}

const PYRAMID = [
  ...layer(0, [0, 0], ['xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx']),
  ...layer(1, [2, 2], ['xxxxxx', 'xxxxxx']),
  ...layer(2, [6, 3], ['xx'])
];

const FORTRESS = [
  ...layer(0, [0, 0], ['xxxxxxxxxx', 'xxxxxxxxxx', 'xxxxxxxxxx', 'xxxxxxxxxx', 'xxxxxxxxxx', 'xxxxxxxxxx']),
  ...layer(1, [2, 2], ['xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx']),
  ...layer(2, [6, 4], ['xxxx', 'xxxx']),
  ...layer(3, [8, 5], ['xx'])
];

// The classic "turtle" layout with its three half-offset side tiles and single top tile.
const TURTLE = [
  ...layer(0, [2, 0], [
    'xxxxxxxxxxxx',
    '..xxxxxxxx..',
    '.xxxxxxxxxx.',
    'xxxxxxxxxxxx',
    'xxxxxxxxxxxx',
    '.xxxxxxxxxx.',
    '..xxxxxxxx..',
    'xxxxxxxxxxxx'
  ]),
  { x: 0, y: 7, z: 0 }, { x: 26, y: 7, z: 0 }, { x: 28, y: 7, z: 0 },
  ...layer(1, [8, 2], ['xxxxxx', 'xxxxxx', 'xxxxxx', 'xxxxxx', 'xxxxxx', 'xxxxxx']),
  ...layer(2, [10, 4], ['xxxx', 'xxxx', 'xxxx', 'xxxx']),
  ...layer(3, [12, 6], ['xx', 'xx']),
  { x: 13, y: 7, z: 4 }
];

export const LEVELS = {
  easy: { label: 'Kolay', positions: PYRAMID },
  medium: { label: 'Orta', positions: FORTRESS },
  hard: { label: 'Zor', positions: TURTLE }
};

// The 72 matching pairs of a full 144-tile set: two pairs of each regular face,
// plus flowers and seasons paired inside their group.
const PAIRS = [
  ...Array.from({ length: 34 }, (_, face) => [[face, face], [face, face]]).flat(),
  [34, 35], [36, 37], [38, 39], [40, 41]
];

export function positionsFor(level) {
  return LEVELS[level].positions;
}

// A tile is free when nothing lies on it and its left or right side is open.
export function isFree(positions, faces, index) {
  if (faces[index] < 0) return false;
  const { x, y, z } = positions[index];
  let left = false;
  let right = false;
  for (let i = 0; i < positions.length; i++) {
    if (i === index || faces[i] < 0) continue;
    const other = positions[i];
    if (Math.abs(other.y - y) >= 2) continue;
    if (other.z === z + 1 && Math.abs(other.x - x) < 2) return false;
    if (other.z === z) {
      if (other.x === x - 2) left = true;
      else if (other.x === x + 2) right = true;
    }
  }
  return !(left && right);
}

export function freeTiles(positions, faces) {
  return faces.map((_, index) => index).filter(index => isFree(positions, faces, index));
}

// Deals faces by playing the board backwards: each step takes two tiles that are free at that moment
// and gives them a matching pair, so removing pairs in that order always clears the board.
export function dealFaces(positions, present, pairs, random = Math.random) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const faces = positions.map((_, index) => (present[index] ? 0 : -1));
    const result = positions.map(() => -1);
    const order = [...pairs];
    let ok = true;
    for (let step = 0; step < pairs.length; step++) {
      const free = freeTiles(positions, faces);
      if (free.length < 2) { ok = false; break; }
      const a = free.splice(Math.floor(random() * free.length), 1)[0];
      const b = free[Math.floor(random() * free.length)];
      const [faceA, faceB] = order[step];
      result[a] = faceA;
      result[b] = faceB;
      faces[a] = -1;
      faces[b] = -1;
    }
    if (ok) return result;
  }
  return null;
}

function shuffled(list, random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createGame(level = 'easy', random = Math.random, now = Date.now()) {
  const positions = positionsFor(level);
  const pairs = shuffled(PAIRS, random).slice(0, positions.length / 2);
  const faces = dealFaces(positions, positions.map(() => true), pairs, random);
  return { version: 1, level, faces, history: [], hints: 0, shuffles: 0, status: 'playing', elapsedMs: 0, startedAt: now };
}

export function remainingTiles(game) {
  return game.faces.filter(face => face >= 0).length;
}

// Every pair of free, matching tiles on the board.
export function availablePairs(game) {
  const positions = positionsFor(game.level);
  const free = freeTiles(positions, game.faces);
  const pairs = [];
  for (let i = 0; i < free.length; i++) {
    for (let j = i + 1; j < free.length; j++) {
      if (facesMatch(game.faces[free[i]], game.faces[free[j]])) pairs.push([free[i], free[j]]);
    }
  }
  return pairs;
}

export function removePair(game, a, b, now = Date.now()) {
  if (game.status !== 'playing' || a === b) return null;
  const positions = positionsFor(game.level);
  if (!isFree(positions, game.faces, a) || !isFree(positions, game.faces, b)) return null;
  if (!facesMatch(game.faces[a], game.faces[b])) return null;
  const faces = [...game.faces];
  const entry = { tiles: [a, b], faces: [faces[a], faces[b]] };
  faces[a] = -1;
  faces[b] = -1;
  const next = { ...game, faces, history: [...game.history, entry] };
  if (faces.every(face => face < 0)) return { ...next, status: 'won', elapsedMs: elapsedMilliseconds(game, now), startedAt: now };
  return next;
}

export function undo(game) {
  if (game.status !== 'playing' || !game.history.length) return null;
  const entry = game.history[game.history.length - 1];
  const faces = [...game.faces];
  entry.tiles.forEach((tile, i) => { faces[tile] = entry.faces[i]; });
  return { ...game, faces, history: game.history.slice(0, -1) };
}

export function giveHint(game) {
  if (game.status !== 'playing') return null;
  const pair = availablePairs(game)[0];
  return pair ? { game: { ...game, hints: game.hints + 1 }, pair } : null;
}

// Mixes the remaining tiles into a new layout that can still be cleared.
export function shuffleTiles(game, random = Math.random) {
  if (game.status !== 'playing') return null;
  const positions = positionsFor(game.level);
  const present = game.faces.map(face => face >= 0);
  const byKey = new Map();
  game.faces.filter(face => face >= 0).forEach(face => {
    const key = matchKey(face);
    byKey.set(key, [...(byKey.get(key) || []), face]);
  });
  const pairs = [];
  for (const faces of byKey.values()) for (let i = 0; i + 1 < faces.length; i += 2) pairs.push([faces[i], faces[i + 1]]);
  const faces = dealFaces(positions, present, shuffled(pairs, random), random);
  if (!faces) return null;
  return { ...game, faces, history: [], shuffles: game.shuffles + 1 };
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

export function isValidGame(game) {
  if (!game || typeof game !== 'object' || game.version !== 1 || !LEVELS[game.level]) return false;
  if (!['playing', 'won'].includes(game.status)) return false;
  if (!['hints', 'shuffles', 'elapsedMs', 'startedAt'].every(key => Number.isFinite(game[key]) && game[key] >= 0)) return false;
  const size = positionsFor(game.level).length;
  if (!Array.isArray(game.faces) || game.faces.length !== size) return false;
  if (!game.faces.every(face => Number.isInteger(face) && face >= -1 && face < FACE_COUNT)) return false;
  // Removed tiles come in pairs, so the remaining tiles of every match group must be even.
  const counts = new Map();
  game.faces.forEach(face => { if (face >= 0) counts.set(matchKey(face), (counts.get(matchKey(face)) || 0) + 1); });
  if ([...counts.values()].some(count => count % 2)) return false;
  if (!Array.isArray(game.history)) return false;
  return game.history.every(entry => entry && Array.isArray(entry.tiles) && Array.isArray(entry.faces) && entry.tiles.length === 2 && entry.faces.length === 2
    && entry.tiles.every(tile => Number.isInteger(tile) && tile >= 0 && tile < size)
    && entry.faces.every(face => Number.isInteger(face) && face >= 0 && face < FACE_COUNT));
}
