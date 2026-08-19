import { motion } from 'motion/react';

/**
 * RulesPopup — glassmorphism modal shown on first load explaining the game rules.
 * Dismissed by the "Let's Play" button.
 */
export default function RulesPopup({ onDismiss }) {
  return (
    <motion.div
      className="rules-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      role="dialog"
      aria-modal="true"
      aria-label="Game rules"
    >
      <motion.div
        className="rules-card glass"
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
      >
        <span className="rules-card__emoji" aria-hidden="true">📜</span>
        <h2 className="rules-card__title">How to Play</h2>
        <p className="rules-card__subtitle">Vanishing Marks Tic-Tac-Toe</p>

        <ul className="rules-card__list">
          <li>
            <span className="rules-card__bullet" aria-hidden="true">✦</span>
            Place your mark (<strong style={{ color: 'var(--p1-color)' }}>X</strong>) on the 3×3 grid
          </li>
          <li>
            <span className="rules-card__bullet" aria-hidden="true">✦</span>
            Each player can hold only <strong>3 marks</strong> on the board at a time
          </li>
          <li>
            <span className="rules-card__bullet" aria-hidden="true">✦</span>
            When a 4th mark is placed, your <strong>oldest mark vanishes</strong>
          </li>
          <li>
            <span className="rules-card__bullet" aria-hidden="true">✦</span>
            First to get <strong>3 in a row</strong> wins — horizontal, vertical, or diagonal
          </li>
          <li>
            <span className="rules-card__bullet" aria-hidden="true">✦</span>
            You play as <strong style={{ color: 'var(--p1-color)' }}>X</strong>, the CPU plays as <strong style={{ color: 'var(--p2-color)' }}>O</strong>
          </li>
        </ul>

        <motion.button
          className="rules-card__btn"
          onClick={onDismiss}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.3 }}
        >
          Let's Play
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
