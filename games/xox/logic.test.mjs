import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, playMove, newRound, resetScores, isValidGame } from './logic.js';

test('X wins with each of the eight lines', () => {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const line of lines) {
    let game = createGame();
    const fillers = [8,7,6,5,3,1,2,4,0].filter(index => !line.includes(index));
    const moves = [];
    for (const cell of line) { moves.push(cell); if (fillers.length) moves.push(fillers.shift()); }
    for (const cell of moves) { const next = playMove(game, cell); if (next) game = next; }
    assert.equal(game.winner, 'X');
    assert.deepEqual(game.winningLine, line);
  }
});

test('rejects occupied cells and moves after the round ends', () => {
  let game = createGame();
  game = playMove(game, 0);
  assert.equal(playMove(game, 0), null);
  for (const index of [3,1,4,2]) game = playMove(game, index);
  assert.equal(playMove(game, 8), null);
  assert.equal(game.scores.X, 1);
});

test('draws, alternates the starter and resets scores independently', () => {
  let game = createGame();
  for (const index of [0,1,2,4,3,5,7,6,8]) game = playMove(game, index);
  assert.equal(game.status, 'draw');
  assert.equal(game.scores.draws, 1);
  game = newRound(game);
  assert.equal(game.current, 'O');
  assert.equal(game.scores.draws, 1);
  assert.deepEqual(resetScores(game).scores, { X: 0, O: 0, draws: 0 });
  assert.equal(isValidGame(game), true);
});
