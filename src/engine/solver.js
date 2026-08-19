/**
 * solver.js — Full game-tree solver for Tic-Tac-Toe with vanishing marks.
 *
 * Implements the exact algorithm from the spec:
 * 1. Build the reachable state graph with an explicit worklist (no recursion).
 * 2. Label states by attractor fixpoint, treating infinite play as draw.
 *    - WIN: mover has a move leading to a LOSE state for opponent
 *    - LOSE: all moves lead to WIN states for opponent
 *    - DRAW: everything else
 * 3. Per turn: pick from best non-empty class (win > draw > lose),
 *    in lose keep only max-distance moves.
 *
 * This module is used by scripts/precompute.js at build time.
 * It exports the solve() function which returns the full lookup table.
 */

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

const PLAYER1 = 'X';
const PLAYER2 = 'O';
const PLAYERS = [PLAYER1, PLAYER2];

function encodeState(p1q, p2q, mover) {
  return `${p1q.join(',')}_${p2q.join(',')}_${mover}`;
}

function checkWin(queue) {
  if (queue.length < 3) return false;
  const set = new Set(queue);
  for (const line of WIN_LINES) {
    if (line.every(c => set.has(c))) return true;
  }
  return false;
}

function getLegalMoves(p1q, p2q, mover) {
  const myQ = mover === PLAYER1 ? p1q : p2q;

  // Cells currently occupied
  const occupied = new Set([...p1q, ...p2q]);

  // If my queue is full, oldest will be removed → unblock that cell
  if (myQ.length >= 3) {
    occupied.delete(myQ[0]);
  }

  const moves = [];
  for (let i = 0; i < 9; i++) {
    if (!occupied.has(i)) moves.push(i);
  }
  return moves;
}

function applyMoveRaw(p1q, p2q, mover, cell) {
  let myQ = mover === PLAYER1 ? [...p1q] : [...p2q];
  let oppQ = mover === PLAYER1 ? [...p2q] : [...p1q];

  // Remove oldest if full
  if (myQ.length >= 3) myQ = myQ.slice(1);

  // Add new mark
  myQ = [...myQ, cell];

  const won = checkWin(myQ);

  const newP1q = mover === PLAYER1 ? myQ : oppQ;
  const newP2q = mover === PLAYER1 ? oppQ : myQ;

  return { newP1q, newP2q, won };
}

/**
 * Solve the entire game tree.
 * Returns a Map: stateKey → { label: 'win'|'draw'|'lose', distance: number }
 */
