export const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

export function createGame() {
  return { board: Array(9).fill(''), current: 'X', starter: 'X', winner: '', winningLine: [], scores: { X: 0, O: 0, draws: 0 }, status: 'playing' };
}

export function playMove(state, index) {
  if (!Number.isInteger(index) || index < 0 || index > 8 || state.status !== 'playing' || state.board[index]) return null;
  const next = { ...state, board: [...state.board], scores: { ...state.scores } };
  next.board[index] = state.current;
  const line = WIN_LINES.find(cells => cells.every(cell => next.board[cell] === state.current));
  if (line) {
    next.winner = state.current;
    next.winningLine = line;
    next.status = 'won';
    next.scores[state.current] += 1;
  } else if (next.board.every(Boolean)) {
    next.status = 'draw';
    next.scores.draws += 1;
  } else {
    next.current = state.current === 'X' ? 'O' : 'X';
  }
  return next;
}

export function newRound(state) {
  const starter = state.starter === 'X' ? 'O' : 'X';
  return { ...state, board: Array(9).fill(''), current: starter, starter, winner: '', winningLine: [], status: 'playing', scores: { ...state.scores } };
}

export function resetScores(state) {
  return { ...state, scores: { X: 0, O: 0, draws: 0 } };
}

export function isValidGame(value) {
  return Boolean(value && Array.isArray(value.board) && value.board.length === 9
    && value.board.every(cell => cell === '' || cell === 'X' || cell === 'O')
    && ['X', 'O'].includes(value.current) && ['X', 'O'].includes(value.starter)
    && ['', 'X', 'O'].includes(value.winner) && ['playing', 'won', 'draw'].includes(value.status)
    && value.scores && ['X', 'O', 'draws'].every(key => Number.isInteger(value.scores[key]) && value.scores[key] >= 0)
    && Array.isArray(value.winningLine) && value.winningLine.every(index => Number.isInteger(index) && index >= 0 && index < 9));
}
