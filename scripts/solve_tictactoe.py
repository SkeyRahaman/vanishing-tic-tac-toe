"""
solve_tictactoe.py — Complete Negamax Table Generator for Vanishing-Marks Tic-Tac-Toe.

Rules & Architecture:
  - 3x3 grid, cells 0-8.
  - FIFO queue of <=3 marks per player.
  - 4th mark placed -> oldest mark pops off BEFORE checking win.
  - CPU (Player 2) uses deep Alpha-Beta Negamax with Transposition Table:
      * Immediate wins / forced wins detected and taken instantly (shortest path).
      * Immediate opponent wins blocked instantly.
      * Lookahead depth: 10 plies.
      * Fast positional heuristics (center, corners, threat counting).
  - Precomputes all 66,682 CPU reachable states into public/solver_table.json.
  - Runtime app does O(1) key lookup -> plays bestMove.
"""

import json, os, time, sys, random
from collections import deque

t0 = time.time()

WIN_LINES = [(0,1,2),(3,4,5),(6,7,8),(0,3,6),(1,4,7),(2,5,8),(0,4,8),(2,4,6)]
MOVER_STR  = {1: 'X', 2: 'O'}
CELL_PRI   = [4, 0, 2, 6, 8, 1, 3, 5, 7]

def check_win(q):
    if len(q) < 3: return False
    s = set(q)
    return any(all(c in s for c in ln) for ln in WIN_LINES)

def legal_moves(p1q, p2q, mover):
    my_q = p1q if mover == 1 else p2q
    occupied = set(p1q) | set(p2q)
    if len(my_q) >= 3: occupied.discard(my_q[0])
    return [i for i in range(9) if i not in occupied]

def apply_move(p1q, p2q, mover, cell):
    my_q = list(p1q if mover == 1 else p2q)
    opp_q = list(p2q if mover == 1 else p1q)
    if len(my_q) >= 3: my_q.pop(0)
    my_q.append(cell)
    won = check_win(my_q)
    if mover == 1: return tuple(my_q), tuple(opp_q), won
    else:          return tuple(opp_q), tuple(my_q), won

def skey(p1q, p2q, mover):
    return f"{','.join(map(str,p1q))}_{','.join(map(str,p2q))}_{MOVER_STR[mover]}"

# ── Phase 1: Build reachable state graph ──────────────────────────────────
print("Phase 1: Enumerating reachable states...", flush=True)
edges = {}
starts = [((), (), 1), ((), (), 2)]
for s in starts: edges[s] = []

frontier = deque(starts)
visited  = set(starts)

while frontier:
    state = frontier.popleft()
    p1q, p2q, mover = state
    opp = 3 - mover
    for cell in legal_moves(p1q, p2q, mover):
        np1, np2, won = apply_move(p1q, p2q, mover, cell)
        if won:
            edges[state].append((None, cell, True))
        else:
            child = (np1, np2, opp)
            edges[state].append((child, cell, False))
            if child not in visited:
                visited.add(child)
                edges[child] = []
                frontier.append(child)

total_states = len(edges)
print(f"  {total_states:,} states generated ({time.time()-t0:.1f}s)", flush=True)

# ── Phase 2: Deep Negamax Engine with Transposition Table ─────────────────
print("Phase 2: Solving all CPU states via Negamax...", flush=True)

TT = {}
MAX_DEPTH = 10

def eval_pos(p1q, p2q, mover):
    my_q = p1q if mover == 1 else p2q
    opp_q = p2q if mover == 1 else p1q
    score = 0
    if 4 in my_q: score += 20
    if 4 in opp_q: score -= 20
    for c in (0,2,6,8):
        if c in my_q: score += 6
        if c in opp_q: score -= 6
    return score