export function solve() {
  // Phase 1: Build the full reachable graph
  // node: { p1q, p2q, mover, children: [stateKey], terminal: bool, terminalLabel: 'win'|null }
  const graph = new Map(); // stateKey → node
  const worklist = [];

  // Seed from BOTH possible first movers
  const initialKeyP1 = encodeState([], [], PLAYER1);
  const initialKeyP2 = encodeState([], [], PLAYER2);

  graph.set(initialKeyP1, { p1q: [], p2q: [], mover: PLAYER1, children: [], terminal: false, terminalLabel: null });
  worklist.push(initialKeyP1);
  graph.set(initialKeyP2, { p1q: [], p2q: [], mover: PLAYER2, children: [], terminal: false, terminalLabel: null });
  worklist.push(initialKeyP2);

  let wi = 0;
  while (wi < worklist.length) {
    const key = worklist[wi++];
    const node = graph.get(key);
    const { p1q, p2q, mover } = node;

    const moves = getLegalMoves(p1q, p2q, mover);

    for (const cell of moves) {
      const { newP1q, newP2q, won } = applyMoveRaw(p1q, p2q, mover, cell);
      const opponent = mover === PLAYER1 ? PLAYER2 : PLAYER1;
      const childKey = encodeState(newP1q, newP2q, won ? mover : opponent);

      if (!graph.has(childKey)) {
        const childNode = {
          p1q: newP1q,
          p2q: newP2q,
          mover: won ? mover : opponent,
          children: [],
          terminal: won,
          terminalLabel: won ? 'win' : null, // win for the mover who just moved
        };
        graph.set(childKey, childNode);
        if (!won) worklist.push(childKey);
      }

      node.children.push({ key: childKey, cell });
    }
  }

  // Phase 2: Attractor fixpoint labeling
  // labels[key] = { label: 'win'|'lose'|'draw', distance: number }
  const labels = new Map();

  // Initialize terminal states
  for (const [key, node] of graph) {
    if (node.terminal) {
      // The mover WON — but in the graph this node is labeled from the winner's POV.
      // The KEY's mover is still the winner (we kept mover=winner after win).
      // From the PARENT's perspective (opponent of winner), this child is a LOSS.
      // We label terminal nodes as WIN for the player who completed the line.
      labels.set(key, { label: 'win', distance: 0 });
    }
  }

  // Build reverse graph: parentKey → [childKey]
  const parents = new Map();
  for (const [key] of graph) parents.set(key, []);
  for (const [key, node] of graph) {
    for (const { key: childKey } of node.children) {
      parents.get(childKey).push(key);
    }
  }

  // Worklist for backward propagation
  const backlog = [...labels.keys()];
  let bi = 0;

  while (bi < backlog.length) {
    const key = backlog[bi++];
    const { label: childLabel, distance: childDist } = labels.get(key);

    for (const parentKey of parents.get(key)) {
      if (labels.has(parentKey)) continue; // already determined

      const parentNode = graph.get(parentKey);

      // From parent's mover perspective: if child is 'win', that means
      // the child's mover won — which is the OPPONENT of parentNode.mover.
      // So from parent's mover perspective, this child is a LOSS for them.
      // If child is 'lose', this child is a WIN for parent's mover.

      // Determine what this child means for the parent mover:
      // childLabel is from the child's mover perspective.
      // The child's mover = opponent of parent's mover (since no win happened transitioning to child — unless terminal).
      // For terminal children: childLabel='win' means the CHILD's mover won = PARENT's opponent won = bad for parent.

      // Simpler framing: we track label from the perspective of the CURRENT node's mover.
      // A child with label='win' means the child's mover wins from there.
      // The child's mover is the opponent of the parent's mover.
      // So child='win' (opponent wins) → from parent mover's view: this is a LOSE child.
      // child='lose' (opponent loses) → from parent mover's view: this is a WIN child.

      // Let's count: how many children are determined?
      const allChildren = parentNode.children;
      let hasWinChild = false;    // child where opponent loses (good for parent)
      let allLoseChild = true;    // all children are wins for opponent (bad for parent)
      let maxDist = 0;
      let minDist = Infinity;

      for (const { key: ck } of allChildren) {
        const cl = labels.get(ck);
        if (!cl) { allLoseChild = false; continue; }

        if (cl.label === 'lose') {
          // Opponent loses from this child → WIN for parent mover
          hasWinChild = true;
          if (cl.distance + 1 < minDist) minDist = cl.distance + 1;
        } else if (cl.label === 'win') {
          // Opponent wins from this child → bad for parent
          if (cl.distance + 1 > maxDist) maxDist = cl.distance + 1;
        } else {
          // draw
          allLoseChild = false;
        }
      }

      if (hasWinChild) {
        labels.set(parentKey, { label: 'win', distance: minDist });
        backlog.push(parentKey);
      } else if (allLoseChild && allChildren.length > 0) {
        // All children are wins for opponent → parent mover loses
        labels.set(parentKey, { label: 'lose', distance: maxDist });
        backlog.push(parentKey);
      }
      // else: not yet determinable, will be revisited when more children labeled
    }
  }

  // Everything not labeled yet is a DRAW
  for (const [key] of graph) {
    if (!labels.has(key)) {
      labels.set(key, { label: 'draw', distance: 0 });
    }
  }

  return labels;
}

/**
 * Given the current game state, pick the best AI move using the lookup table.
 * @param {string[]} p1q - Player 1's queue (oldest first)
 * @param {string[]} p2q - Player 2's queue (oldest first)
 * @param {string} mover - current player (should be PLAYER2 / 'O')
 * @param {Map} lookupTable - result of solve()
 * @returns {number} - best cell index to play
 */
export function pickBestMove(p1q, p2q, mover, lookupTable) {
  const moves = getLegalMoves(p1q, p2q, mover);

  const wins = [], draws = [], loses = [];

  for (const cell of moves) {
    const { newP1q, newP2q, won } = applyMoveRaw(p1q, p2q, mover, cell);
    const opponent = mover === PLAYER1 ? PLAYER2 : PLAYER1;

    if (won) {
      wins.push({ cell, distance: 0 });
      continue;
    }

    const childKey = encodeState(newP1q, newP2q, opponent);
    const childLabel = lookupTable[childKey] || { label: 'draw', distance: 0 };

    // From child's mover (opponent) perspective:
    // child='lose' → opponent loses → we win
    // child='win'  → opponent wins → we lose
    // child='draw' → draw
    if (childLabel.label === 'lose') {
      wins.push({ cell, distance: childLabel.distance + 1 });
    } else if (childLabel.label === 'win') {
      loses.push({ cell, distance: childLabel.distance + 1 });
    } else {
      draws.push({ cell, distance: 0 });
    }
  }

  if (wins.length > 0) {
    return wins[Math.floor(Math.random() * wins.length)].cell;
  }
  if (draws.length > 0) {
    return draws[Math.floor(Math.random() * draws.length)].cell;
  }
  // All losing — pick max-distance moves (delay the loss)
  const maxDist = Math.max(...loses.map(m => m.distance));
  const maxMoves = loses.filter(m => m.distance === maxDist);
  return maxMoves[Math.floor(Math.random() * maxMoves.length)].cell;
}
