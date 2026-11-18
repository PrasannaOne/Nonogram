<div align="center">

# 🧩 Nonogram

<p>
  <a href="https://prasannaone.github.io/Nonogram/"><img src="https://img.shields.io/badge/▶_PLAY_NOW-PLAY_NONOGRAM-7189b8?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Play Nonogram" /></a>
</p>

**[Play Nonogram](https://prasannaone.github.io/Nonogram/)**

<p>
  <img src="https://img.shields.io/badge/Release-v61-7189b8?style=flat-square" alt="v61" />
  <img src="https://img.shields.io/badge/Platform-Mobile%20%26%20Desktop-0ea5e9?style=flat-square" alt="Mobile and desktop" />
  <img src="https://img.shields.io/badge/Runtime-HTML5%20%2B%20JavaScript-facc15?style=flat-square" alt="HTML5 and JavaScript" />
  <img src="https://img.shields.io/badge/Puzzles-Endless-8b5cf6?style=flat-square" alt="Endless puzzles" />
</p>

*One little grid. A fresh puzzle journey. No account, no fuss.*

</div>

---

## What is Nonogram?

Nonogram is a browser-based picture-logic puzzle game made by **Prasanna (PrasannaOne)**. Solve the numbered row and column clues to reveal each hidden pattern.

The game is designed around a direct-to-game experience: open the page and play. It combines endless, procedurally generated puzzle journeys with three separate difficulty profiles, responsive boards, touch-friendly controls and locally saved progress.

**No account or installation is required.** Open the [game website](https://prasannaone.github.io/Nonogram/) and start solving.

## Play controls

| Action | Phone / tablet | Desktop |
|---|---|---|
| Fill a cell | Select **Fill**, then tap or drag | Click or drag |
| Mark an empty cell | Select **Cross**, then tap or drag | Click or drag |
| Undo | Tap **Undo** | Click **Undo** |
| Get a hint | Tap **Hint** | Click **Hint** |
| Change difficulty / theme | Open **Settings** | Open **Settings** |

A drag keeps the action selected by its starting cell. Horizontal and vertical strokes stay aligned to their row or column. Keyboard navigation is also supported.

## Designed for everyday play

- **Direct-to-game launch:** starts on the puzzle surface without an extra title screen.
- **Responsive square grid:** adapts to phones, tablets, desktop layouts and short landscape screens.
- **Three independent difficulty journeys:** Easy, Normal and Hard each keep their own progression and saved state.
- **Six visual palettes:** Lavender, Ocean, Rose, Forest, Midnight and AMOLED.
- **Touch-friendly controls:** Fill, Cross, Undo, Hint and drag-to-mark interactions.
- **Keyboard support:** navigate and operate the board with a keyboard.
- **Local saving:** progress, points, hints, unfinished boards and journey details are saved in the browser.
- **Installable PWA:** includes a web app manifest, icons and a service worker for cached repeat visits.
- **No account required:** play without registration or payment.

Offline availability depends on the app shell and resources already being cached. The first visit requires an internet connection.

## Difficulty and progression

Each difficulty has its own independent profile and grid-size sequence:

| Difficulty | Grid sizes used |
|---|---|
| Easy | 5×5, 6×6, 7×7 |
| Normal | 7×7, 8×8, 9×9 |
| Hard | 10×10, 11×11, 12×12 |

Grid sizes are shuffled in batches within their own difficulty profile. The sequence therefore continues to mix the available sizes as the player advances; Easy does not turn into a 7×7-only mode, for example. Each difficulty progresses independently.

New profiles receive a random 128-bit journey identity. The saved identity drives a deterministic sequence, allowing the same journey to be reconstructed after a reload. Different players receive independent journeys, although puzzles may coincide by chance.

## Puzzle generation and quality checks

Fresh generated puzzles pass two separate checks before being accepted:

1. **Uniqueness validation:** checks that the clues describe exactly one valid completed grid.
2. **Logical-solvability validation:** applies deterministic row and column deductions to check that the puzzle can be completed without guessing.

The generator also applies pattern/density filters and rejects fingerprints found in its recent-puzzle history. Recent-history protection is a rolling window, not a promise that a puzzle can never recur over an unlimited lifetime.

A background preloader prepares one upcoming puzzle while the current level is being played. A preloaded puzzle is still subject to the same acceptance checks before it can be used. Preloading does not award points or advance the player's progress.

## Completion feedback

When a row or column becomes complete, only the cells in that newly completed line receive a brief, soft pastel-blue flash. The effect fades away quickly. There are no floating “ROW COMPLETE” or “COLUMN COMPLETE” labels, banners or persistent highlights.

The final line gets its brief feedback before the level-completion summary appears. Reduced-motion preferences are respected.

## Scoring, hints and support

- First-time level completion awards points based on the grid dimension: `grid size × 30`.
- Replaying a previously completed level does not award the first-time completion points again.
- A hint reveals a solution-filled cell and applies the current hint-cost rule.
- The optional Ko-fi support prompt is scheduled sparingly: its first eligible appearance is after level five, followed by journey-seeded intervals. It is not shown after every level.

## Saving and privacy

Progress is stored locally in the browser. There is no account-based cloud sync or built-in backup/restore. Clearing browser site data or moving to another device without transferring browser storage can remove access to the existing journey.

## Current release: v61

v61 refines line-completion feedback. The previous text toast and its “ROW COMPLETE” / “COLUMN COMPLETE” labels have been removed. Newly completed lines now receive a short pastel-blue cell-level flash, then return to their normal appearance. The level summary no longer waits for a text toast.

The release also updates the service-worker cache name so existing installations can fetch the revised app shell and assets.

## Run locally

This is a static browser application. Serve the project directory over HTTP rather than opening `index.html` directly, because service workers and some browser APIs require an HTTP(S) origin.

With Python installed:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## Project map

| Path | Purpose |
|---|---|
| `index.html` | Browser shell, game surface, settings and dialogs |
| `web-port/app.js` | Application lifecycle, rendering, UI, progression and event wiring |
| `web-port/nonogram.js` | Difficulty schedules, puzzle generation, clue calculation, uniqueness checks and fingerprints |
| `web-port/interaction.js` | Cell state, stroke handling, undo and line-completion state |
| `web-port/progress.js` | Per-difficulty profiles, journey identity, persistence and migrations |
| `web-port/layout.js` | Responsive board and clue sizing calculations |
| `web-port/pointer-input.js` | Touch/mouse coordinate mapping and axis-locked strokes |
| `web-port/keyboard-input.js` | Keyboard board navigation |
| `web-port/storage.js` | Safe browser storage wrapper |
| `web-port/completion.js` | Completion timing and support-prompt schedule |
| `web-port/puzzle-preloader.js` | Background next-puzzle coordination |
| `web-port/puzzle-preload-core.js` | Preload generation core |
| `web-port/puzzle-worker.js` | Worker entry point for background generation |
| `web-port/styles.css` | Themes, grid, controls, responsive layout and motion |
| `service-worker.js` | App-shell caching and update handling |
| `manifest.webmanifest` | PWA metadata |

## Credits

Made by **Prasanna**, known as **PrasannaOne**.

Nonogram is an independent project created and maintained by one person.

If you enjoy the game, you can support its continued development through [Ko-fi](https://ko-fi.com/prasannaone). Support is optional; the game can be played without an account or payment.

---

<div align="center">

**Prasanna ❤️** · Made with care, one grid at a time.

</div>
