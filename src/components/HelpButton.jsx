import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * HelpButton — floating "?" button pinned to the bottom-right.
 * Toggles a popup with a cheeky "impossible to win" message.
 */
export default function HelpButton({ difficulty = 'easy' }) {
  const [isOpen, setIsOpen] = useState(false);

  const isHard = difficulty === 'hard';

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        className="help-fab glass"
        onClick={() => setIsOpen(v => !v)}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.08 }}
        transition={{ type: 'spring', bounce: 0.5, duration: 0.3 }}
        aria-label="Help"
        aria-expanded={isOpen}
        id="help-button"
      >
        ?
      </motion.button>

      {/* Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="help-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="help-card glass"
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.45 }}
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Help information"
            >
              {isHard ? (
                <>
                  <span className="help-card__emoji" aria-hidden="true">🤡</span>
                  <h2 className="help-card__title">Oh, you need help?</h2>
                  <p className="help-card__text">
                    Here's the thing — in <strong>Hard Mode</strong>, you <em>literally</em> cannot win. 
                    The CPU has solved every possible move in this game. Every. Single. One.
                  </p>
                  <p className="help-card__text" style={{ marginTop: 0 }}>
                    It's not a skill issue (okay maybe a little). It's just 
                    <strong style={{ color: 'var(--p1-color)' }}> mathematically impossible</strong>. 
                    The universe decided you lose before you were born.
                  </p>
                  <p className="help-card__text" style={{ marginTop: 0, color: 'var(--text-muted)' }}>
                    Thanks for wasting your time though 😏 (Switch to Easy Mode if you actually want a shot!)
                  </p>
                  <motion.button
                    className="help-card__btn"
                    onClick={() => setIsOpen(false)}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: 'spring', bounce: 0.5, duration: 0.3 }}
                  >
                    I'll keep losing, thanks
                  </motion.button>
                </>
              ) : (
                <>
                  <span className="help-card__emoji" aria-hidden="true">🎲</span>
                  <h2 className="help-card__title" style={{ color: 'var(--p1-color)' }}>Easy Mode Active</h2>
                  <p className="help-card__text">
                    The CPU is taking it easy on you and only makes optimal moves ~50% of the time. 
                    You actually have a fighting chance here!
                  </p>
                  <p className="help-card__text" style={{ marginTop: 0 }}>
                    Remember: each player holds only <strong>3 marks</strong>. When a 4th is placed, your oldest mark vanishes!
                  </p>
                  <p className="help-card__text" style={{ marginTop: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Think you're ready for true despair? Switch to <strong>Hard Mode</strong> above.
                  </p>
                  <motion.button
                    className="help-card__btn"
                    onClick={() => setIsOpen(false)}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: 'spring', bounce: 0.5, duration: 0.3 }}
                  >
                    Got it, let's play
                  </motion.button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
