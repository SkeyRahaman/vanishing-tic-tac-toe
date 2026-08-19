import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import './index.css';
import './App.css';

import Leaderboard from './components/Leaderboard';
import Board from './components/Board';
import GameStatus from './components/GameStatus';
import WinOverlay from './components/WinOverlay';
import RulesPopup from './components/RulesPopup';
import HelpButton from './components/HelpButton';

import { createInitialState, applyMove, getCellMap, encodeGameState, getLegalMoves, getEasyCpuMove, PLAYER1, PLAYER2 } from './engine/gameState';

const CPU_THINK_DELAY_MS = 600; // ms before CPU places its mark

export default function App() {
  const [solverTable, setSolverTable] = useState(null);
  const [loadingTable, setLoadingTable] = useState(true);

  // Game state
  const [difficulty, setDifficulty] = useState('easy'); // 'easy' | 'hard'
  const [gameState, setGameState] = useState(() => createInitialState(PLAYER1));
  const [scores, setScores] = useState({ [PLAYER1]: 0, [PLAYER2]: 0 });
  const [gameNum, setGameNum] = useState(1);
  const [firstMoverForNextGame, setFirstMoverForNextGame] = useState(PLAYER2); // alternates
  const [isThinking, setIsThinking] = useState(false);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [overlayWinner, setOverlayWinner] = useState(null);
  const [showRules, setShowRules] = useState(true);

  const cpuTimerRef = useRef(null);

  // ─── Load solver table on mount ─────────────────────────────────
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}solver_table.json`)
      .then(r => r.json())
      .then(data => {
        setSolverTable(data);
        setLoadingTable(false);
      })
      .catch(err => {
        console.error('Failed to load solver table:', err);
        setLoadingTable(false);
      });
  }, []);

  // ─── Difficulty Toggle Handler (Starts a new game with user first move) ────
  const handleToggleDifficulty = useCallback((newDifficulty) => {
    if (newDifficulty === difficulty) return;
    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
    setIsThinking(false);
    setShowWinOverlay(false);
    setOverlayWinner(null);
    setDifficulty(newDifficulty);
    // Start fresh game with User (PLAYER1) moving first
    setGameState(createInitialState(PLAYER1));
    setFirstMoverForNextGame(PLAYER2);
  }, [difficulty]);

  // ─── CPU auto-play ───────────────────────────────────────────────
  useEffect(() => {
    if (
      !solverTable ||
      gameState.winner ||
      gameState.currentPlayer !== PLAYER2 ||
      showWinOverlay
    ) return;

    setIsThinking(true);
    cpuTimerRef.current = setTimeout(() => {
      setGameState(prev => {
        if (prev.currentPlayer !== PLAYER2 || prev.winner) return prev;

        const stateKey = encodeGameState(prev);
        const entry = solverTable[stateKey];

        let cell = null;

        if (difficulty === 'easy') {
          // Easy mode: beatable casual AI with missed blocks & casual moves
          cell = getEasyCpuMove(prev, solverTable);
        } else {
          // Hard mode: unbeatable lookup
          cell = entry?.bestMove;
        }

        if (cell === undefined || cell === null) {
          // Fallback: pick a random legal move
          const legal = getLegalMoves(prev);
          cell = legal[Math.floor(Math.random() * legal.length)];
          console.warn('CPU fallback move:', stateKey);
        }

        // Board snapshot for logging
        const { queues } = prev;
        const cellMap = getCellMap(prev);
        const board = Array.from({ length: 9 }, (_, i) => cellMap.get(i) || '.');
        console.group(`%c🤖 CPU move (${difficulty}) → cell ${cell}`, 'color:#ff6b9d;font-weight:bold');
        console.log('Board before:', `\n${board.slice(0,3).join(' ')}\n${board.slice(3,6).join(' ')}\n${board.slice(6,9).join(' ')}`);
        console.log('P1 queue (X):', [...queues[PLAYER1]]);
        console.log('P2 queue (O):', [...queues[PLAYER2]]);
        console.log('State key:', stateKey);
        console.log('Table entry:', entry);
        console.groupEnd();

        return applyMove(prev, cell);
      });
      setIsThinking(false);
    }, CPU_THINK_DELAY_MS);

    return () => clearTimeout(cpuTimerRef.current);
  }, [gameState, solverTable, showWinOverlay, difficulty]);

  // ─── Win detection → show overlay + update score ─────────────────
  useEffect(() => {
    if (gameState.winner && !showWinOverlay) {
      setScores(prev => ({
        ...prev,
        [gameState.winner]: prev[gameState.winner] + 1,
      }));
      setOverlayWinner(gameState.winner);
      setShowWinOverlay(true);
    }
  }, [gameState.winner]);

  // ─── Start new game after overlay ───────────────────────────────
  const handleOverlayDone = useCallback(() => {
    setShowWinOverlay(false);
    setOverlayWinner(null);
    setGameNum(n => n + 1);
    // Alternate who goes first each game
    setGameState(createInitialState(firstMoverForNextGame));
    setFirstMoverForNextGame(fm => fm === PLAYER1 ? PLAYER2 : PLAYER1);
  }, [firstMoverForNextGame]);

  // ─── Human move ──────────────────────────────────────────────────
  const handleCellClick = useCallback((cellIndex) => {
    if (
      gameState.winner ||
      gameState.currentPlayer !== PLAYER1 ||
      isThinking ||
      loadingTable
    ) return;

    const { queues } = gameState;
    const stateKey = encodeGameState(gameState);
    const stateLabel = solverTable?.[stateKey] || { label: 'MISSING', distance: -1 };
    const cellMap = getCellMap(gameState);
    const board = Array.from({ length: 9 }, (_, i) => cellMap.get(i) || '.');
    console.group(`%c🧑 Human move → cell ${cellIndex}`, 'color:#00e5ff;font-weight:bold');
    console.log('Board before:', `\n${board.slice(0,3).join(' ')}\n${board.slice(3,6).join(' ')}\n${board.slice(6,9).join(' ')}`);
    console.log('P1 queue (X):', [...queues[PLAYER1]]);
    console.log('P2 queue (O):', [...queues[PLAYER2]]);
    console.log('State key:', stateKey);
    console.log('State label in table:', stateLabel);
    console.log('Chosen cell:', cellIndex);
    console.groupEnd();

    setGameState(prev => applyMove(prev, cellIndex));
  }, [gameState, isThinking, loadingTable, solverTable]);

  const boardDisabled =
    gameState.currentPlayer !== PLAYER1 ||
    !!gameState.winner ||
    isThinking ||
    loadingTable;

  // ─── Loading screen ───────────────────────────────────────────────
  if (loadingTable) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" aria-hidden="true" />
        <p className="loading-screen__title">Loading AI…</p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* ─── Game Header ─── */}
      <div className="app-header">
        <h1 className="app-header__title">Tic-Tac-Toe</h1>
        <p className="app-header__subtitle">Vanishing Marks</p>
      </div>

      <Leaderboard
        scores={scores}
        currentPlayer={gameState.currentPlayer}
        gameNum={gameNum}
        difficulty={difficulty}
        onToggleDifficulty={handleToggleDifficulty}
      />

      <main className="game-area" role="main">
        <GameStatus
          currentPlayer={gameState.currentPlayer}
          winner={gameState.winner}
          isThinking={isThinking}
          loading={loadingTable}
        />

        <Board
          state={gameState}
          onCellClick={handleCellClick}
          disabled={boardDisabled}
        />
      </main>

      {/* ─── Help FAB ─── */}
      <HelpButton difficulty={difficulty} />

      {/* ─── Win Overlay ─── */}
      <AnimatePresence>
        {showWinOverlay && (
          <WinOverlay winner={overlayWinner} onDone={handleOverlayDone} />
        )}
      </AnimatePresence>

      {/* ─── Rules Popup (shown on first load) ─── */}
      <AnimatePresence>
        {showRules && (
          <RulesPopup onDismiss={() => setShowRules(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
