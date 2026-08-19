import { motion, AnimatePresence } from 'motion/react';

/**
 * GameStatus — turn/status banner below the board.
 */
export default function GameStatus({ currentPlayer, winner, isThinking, loading }) {
  let text = '';
  let showDots = false;

  if (loading) {
    text = 'Loading AI…';
    showDots = true;
  } else if (winner) {
    text = winner === 'X' ? '🎉 You win!' : '🤖 CPU wins!';
  } else if (isThinking) {
    text = 'CPU is thinking';
    showDots = true;
  } else {
    text = currentPlayer === 'X' ? 'Your turn' : 'CPU\'s turn';
  }

  return (
    <div className="game-status glass" role="status" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.span
          key={text}
          className="game-status__text"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {text}
          {showDots && (
            <span className="game-status__dots" aria-hidden="true">
              <span className="game-status__dot" />
              <span className="game-status__dot" />
              <span className="game-status__dot" />
            </span>
          )}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
