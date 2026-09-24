import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, revealCell, toggleFlag, elapsedMilliseconds, DIFFICULTIES } from './logic.js';

test('all presets have the planned dimensions and mine counts', () => {
  assert.deepEqual(Object.fromEntries(Object.entries(DIFFICULTIES).map(([key, value]) => [key, [value.width, value.height, value.mines]])), {
    easy: [9, 9, 10], medium: [16, 16, 40], hard: [30, 16, 99]
  });
});

test('first reveal excludes its full neighborhood and numbers match adjacent mines', () => {
  let game = createGame('test', () => 0.4, { width: 8, height: 8, mines: 10 });
  game = revealCell(game, 27, 1000, () => 0.4);
  assert.equal(game.status, 'playing');
  assert.equal(game.cells[27].mine, false);
  for (let y = 2; y <= 4; y += 1) for (let x = 2; x <= 4; x += 1) assert.equal(game.cells[y * 8 + x].mine, false);
  for (let index = 0; index < game.cells.length; index += 1) {
    const x = index % game.width, y = Math.floor(index / game.width);
    const count = game.cells.reduce((sum, cell, neighbor) => {
      const nx = neighbor % game.width, ny = Math.floor(neighbor / game.width);
      return sum + (cell.mine && Math.max(Math.abs(x - nx), Math.abs(y - ny)) <= 1 && neighbor !== index ? 1 : 0);
    }, 0);
    if (!game.cells[index].mine) assert.equal(game.cells[index].adjacent, count);
  }
});

test('zero cells expand, flags toggle, and opening a mine ends the game', () => {
  let game = createGame('test', () => 0, { width: 8, height: 8, mines: 10 });
  game = revealCell(game, 27, 1000, () => 0);
  assert.ok(game.cells.filter(cell => cell.revealed).length > 1);
  let flagged = toggleFlag(game, 0);
  assert.equal(flagged.flags, 1);
  flagged = toggleFlag(flagged, 0);
  assert.equal(flagged.flags, 0);
  const mine = game.cells.findIndex(cell => cell.mine);
  game = revealCell(game, mine, 2000);
  assert.equal(game.status, 'lost');
  assert.equal(game.explodedIndex, mine);
  assert.equal(elapsedMilliseconds(game, 9000), 1000);
});

test('opening every safe cell wins and freezes the clock', () => {
  let game = createGame('test', () => 0.73, { width: 8, height: 8, mines: 10 });
  game = revealCell(game, 27, 1000, () => 0.73);
  for (let index = 0; index < game.cells.length && game.status === 'playing'; index += 1) {
    if (!game.cells[index].mine && !game.cells[index].revealed) game = revealCell(game, index, 1000 + index * 10);
  }
  assert.equal(game.status, 'won');
  assert.equal(elapsedMilliseconds(game, 10000), game.elapsedMs);
});
