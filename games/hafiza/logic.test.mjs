import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, flipCard, settleMismatch, elapsedMilliseconds, isValidGame } from './logic.js';

test('creates a complete deck with exactly two of each symbol', () => {
  const game = createGame(18, () => 0.37);
  assert.equal(game.deck.length, 36);
  for (let symbol = 0; symbol < 18; symbol += 1) assert.equal(game.deck.filter(card => card === symbol).length, 2);
  assert.equal(isValidGame(game), true);
});

test('matched cards stay open and the timer and move count finish correctly', () => {
  let game = createGame(8, () => 0.45);
  const pair = game.deck.reduce((indices, symbol, index) => { (indices[symbol] ??= []).push(index); return indices; }, [])[0];
  game = flipCard(game, pair[0], 1000);
  game = flipCard(game, pair[1], 1100);
  assert.deepEqual(game.matched, pair);
  assert.equal(game.moves, 1);
  assert.equal(game.status, 'playing');
  assert.equal(elapsedMilliseconds(game, 2500), 1500);
});

test('blocks a third card during mismatch and closes the pair after 700ms', () => {
  const game = createGame(8, () => 0.2);
  const first = game.deck.findIndex((_, index) => index === 0);
  const second = game.deck.findIndex((symbol, index) => index > first && symbol !== game.deck[first]);
  let next = flipCard(game, first, 1000);
  next = flipCard(next, second, 1100);
  assert.equal(next.pendingMismatchAt, 1800);
  assert.equal(flipCard(next, 2, 1200), next);
  assert.equal(settleMismatch(next, 1799), next);
  next = settleMismatch(next, 1800);
  assert.deepEqual(next.revealed, []);
  assert.equal(next.pendingMismatchAt, null);
});

test('finishes after all pairs and saves the final elapsed time', () => {
  let game = createGame(8, () => 0.61);
  const pairs = new Map();
  game.deck.forEach((symbol, index) => { if (!pairs.has(symbol)) pairs.set(symbol, []); pairs.get(symbol).push(index); });
  let time = 1000;
  for (const pair of pairs.values()) {
    game = flipCard(game, pair[0], time++);
    game = flipCard(game, pair[1], time++);
  }
  assert.equal(game.status, 'won');
  assert.equal(game.moves, 8);
  assert.equal(game.elapsedMs, 15);
  assert.equal(isValidGame(game), true);
});
