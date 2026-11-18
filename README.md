<div align="center">

# 🧩 Nonogram

**[Play Nonogram](https://prasannaone.github.io/Nonogram/)**

*One little grid. A fresh puzzle journey. No account, no fuss.*

</div>

---

## About

Nonogram is a browser-based picture-logic puzzle game by **Prasanna (PrasannaOne)**. Solve the row and column clues to reveal each hidden pattern. The game opens directly into play and works on phones, tablets and desktop browsers.

## Gameplay

| Action | How it works |
|---|---|
| Fill | Select Fill, then tap/click or drag across cells |
| Cross | Mark cells that should remain empty |
| Undo | Reverse the previous board action |
| Hint | Reveal a useful filled cell at the displayed point cost |
| Restart | Clear the current board |
| Keyboard | Navigate the board with supported keyboard controls |

Touch strokes retain the action selected at the start of the stroke. Dragging is axis-locked to keep mobile input predictable.

## Difficulty and progression

Each difficulty has its own saved profile and independent endless journey:

- **Easy:** 5×5, 6×6 and 7×7 boards.
- **Normal:** 7×7, 8×8 and 9×9 boards.
- **Hard:** 10×10, 11×11 and 12×12 boards.

Grid sizes are shuffled in recurring batches, rather than increasing permanently to the largest size. This means Easy continues to include 5×5 puzzles throughout the journey, alongside 6×6 and 7×7 boards. Switching difficulty does not merge the profiles.

## Puzzle generation and validation

Fresh puzzles are procedurally generated from a journey-specific seed. The generator derives row and column clues from the candidate solution and applies quality checks before accepting a puzzle.

The validation pipeline includes:

1. **Uniqueness validation:** rejects a candidate unless its clue set has exactly one valid solution.
2. **Logical-solvability validation:** applies deterministic row/column deductions. It accepts only puzzles that can be completed by the implemented line-solving logic without requiring a guess.
3. **Pattern and density checks:** rejects unsuitable candidate shapes.
4. **Recent-repeat filtering:** compares puzzle fingerprints against a rolling history to reduce nearby repeats.

Generation uses bounded attempts. A failed candidate is rejected rather than silently accepted with weaker validation. Previously saved in-progress puzzles are restored using their stored puzzle identity and board state.

## Background preparation

The game can prepare one upcoming puzzle in a Web Worker while the current puzzle is being played. The preloader uses the same generator and validation pipeline as normal generation. Results are keyed to the requested difficulty and puzzle journey; stale or mismatched results are discarded. If a worker is unavailable or fails, normal generation remains the fallback.

Preloading does not award points, change progress or replace the current board.

## Completion feedback

When a row or column becomes complete, only that newly completed line receives a very brief, subtle pastel-blue highlight. Already completed lines do not replay the effect. There are no completion banners, floating text labels or layout shifts. The same behaviour is sized from the active board, so it applies to every supported grid dimension.

Reduced-motion preferences are respected.

## Themes and display

The game includes Lavender, Ocean, Rose, Forest, Midnight and AMOLED palettes. The board layout adapts to available screen space and keeps square cells across supported grid sizes.

## Saving and offline use

- Progress and preferences are stored locally in the browser.
- Easy, Normal and Hard progress are stored separately.
- No account or game server is required.
- The Progressive Web App can be installed from a supported browser.
- After the app shell has been cached, the service worker supports offline launch and play.
- Clearing browser/site data can erase locally stored progress. There is no cloud synchronisation.

## Project structure

- `index.html` — application entry point.
- `web-port/app.js` — game orchestration and UI updates.
- `web-port/nonogram.js` — puzzle generation and validation.
- `web-port/interaction.js` — board state and line-completion detection.
- `web-port/progress.js` — difficulty profiles, scoring and progression.
- `web-port/puzzle-preloader.js` — upcoming-puzzle coordination.
- `web-port/puzzle-preload-core.js` and `web-port/puzzle-worker.js` — worker-side generation.
- `web-port/styles.css` — layout, themes and visual styling.
- `service-worker.js` — app-shell caching and update lifecycle.
- `manifest.webmanifest` and `icons/` — install metadata and app icons.

## Development and deployment

This is a static web app. Serve the repository root over HTTP(S) for local testing; ES modules and service workers are not expected to work correctly from a `file://` URL. The GitHub Pages workflow in `.github/workflows/` supports the repository's ZIP import workflow.

For a clean update test, close old installed-app tabs, allow the new service worker to activate, then reopen the app. The cache name is versioned so the previous shell cache can be retired.

## License

See the original [`LICENSE`](LICENSE) file. It is preserved unchanged.
