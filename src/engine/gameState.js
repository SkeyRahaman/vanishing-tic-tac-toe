/**
 * gameState.js — Pure game logic for Tic-Tac-Toe with vanishing marks.
 *
 * Rules:
 * - 3×3 board, cells 0-8 (row-major)
 * - Each player holds a FIFO queue of max 3 marks
 * - Placing a 4th mark removes the player's OLDEST mark first, THEN wins are checked
 * - Only the 3 standing marks can form a win
 * - Win lines: 012 345 678 036 147 258 048 246
 */

export const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diags
];

export const PLAYER1 = 'X';
export const PLAYER2 = 'O';

/**
 * Create the initial game state.
 * @param {string} firstMover - PLAYER1 or PLAYER2
 */
export function createInitialState(firstMover = PLAYER1) {
  return {
    // queues: arrays of cell indices, oldest first
    queues: { [PLAYER1]: [], [PLAYER2]: [] },
    currentPlayer: firstMover,
    winner: null,     // null | PLAYER1 | PLAYER2
    winLine: null,    // null | [a,b,c]
    // cell that was just removed (for animation purposes)
    removedCell: null,
  };
}

/**
 * Get the set of occupied cells from a state.
 * Returns a Map<cellIndex, player>
 */
export function getCellMap(state) {
  const map = new Map();
  for (const p of [PLAYER1, PLAYER2]) {
    for (const cell of state.queues[p]) {
      map.set(cell, p);
    }
  }
  return map;
}

/**
 * Check if a set of cells (as array) contains a winning line.
 * Returns the winning line or null.
 */
export function checkWin(cells) {
  const set = new Set(cells);
  for (const line of WIN_LINES) {
    if (line.every(c => set.has(c))) return line;
  }
  return null;
}

/**
 * Get legal moves for the current player.
 * A cell is legal if it's not currently occupied (after the potential removal of the oldest mark).
 */
export function getLegalMoves(state) {
  const { queues, currentPlayer } = state;
  const myQueue = queues[currentPlayer];

  // If placing would trigger removal, simulate what the board looks like after removal
  let occupiedAfterRemoval = new Set();
  for (const p of [PLAYER1, PLAYER2]) {
    for (const cell of queues[p]) {
      occupiedAfterRemoval.add(cell);
    }
  }

  // If my queue is full (3), the oldest will be removed
  if (myQueue.length >= 3) {
    occupiedAfterRemoval.delete(myQueue[0]);
  }

  // Legal = any cell not occupied after the removal
  const moves = [];
  for (let i = 0; i < 9; i++) {
    if (!occupiedAfterRemoval.has(i)) moves.push(i);
  }
  return moves;
}

/**
 * Apply a move and return the new state.
 * Immutable — does not modify the input state.
 */
export function applyMove(state, cell) {
  const { queues, currentPlayer } = state;
  const opponent = currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1;

  let myQueue = [...queues[currentPlayer]];
  let theirQueue = [...queues[opponent]];

  // Remove oldest mark if queue is full
  let removedCell = null;
  if (myQueue.length >= 3) {
    removedCell = myQueue[0];
    myQueue = myQueue.slice(1);
  }

  // Add new mark at end of queue
  myQueue = [...myQueue, cell];

  // Rebuild queues in original player order
  const newQueues = {
    [currentPlayer]: myQueue,
    [opponent]: theirQueue,
  };

  // Check for win (only standing marks count)
  const winLine = checkWin(myQueue);

  return {
    queues: newQueues,
    currentPlayer: winLine ? currentPlayer : opponent,
    winner: winLine ? currentPlayer : null,
    winLine: winLine || null,
    removedCell,
  };
}

/**
 * Encode state as a string key for the solver lookup table.
 * Format: "P1queue_P2queue_mover"
 * where each queue is comma-separated cell indices (order matters).
 */
export function encodeState(p1Queue, p2Queue, mover) {
  return `${p1Queue.join(',')}_${p2Queue.join(',')}_${mover}`;
}

/**
 * Encode the current game state as a solver key.
 */
export function encodeGameState(state) {
  const { queues, currentPlayer } = state;
  return encodeState(
    queues[PLAYER1],
    queues[PLAYER2],
    currentPlayer
  );
}
