import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * HelpButton — floating "?" button pinned to the bottom-right.
 * Toggles a popup with a cheeky "impossible to win" message.
 */
export default function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);

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
              <span className="help-card__emoji" aria-hidden="true">🤡</span>
              <h2 className="help-card__title">Oh, you need help?</h2>
              <p className="help-card__text">
                Here's the thing — you <em>literally</em> cannot win. 
                The CPU has solved every possible move in this game. 
                Every. Single. One.
              </p>
              <p className="help-card__text" style={{ marginTop: 0 }}>
                It's not a skill issue (okay maybe a little). It's just 
                <strong style={{ color: 'var(--p1-color)' }}> mathematically impossible</strong>. 
                The universe decided you lose before you were born.
              </p>
              <p className="help-card__text" style={{ marginTop: 0, color: 'var(--text-muted)' }}>
                Thanks for wasting your time though 😏
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
