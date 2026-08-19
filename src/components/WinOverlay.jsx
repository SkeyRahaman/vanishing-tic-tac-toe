import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';

/**
 * WinOverlay — full-screen announcement + confetti on win.
 * Auto-dismisses after 3 seconds.
 */
export default function WinOverlay({ winner, onDone }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!winner) return;

    // Fire confetti
    const isP1 = winner === 'X';
    const colors = isP1
      ? ['#00e5ff', '#00bcd4', '#ffffff']
      : ['#ff6b9d', '#ff4081', '#ffffff'];

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors,
      gravity: 0.9,
      scalar: 1.1,
    });

    // Second burst
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 120,
        origin: { x: 0.2, y: 0.4 },
        colors,
        gravity: 1,
      });
      confetti({
        particleCount: 60,
        spread: 120,
        origin: { x: 0.8, y: 0.4 },
        colors,
        gravity: 1,
      });
    }, 300);

    timerRef.current = setTimeout(onDone, 3000);
    return () => clearTimeout(timerRef.current);
  }, [winner, onDone]);

  if (!winner) return null;

  const isP1 = winner === 'X';

  return (
    <motion.div
      className="win-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      role="dialog"
      aria-modal="true"
      aria-label={isP1 ? 'You win!' : 'CPU wins!'}
    >
      <motion.div
        className="win-overlay__card glass"
        initial={{ scale: 0.7, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0.4, duration: 0.5 }}
      >
        <span className="win-overlay__emoji" aria-hidden="true">
          {isP1 ? '🏆' : '🤖'}
        </span>
        <h2
          className="win-overlay__title"
          style={{ color: isP1 ? 'var(--p1-color)' : 'var(--p2-color)' }}
        >
          {isP1 ? 'You Win!' : 'CPU Wins!'}
        </h2>
        <p className="win-overlay__subtitle">
          {isP1 ? 'Excellent strategy!' : 'Better luck next round!'}
        </p>

        {/* Progress bar — shows time until next game starts */}
        <div className="win-overlay__bar">
          <div className={`win-overlay__bar-fill win-overlay__bar-fill--${isP1 ? 'p1' : 'p2'}`} />
        </div>
        <p className="win-overlay__subtitle" style={{ fontSize: '0.75rem' }}>
          Next game starting…
        </p>
      </motion.div>
    </motion.div>
  );
}
