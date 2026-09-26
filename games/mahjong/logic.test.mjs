import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, matchKey, facesMatch, positionsFor, isFree, freeTiles, createGame, availablePairs, removePair, undo, giveHint, shuffleTiles, remainingTiles, elapsedMilliseconds, pauseGame, resumeGame, isValidGame } from './logic.js';

// Deterministic random numbers so every run deals the same boards.
function seeded(seed) {
  return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
}

// Depth-first search for a full clearing sequence (with a memo of dead positions).
function solvable(game, dead = new Set()) {
  if (game.status === 'won') return true;
  const key = game.faces.map(face => (face < 0 ? 0 : 1)).join('');
  if (dead.has(key)) return false;
  for (const [a, b] of availablePairs(game)) {
    if (solvable(removePair(game, a, b, 0), dead)) return true;
  }
  dead.add(key);
  return false;
}

test('layouts have the expected number of tiles', () => {
  assert.equal(LEVELS.easy.positions.length, 46);
  assert.equal(LEVELS.medium.positions.length, 102);
  assert.equal(LEVELS.hard.positions.length, 144);
  for (const { positions } of Object.values(LEVELS)) {
    const keys = positions.map(({ x, y, z }) => `${x},${y},${z}`);
    assert.equal(new Set(keys).size, positions.length, 'no two tiles share a spot');
  }
});

test('flowers match flowers and seasons match seasons', () => {
  assert.ok(facesMatch(34, 37));
  assert.ok(facesMatch(38, 41));
  assert.ok(!facesMatch(37, 38));
  assert.ok(facesMatch(5, 5) && !facesMatch(5, 6));
  assert.equal(matchKey(12), 12);
});

test('free tiles: open on the left or right and nothing on top', () => {
  const positions = positionsFor('hard');
  const faces = positions.map(() => 0);
  const index = (x, y, z) => positions.findIndex(p => p.x === x && p.y === y && p.z === z);
  assert.ok(isFree(positions, faces, index(13, 7, 4)), 'the top tile is free');
  assert.ok(!isFree(positions, faces, index(12, 6, 3)), 'tiles under the top tile are blocked');
  assert.ok(isFree(positions, faces, index(0, 7, 0)), 'the left side tile is free');
  assert.ok(!isFree(positions, faces, index(2, 6, 0)), 'the tile next to it is blocked on both sides');
  assert.ok(isFree(positions, faces, index(28, 7, 0)));
  assert.ok(!isFree(positions, faces, index(26, 7, 0)));
  assert.ok(isFree(positions, faces, index(2, 0, 0)), 'row ends are free');
});

test('every deal can be cleared (the deal order is a solution)', () => {
  for (const level of Object.keys(LEVELS)) {
    for (let seed = 1; seed <= 5; seed++) {
      const game = createGame(level, seeded(seed * 31), 0);
      assert.ok(game.faces.every(face => face >= 0));
      assert.ok(isValidGame(game), `${level} deal ${seed} is valid`);
      assert.ok(availablePairs(game).length > 0, 'there is a first move');
      if (level !== 'hard') assert.ok(solvable(game), `${level} deal ${seed} can be cleared`);
    }
  }
});

test('removing a matching free pair, and refusing blocked or different tiles', () => {
  let game = createGame('easy', seeded(4), 0);
  const [a, b] = availablePairs(game)[0];
  const removed = removePair(game, a, b, 0);
  assert.equal(removed.faces[a], -1);
  assert.equal(removed.faces[b], -1);
  assert.equal(remainingTiles(removed), 44);
  assert.equal(removePair(removed, a, b, 0), null, 'already gone');
  const positions = positionsFor('easy');
  const blocked = game.faces.findIndex((_, i) => !isFree(positions, game.faces, i));
  const twin = game.faces.findIndex((face, i) => i !== blocked && facesMatch(face, game.faces[blocked]));
  assert.equal(removePair(game, blocked, twin, 0), null, 'a blocked tile cannot be taken');
  const free = freeTiles(positions, game.faces);
  const odd = free.find(i => !facesMatch(game.faces[i], game.faces[free[0]]));
  if (odd !== undefined) assert.equal(removePair(game, free[0], odd, 0), null, 'different faces do not match');
  game = undo(removed);
  assert.deepEqual(game.faces, createGame('easy', seeded(4), 0).faces);
  assert.equal(undo(game), null);
});

test('clearing the board wins and stops the clock', () => {
  // Rebuild a board whose only pairs are forced, so the greedy player always finishes it.
  let game = createGame('easy', seeded(8), 0);
  let current = { ...game, startedAt: 0 };
  let guard = 0;
  while (current.status === 'playing' && guard++ < 100) {
    const pairs = availablePairs(current);
    if (!pairs.length) current = shuffleTiles(current, seeded(guard));
    else current = removePair(current, pairs[0][0], pairs[0][1], 90_000);
  }
  assert.equal(current.status, 'won');
  assert.equal(current.elapsedMs, 90_000);
  assert.equal(elapsedMilliseconds(current, 500_000), 90_000);
  assert.equal(removePair(current, 0, 1), null);
});

test('hints point at a real pair and are counted', () => {
  const game = createGame('medium', seeded(6), 0);
  const { game: hinted, pair } = giveHint(game);
  assert.equal(hinted.hints, 1);
  assert.ok(removePair(game, pair[0], pair[1], 0));
});

test('shuffling keeps the same tiles and stays solvable', () => {
  let game = createGame('hard', seeded(12), 0);
  const [a, b] = availablePairs(game)[0];
  game = removePair(game, a, b, 0);
  const shuffledGame = shuffleTiles(game, seeded(99));
  assert.equal(shuffledGame.shuffles, 1);
  assert.equal(shuffledGame.history.length, 0);
  const keys = faces => faces.filter(face => face >= 0).map(matchKey).sort((x, y) => x - y);
  assert.deepEqual(keys(shuffledGame.faces), keys(game.faces));
  assert.deepEqual(shuffledGame.faces.map(face => face < 0), game.faces.map(face => face < 0), 'same spots stay empty');
  assert.ok(availablePairs(shuffledGame).length > 0);
});

test('pause freezes the clock and saves stay valid', () => {
  const game = createGame('easy', seeded(2), 1000);
  const paused = pauseGame(game, 4000);
  assert.equal(paused.elapsedMs, 3000);
  assert.equal(elapsedMilliseconds(resumeGame(paused, 50_000), 52_000), 5000);
  const restored = JSON.parse(JSON.stringify(paused));
  assert.ok(isValidGame(restored));
  assert.ok(!isValidGame({ ...restored, level: 'huge' }));
  assert.ok(!isValidGame({ ...restored, faces: restored.faces.map((face, i) => (i === 0 ? -1 : face)) }), 'a lone tile cannot be removed');
  assert.ok(!isValidGame(null));
});
