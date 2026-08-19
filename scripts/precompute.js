/**
 * precompute.js — Build-time script to generate the solver lookup table.
 *
 * Run with: node scripts/precompute.js
 * Or: npm run precompute
 *
 * Outputs: public/solver_table.json
 *
 * This is a CommonJS-compatible version of the solver that runs in Node.js.
 * The result is a static JSON file served to all users — no client-side computation needed.
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

const PLAYER1 = 'X';
const PLAYER2 = 'O';

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
  const occupied = new Set([...p1q, ...p2q]);
  if (myQ.length >= 3) occupied.delete(myQ[0]);
  const moves = [];
  for (let i = 0; i < 9; i++) {
    if (!occupied.has(i)) moves.push(i);
  }
  return moves;
}

function applyMoveRaw(p1q, p2q, mover, cell) {
  let myQ = mover === PLAYER1 ? [...p1q] : [...p2q];
  let oppQ = mover === PLAYER1 ? [...p2q] : [...p1q];
  if (myQ.length >= 3) myQ = myQ.slice(1);
  myQ = [...myQ, cell];
  const won = checkWin(myQ);
  const newP1q = mover === PLAYER1 ? myQ : oppQ;
  const newP2q = mover === PLAYER1 ? oppQ : myQ;
  return { newP1q, newP2q, won };
}

console.time('solve');
console.log('Building game graph...');

// Phase 1: Build full reachable graph
const graph = new Map();
const worklist = [];

// Seed from BOTH possible first movers so the table covers CPU-goes-first games
const initialKeyP1 = encodeState([], [], PLAYER1);
const initialKeyP2 = encodeState([], [], PLAYER2);

if (!graph.has(initialKeyP1)) {
  graph.set(initialKeyP1, { p1q: [], p2q: [], mover: PLAYER1, children: [], terminal: false });
  worklist.push(initialKeyP1);
}
if (!graph.has(initialKeyP2)) {
  graph.set(initialKeyP2, { p1q: [], p2q: [], mover: PLAYER2, children: [], terminal: false });
  worklist.push(initialKeyP2);
}

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
        p1q: newP1q, p2q: newP2q,
        mover: won ? mover : opponent,
        children: [],
        terminal: won,
      };
      graph.set(childKey, childNode);
      if (!won) worklist.push(childKey);
    }
    node.children.push({ key: childKey, cell });
  }
}

console.log(`Graph built: ${graph.size} states`);

// Phase 2: Attractor fixpoint labeling
const labels = new Map();

// Initialize terminal wins
for (const [key, node] of graph) {
  if (node.terminal) labels.set(key, { label: 'win', distance: 0 });
}

// Build reverse graph
const parents = new Map();
for (const [key] of graph) parents.set(key, []);
for (const [key, node] of graph) {
  for (const { key: ck } of node.children) {
    parents.get(ck).push(key);
  }
}

// Backward propagation
const backlog = [...labels.keys()];
let bi = 0;

while (bi < backlog.length) {
  const key = backlog[bi++];

  for (const parentKey of parents.get(key)) {
    if (labels.has(parentKey)) continue;

    const parentNode = graph.get(parentKey);
    const allChildren = parentNode.children;

    let hasWinChild = false;
    let allChildrenLabeled = true;
    let allWinForOpponent = true;
    let minDist = Infinity;
    let maxDist = 0;

    for (const { key: ck } of allChildren) {
      const cl = labels.get(ck);
      if (!cl) { allChildrenLabeled = false; allWinForOpponent = false; continue; }

      if (cl.label === 'lose') {
        // Opponent loses → WIN for parent mover
        hasWinChild = true;
        if (cl.distance + 1 < minDist) minDist = cl.distance + 1;
        allWinForOpponent = false;
      } else if (cl.label === 'win') {
        // Opponent wins → bad for parent
        if (cl.distance + 1 > maxDist) maxDist = cl.distance + 1;
      } else {
        // draw
        allWinForOpponent = false;
      }
    }

    if (hasWinChild) {
      labels.set(parentKey, { label: 'win', distance: minDist });
      backlog.push(parentKey);
    } else if (allChildrenLabeled && allWinForOpponent && allChildren.length > 0) {
      labels.set(parentKey, { label: 'lose', distance: maxDist });
      backlog.push(parentKey);
    }
  }
}

// Everything unlabeled = draw
for (const [key] of graph) {
  if (!labels.has(key)) labels.set(key, { label: 'draw', distance: 0 });
}

const wins = [...labels.values()].filter(v => v.label === 'win').length;
const loses = [...labels.values()].filter(v => v.label === 'lose').length;
const draws = [...labels.values()].filter(v => v.label === 'draw').length;

console.log(`Labels: ${wins} wins, ${loses} losses, ${draws} draws`);
console.timeEnd('solve');

// Convert Map to plain object for JSON serialization
const output = {};
for (const [key, val] of labels) {
  output[key] = val;
}

const outPath = resolve(__dirname, '../public/solver_table.json');
writeFileSync(outPath, JSON.stringify(output));
console.log(`Written to ${outPath} (${(JSON.stringify(output).length / 1024).toFixed(1)} KB)`);
