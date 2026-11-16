# Responsive 12x12 board layout

## Purpose
Fit the full clue + puzzle board into the actual remaining viewport on phones, tablets, desktop and short landscape screens without stretching cells.

## Implementation
- `PROJECT/web-port/layout.js` exports `calculateBoardLayout()` as a small, independently testable layout calculator.
- `app.js` measures `#boardWrap` and passes its real client width/height plus the generated puzzle's maximum clue dimensions.
- The calculator returns one square `cellSize`, a row-clue width, a column-clue height and the resulting board bounds.
- CSS uses the same `--cell-size` for both column and row tracks, so every cell remains square.
- `ResizeObserver` recalculates the board after viewport, orientation, split-screen or parent-size changes; `orientationchange` is retained as a fallback nudge.
- Row clue width is based on the longest rendered clue string, so values such as `10 1` are not clipped by a count-only estimate.
- Short landscape layouts move Undo / Fill / Cross into a vertical rail beside the board.
- Safe-area insets, dynamic viewport height and reduced-motion preferences are respected.

## PWA
- Manifest orientation is `any`, so installed mode is not locked to portrait.
- Service-worker cache advanced to `prasannaone-nonogram-shell-v7` and precaches `web-port/layout.js`.

## Files to inspect
1. `PROJECT/web-port/layout.js`
2. `PROJECT/web-port/app.js` (`updateBoardMetrics` and `render`)
3. `PROJECT/web-port/styles.css` (`.board-wrap`, `.board`, landscape media query)
4. `PROJECT/service-worker.js`
5. `PROJECT/manifest.webmanifest`
6. `PROJECT/tests/responsive-layout.test.mjs`

## Important limitation
Automated layout math and CSS/source checks pass. A real browser screenshot run was attempted in this environment but Chromium navigation was blocked by the execution environment. Physical Android and actual browser visual/touch QA are still required; do not claim all devices have been visually verified.