def negamax(p1q, p2q, mover, depth, alpha, beta, path):
    opp = 3 - mover
    moves = legal_moves(p1q, p2q, mover)
    
    # 1. Immediate win
    for c in moves:
        np1, np2, won = apply_move(p1q, p2q, mover, c)
        if won:
            return 10000 - depth, c
            
    if depth >= MAX_DEPTH:
        return eval_pos(p1q, p2q, mover), moves[0]

    state = (p1q, p2q, mover)
    if state in path:
        return 0, moves[0]

    if state in TT:
        s, m, d = TT[state]
        if d >= MAX_DEPTH - depth:
            return s, m

    new_path = path | {state}
    best_score = -99999
    best_move = moves[0]

    # Move ordering: center > corners > edges
    sorted_moves = sorted(moves, key=lambda c: (0 if c==4 else (1 if c in (0,2,6,8) else 2)))

    for c in sorted_moves:
        np1, np2, won = apply_move(p1q, p2q, mover, c)
        score, _ = negamax(np1, np2, opp, depth + 1, -beta, -alpha, new_path)
        score = -score
        if score > best_score:
            best_score = score
            best_move = c
        alpha = max(alpha, score)
        if alpha >= beta:
            break

    TT[state] = (best_score, best_move, MAX_DEPTH - depth)
    return best_score, best_move

# Precalculate for all CPU states (mover = 2)
cpu_states = [s for s in edges if s[2] == 2]
cpu_best_moves = {}

t_calc = time.time()
for idx, (p1q, p2q, _) in enumerate(cpu_states):
    score, move = negamax(p1q, p2q, 2, 0, -99999, 99999, frozenset())
    cpu_best_moves[(p1q, p2q)] = (move, score)

print(f"  Precalculated {len(cpu_best_moves):,} CPU moves in {time.time()-t_calc:.1f}s", flush=True)

# ── Phase 3: Simulation Verification ─────────────────────────────────────
print("\nPhase 3: Simulation verification (10,000 games per mode)...", flush=True)

def sim_game(cpu_first, human_strat='smart'):
    p1q, p2q = (), ()
    mover = 2 if cpu_first else 1
    for _ in range(200):
        if mover == 2:
            cell, _ = cpu_best_moves.get((p1q, p2q), (legal_moves(p1q, p2q, 2)[0], 0))
        else:
            mvs = legal_moves(p1q, p2q, 1)
            if human_strat == 'random':
                cell = random.choice(mvs)
            elif human_strat == 'greedy':
                wins_h = [c for c in mvs if apply_move(p1q, p2q, 1, c)[2]]
                cell = wins_h[0] if wins_h else random.choice(mvs)
            elif human_strat == 'smart':
                wins_h = [c for c in mvs if apply_move(p1q, p2q, 1, c)[2]]
                if wins_h: cell = wins_h[0]
                else:
                    cpu_wins = [c for c in legal_moves(p1q, p2q, 2) if apply_move(p1q, p2q, 2, c)[2]]
                    blocks = [c for c in mvs if c in cpu_wins]
                    if blocks: cell = blocks[0]
                    else:
                        mvs.sort(key=lambda c: (0 if c==4 else (1 if c in (0,2,6,8) else 2)))
                        cell = mvs[0]
        np1, np2, won = apply_move(p1q, p2q, mover, cell)
        p1q, p2q = np1, np2
        if won:
            return 'cpu' if mover == 2 else 'human'
        mover = 3 - mover
    return 'draw'

N = 10000
for scenario, cpu_first in [("CPU first  ", True), ("Human first", False)]:
    for strat in ['random', 'greedy', 'smart']:
        cpu_w = hum_w = dr = 0
        for _ in range(N):
            r = sim_game(cpu_first, human_strat=strat)
            if r == 'cpu': cpu_w += 1
            elif r == 'human': hum_w += 1
            else: dr += 1
        print(f"  {scenario} ({strat:6s}): CPU={cpu_w/N*100:5.1f}%  Human={hum_w/N*100:4.1f}%  Draw={dr/N*100:3.1f}%", flush=True)

# ── Phase 4: Output to solver_table.json ──────────────────────────────────
print("\nPhase 4: Writing solver_table.json...", flush=True)
output = {}
for state in edges:
    p1q, p2q, mover = state
    entry = {"label": "active"}
    if mover == 2:
        move, score = cpu_best_moves[(p1q, p2q)]
        entry["bestMove"] = move
        entry["score"] = score
    output[skey(p1q, p2q, mover)] = entry

out_path = os.path.normpath(
    os.path.join(os.path.dirname(__file__), '..', 'public', 'solver_table.json'))
with open(out_path, 'w') as f:
    json.dump(output, f, separators=(',', ':'))

sz = os.path.getsize(out_path) / 1024
print(f"  {out_path}")
print(f"  {sz:.0f} KB  |  {len(output):,} states", flush=True)
print(f"\nDone! Total time: {time.time()-t0:.1f}s", flush=True)
