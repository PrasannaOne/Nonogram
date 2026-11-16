# v46 interface and pointer-state decisions

## Live play surface
- Wordmark is upper left. Points are centered. SVG Heart/home, Share and Settings are grouped at upper right.
- No visible progress-summary sentence under the grid. Difficulty is chosen in Settings and is not repeated during play.
- The single level caption contains level and board dimensions. Hint is icon-only.
- Header actions, hint and bottom controls use circular translucent/glass surfaces. The grid remains square-cornered.
- The board uses muted but more legible grid lines, soft lavender cell faces, soft blue fills and stronger slate X marks.

## Fixed-intent drag model
A pointer gesture determines its target state from the first tile touched. Fill tool: first tile already filled means erase this stroke; otherwise fill this stroke. Cross tool: first tile already crossed means erase this stroke; otherwise cross this stroke. Explicit erase always targets unknown. That target stays fixed for every visited tile and each tile is processed once. A later gesture may choose a different target.

This avoids per-cell toggling when a drag crosses a mixture of empty, filled and crossed cells. The undo model remains the existing bounded per-cell history.

## Performance
Cells and clue-completion marks are updated in place while dragging. Pointer-up now commits and syncs controls without reconstructing the board DOM.

## QA limit
Automated tests/stress checks validate the deterministic model and responsive layout rules. Actual Android/browser touch smoothness still requires on-device verification.
