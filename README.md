# ⭕ Vanishing Tic-Tac-Toe ❌

> A modern, fluid Tic-Tac-Toe web game with vanishing marks and an unbeatable mathematical solver.

🌐 **Live Demo:** [https://skeyrahaman.github.io/vanishing-tic-tac-toe/](https://skeyrahaman.github.io/vanishing-tic-tac-toe/)

---

## 🎮 How to Play

1. **3×3 Grid:** Players take turns placing marks (**X** for You, **O** for CPU).
2. **3 Marks Maximum:** Each player can only hold **3 marks** on the board at a time.
3. **Vanishing Mechanic:** Placing a 4th mark causes your **oldest mark to vanish** before checking for wins.
4. **Win Condition:** Align **3 standing marks in a row** (horizontal, vertical, or diagonal) to win!

---

## ⚡ Game Modes

- 🎲 **Easy Mode (Default):** A casual, beatable AI that plays casually, occasionally misses blocks, and gives you a fighting chance (~50%+ win rate for attentive players).
- 🤖 **Hard Mode (Unbeatable):** Uses a complete, precomputed **Negamax game-tree solver** (66,682 states) with alpha-beta pruning and transposition tables. It is **mathematically impossible to defeat** the CPU in this mode.

*Switch between modes anytime using the difficulty toggle in the leaderboard header — each toggle starts a fresh game with you moving first!*

---

## ✨ Features

- **Apple-Inspired Design:** Glassmorphism materials (`backdrop-filter`), tailored HSL palette, dark theme, and fluid micro-animations.
- **Physical Spring Animations:** Seamless gesture feedback and interruptible spring physics powered by `motion`.
- **Precomputed Solver Table:** Instant $O(1)$ optimal move lookups without latency.
- **Responsive & Accessible:** Built for touch screens and desktops alike, with full `prefers-reduced-motion` support.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Vanilla CSS
- **Animations:** Motion (`motion/react`), Canvas Confetti
- **Solver Engine:** Python 3 (Negamax with Alpha-Beta Pruning)
- **Deployment:** GitHub Pages via GitHub Actions

---

## 🚀 Local Development

```bash
# Clone the repository
git clone https://github.com/SkeyRahaman/vanishing-tic-tac-toe.git
cd vanishing-tic-tac-toe

# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for production
npm run build
```

---

## 📜 License

MIT License. Free to play and explore!
