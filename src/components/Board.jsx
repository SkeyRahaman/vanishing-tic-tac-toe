import Cell from './Cell';
import { PLAYER1, PLAYER2, getCellMap } from '../engine/gameState';

/**
 * Board — 3×3 grid.
 *
 * Props:
 *   state       — game state object
 *   onCellClick — callback(cellIndex)
 *   disabled    — disable all clicks (CPU turn / game over)
 */
export default function Board({ state, onCellClick, disabled }) {
  const { queues, winLine } = state;
  const cellMap = getCellMap(state);

  const winSet = new Set(winLine || []);

  // Oldest marks (about to be removed on next 4th placement)
  const fadingCells = new Set();
  if (queues[PLAYER1].length >= 3) fadingCells.add(queues[PLAYER1][0]);
  if (queues[PLAYER2].length >= 3) fadingCells.add(queues[PLAYER2][0]);

  return (
    <div
      className="board glass"
      role="grid"
      aria-label="Tic-Tac-Toe board"
    >
      {Array.from({ length: 9 }, (_, i) => {
        const player = cellMap.get(i) || null;
        return (
          <Cell
            key={i}
            index={i}
            player={player}
            isFading={fadingCells.has(i)}
            isWinning={winSet.has(i)}
            disabled={disabled}
            onClick={onCellClick}
          />
        );
      })}
    </div>
  );
}
