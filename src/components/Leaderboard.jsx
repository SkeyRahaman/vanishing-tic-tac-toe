import { useRef, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

/**
 * Leaderboard — sticky glass bar showing scores + active player indicator.
 */
export default function Leaderboard({ scores, currentPlayer, gameNum, difficulty, onToggleDifficulty }) {
  const [bumpP1, setBumpP1] = useState(false);
  const [bumpP2, setBumpP2] = useState(false);
  const prevScores = useRef(scores);

  useEffect(() => {
    if (scores.X > prevScores.current.X) {
      setBumpP1(true);
      setTimeout(() => setBumpP1(false), 600);
    }
    if (scores.O > prevScores.current.O) {
      setBumpP2(true);
      setTimeout(() => setBumpP2(false), 600);
    }
    prevScores.current = scores;
  }, [scores]);

  const p1Active = currentPlayer === 'X';
  const p2Active = currentPlayer === 'O';

  return (
    <header
      className="leaderboard glass"
      role="banner"
      aria-label="Game leaderboard"
    >
      {/* Player 1 */}
      <div className={`leaderboard__player leaderboard__player--p1${p1Active ? ' leaderboard__player--active' : ''}`}>
        <span className="leaderboard__name">You (X)</span>
        <motion.span
          key={scores.X}
          className={`leaderboard__score${bumpP1 ? ' bump' : ''}`}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.35 }}
          aria-label={`Player 1 score: ${scores.X}`}
        >
          {scores.X}
        </motion.span>
        <div className="leaderboard__indicator" aria-hidden="true" />
      </div>

      {/* Centre divider with difficulty toggle */}
      <div className="leaderboard__divider">
        <div className="difficulty-pill" role="group" aria-label="Select Difficulty">
          <button
            type="button"
            className={`difficulty-pill__btn ${difficulty === 'easy' ? 'difficulty-pill__btn--easy-active' : ''}`}
            onClick={() => onToggleDifficulty('easy')}
            aria-pressed={difficulty === 'easy'}
          >
            Easy
          </button>
          <button
            type="button"
            className={`difficulty-pill__btn ${difficulty === 'hard' ? 'difficulty-pill__btn--hard-active' : ''}`}
            onClick={() => onToggleDifficulty('hard')}
            aria-pressed={difficulty === 'hard'}
          >
            Hard
          </button>
        </div>
        <span className="leaderboard__game">Game {gameNum}</span>
      </div>

      {/* Player 2 */}
      <div className={`leaderboard__player leaderboard__player--p2${p2Active ? ' leaderboard__player--active' : ''}`}>
        <span className="leaderboard__name">CPU (O)</span>
        <motion.span
          key={scores.O}
          className={`leaderboard__score${bumpP2 ? ' bump' : ''}`}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.35 }}
          aria-label={`Player 2 score: ${scores.O}`}
        >
          {scores.O}
        </motion.span>
        <div className="leaderboard__indicator" aria-hidden="true" />
      </div>
    </header>
  );
}
