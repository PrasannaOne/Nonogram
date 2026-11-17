<div align="center">

# 🧩 PrasannaOne Nonogram

<p>
  <a href="https://prasannaone.github.io/Nonogram/"><img src="https://img.shields.io/badge/▶_PLAY_NOW-OPEN_NONOGRAM-6f8fc4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Play Nonogram" /></a>
</p>

**[Play Nonogram](https://prasannaone.github.io/Nonogram/)** · **[Source repository](https://github.com/PrasannaOne/Nonogram)**

<p>
  <img src="https://img.shields.io/badge/Release-v56-7189b8?style=flat-square" alt="v56" />
  <img src="https://img.shields.io/badge/Platform-Mobile%20%26%20Desktop-0ea5e9?style=flat-square" alt="Mobile and desktop" />
  <img src="https://img.shields.io/badge/Runtime-HTML5%20%2B%20JavaScript-facc15?style=flat-square" alt="HTML5 and JavaScript" />
  <img src="https://img.shields.io/badge/Puzzles-Endless-8b5cf6?style=flat-square" alt="Endless puzzles" />
  <img src="https://img.shields.io/badge/License-Source--available-bc8cf2?style=flat-square" alt="Source available license" />
</p>

*One little grid. A fresh puzzle journey. No account, no fuss.*

</div>

---

## What is Nonogram?

PrasannaOne Nonogram is an independently implemented, browser-based picture-logic puzzle game. Solve the grid by using the numbered clues along each row and column to discover which cells should be filled.

The project is designed around a direct-to-game experience: open the page and play. It combines an endless puzzle journey with three difficulty profiles, responsive square-cell boards, touch-friendly controls and locally saved progress.

The implementation is informed by research into the original game's mechanics and recovered configuration data. The playable runtime is independently implemented: it does not import original game code, artwork, fonts, branding or level content. Where the project follows recovered behaviour, the README distinguishes that evidence from our own product decisions.

**No account or installation is required:** open the [game website](https://prasannaone.github.io/Nonogram/) and start solving.

## Play

| Action | Phone / tablet | Desktop |
|---|---|---|
| Fill a cell | Select **Fill**, then tap or drag | Click or drag |
| Mark an empty cell | Select **Cross**, then tap or drag | Click or drag |
| Undo | Tap **Undo** | Click **Undo** |
| Get a hint | Tap the **Hint** control | Click the **Hint** control |
| Change difficulty / theme | Open **Settings** | Open **Settings** |

A drag gesture keeps the action selected by its starting cell. Horizontal and vertical strokes stay aligned to their row or column. Keyboard navigation is supported for the board.

## Made for phones and computers

- **Direct-to-game launch:** the game opens on the puzzle surface rather than an extra title or mode-selection screen.
- **Responsive square grid:** boards adapt to available screen space, including narrow phones, tablets, desktop layouts and short landscape screens.
- **Three difficulty profiles:** Easy, Normal and Hard, each with its own level progression and saved state.
- **Six visual palettes:** Lavender, Ocean, Rose, Forest, Midnight and AMOLED.
- **Touch-friendly play:** Fill, Cross, Undo, Hint and fixed-intent drag interactions.
- **Player-specific puzzle journeys:** each new difficulty profile receives its own random journey identity and shuffled grid-size sequence.
- **Puzzle quality checks:** generated boards pass uniqueness validation, pattern/density filters and recent-repeat rejection.
- **Local progress:** levels, points, hints, unfinished boards and journey information are saved in the browser.
- **Progressive Web App (PWA):** includes a manifest, app icons and a service worker for installable browser experiences and cached repeat visits.
- **Keyboard accessibility:** board navigation and accessible control labels are included.
- **Share and About:** native share where supported, a copy fallback, creator information and the project repository link.

Offline availability depends on the app shell and resources already cached by the browser. The first visit requires an internet connection.

## The puzzle journey

Each difficulty has its own independent profile:

| Difficulty | Grid sizes |
|---|---|
| Easy | 5×5, 6×6, 7×7 |
| Normal | 7×7, 8×8, 9×9 |
| Hard | 10×10, 11×11, 12×12 |

New profiles receive a random 128-bit journey ID. That identity drives the player's own deterministic sequence: a new player gets an independently generated journey, while the same saved journey can reconstruct its puzzles after reload.

Grid sizes are shuffled within the difficulty's size bag. The generator validates puzzle uniqueness and avoids recently used fingerprints. This does not create a mathematical guarantee that two different players can never receive the same puzzle; it makes their journeys independently generated.

**Save portability:** progress is currently stored locally in the browser. There is no account-based cloud sync or built-in backup/restore yet. Clearing site data or moving to another device without transferring browser storage can lose the existing journey.

## How scoring and hints work

- First-time level completion awards points based on the grid dimension: `grid size × 30`.
- A completed level is not rewarded again when replayed.
- A hint reveals one solution-filled cell and uses the current product hint-cost rule.
- The hint price and other balance choices are product decisions; they are not claims about the original game's serialized economy.

## The current build: v56

v56 is a deep polish and reliability pass over the browser implementation.

- The grid's top and left perimeter edges are painted directly by the first-row and first-column cell elements.
- Replay and resume retain the accepted generator attempt, fingerprint and legacy-generator mode so the same puzzle can be reconstructed.
- Completion feedback is limited to the final filled cell and newly completed clue labels. It avoids the previous scale/brightness flicker and staggered line-wide animation.
- The completion dialog uses the six theme palettes, larger unboxed stats and a theme-matched Ko-fi action.
- The service worker checks for updates at launch and refreshes static assets network-first, with cache fallback when offline.

The v56 automated suite reports 138 passing tests, plus static audit and generator stress checks: 340 generator samples, 60 difficulty samples and 2,000 randomized-journey puzzles. These are automated results from the recorded test environment. They do not establish lag-free performance on every phone or exhaustive browser/device compatibility. Physical-device touch/layout and browser visual/end-to-end testing remain necessary.

See `DEEP_AUDIT_v56.md`, `QA_v56.txt`, `RELEASE_NOTES_v56.md` and `RELEASE_CHECKLIST.md` for the measured results and remaining checks.

## Original-game research and independent implementation

The project includes a read-only research/reference collection documenting recovered mechanics, configuration arrays, code paths and implementation notes. The playable browser runtime is separately authored and does not import original game code, assets, branding, fonts or level content.

Recovered facts and product decisions are kept distinct. For example, the difficulty grid-size sets and point award formula are documented as recovered behaviour, while the current uniqueness-constrained puzzle generator, player-specific journey IDs, six themes and hint pricing are implementation/product choices.

The research materials are retained for traceability. Their presence does not grant rights to third-party material or imply that every original implementation detail has been reproduced.

## Run locally

The project is a static browser application. Serve the project directory over HTTP rather than opening `index.html` directly, because service workers and some browser APIs require an HTTP(S) origin.

With Python installed:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000/`.

For the Node.js checks, use Node.js 18 or later:

```sh
npm test
npm run audit
npm run stress:generator
npm run stress:difficulties
npm run stress:endless
```

## Project map

| Path | Purpose |
|---|---|
| `index.html` | Browser shell, game surface, settings and dialogs |
| `web-port/app.js` | Application lifecycle, rendering, UI, progression and event wiring |
| `web-port/nonogram.js` | Difficulty schedules, puzzle generation, clue calculation, uniqueness checks and fingerprints |
| `web-port/interaction.js` | Cell state, stroke handling, undo and line completion |
| `web-port/progress.js` | Per-difficulty profiles, journey identity, persistence and migrations |
| `web-port/layout.js` | Responsive board and clue sizing calculations |
| `web-port/pointer-input.js` | Touch/mouse coordinate mapping and axis-locked strokes |
| `web-port/keyboard-input.js` | Keyboard board navigation |
| `web-port/storage.js` | Safe browser storage wrapper |
| `web-port/styles.css` | Themes, grid, controls, responsive layout and motion |
| `service-worker.js` | App-shell caching and update handling |
| `manifest.webmanifest` | PWA metadata |
| `tests/` | Regression and behaviour tests |
| `scripts/` | Static audit and generator stress utilities |
| `REFERENCE/` | Read-only original-game research and recovered evidence |

## Documentation

- `START_HERE.txt` — current project handoff and orientation.
- `PRODUCT_SCOPE.md` — approved product direction and excluded features.
- `MECHANICS_PARITY_NOTES.md` — recovered mechanics versus browser implementation.
- `JOURNEY_RANDOMIZATION_v55.md` — player-specific journey design and save compatibility.
- `DEEP_AUDIT_v56.md` — v56 source audit, fixes and known limitations.
- `QA_v56.txt` — current automated QA summary.
- `RELEASE_NOTES_v56.md` — v56 release changes.
- `RELEASE_CHECKLIST.md` — automated and real-device verification status.
- `CHANGELOG.md` — version history.

## Credits and rights

Created by **Prasanna** as part of **PrasannaOne**.

This is an independent Nonogram implementation and research project. It is not affiliated with, sponsored by or endorsed by any original Nonogram game developer or rights holder. Names, marks, code, artwork, fonts, sounds and other materials belonging to third parties remain theirs. The project does not claim ownership of third-party materials referenced in its research.

The project's own authored source, documentation, tests and tools are governed by the root `LICENSE`. The license is source-available and proprietary; it is **not** an OSI-approved open-source license. Read it before using or modifying the project.

If you enjoy the project, you can support its continued development through [Ko-fi](https://ko-fi.com/prasannaone). Support is optional; the game can be played without an account or payment.

---

<div align="center">

**PrasannaOne** · Made with care, one grid at a time.

</div>
