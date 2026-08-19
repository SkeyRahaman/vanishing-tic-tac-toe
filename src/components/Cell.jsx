import { AnimatePresence, motion } from 'motion/react';

/**
 * Cell — individual board square.
 *
 * Props:
 *   index       — 0-8
 *   player      — 'X' | 'O' | null
 *   isFading    — true if this is the oldest mark (about to be removed)
 *   isWinning   — true if this cell is part of the winning line
 *   disabled    — true when it's not the human's turn or game is over
 *   onClick     — callback(index)
 */
export default function Cell({ index, player, isFading, isWinning, disabled, onClick }) {
  const classNames = [
    'cell',
    player ? `cell--${player === 'X' ? 'p1' : 'p2'}` : '',
    isFading ? 'cell--fading' : '',
    isWinning ? 'cell--winning' : '',
    (disabled || player) ? 'cell--disabled' : '',
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (!disabled && !player) onClick(index);
  };

  return (
    <div
      className={classNames}
      onClick={handleClick}
      role="button"
      aria-label={`Cell ${index + 1}${player ? `, occupied by ${player === 'X' ? 'Player 1' : 'Player 2'}` : ', empty'}`}
      tabIndex={disabled || player ? -1 : 0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      id={`cell-${index}`}
    >
      <AnimatePresence mode="wait">
        {player && (
          <motion.span
            key={`${index}-${player}`}
            className={`mark mark--${player === 'X' ? 'p1' : 'p2'}`}
            initial={{ scale: 0, rotate: -15, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 15, opacity: 0 }}
            transition={{
              type: 'spring',
              bounce: 0.45,
              duration: 0.35,
            }}
            aria-hidden="true"
          >
            {player}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
