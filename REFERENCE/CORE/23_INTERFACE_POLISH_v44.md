# v44 interface polish

## Layout
- Header: SVG heart/home link to `https://prasannaone.github.io/`, Share action and Settings icon.
- Hero: centered Nonogram title, short intro tagline, difficulty, level and board dimensions.
- Play area: points, single-cell Hint, responsive square-cell board and concise progress feedback.
- Bottom tool rail: Undo, Fill and Cross.

## Settings
- Palette set: Lavender, Ocean, Rose, Forest, Midnight and AMOLED.
- Preference key: `prasannaone.nonogram.theme.v1`, independent of `prasannaone.nonogram.game.v1`.
- Difficulty choices: Easy, Normal and Hard. Selecting a mode persists the current profile and resumes that mode's saved level/unfinished board.

## About and sharing
- About explains row/column run clues and the goal of revealing the hidden pattern.
- Repository link: `https://github.com/PrasannaOne/Nonogram`.
- Share sequence: `navigator.share()` when available; otherwise clipboard write; manual prompt if clipboard is unavailable. User cancellation of the native share sheet is treated as cancellation, not an error.

## Motion/accessibility
- Native modal dialogs provide escape/backdrop/close handling.
- Buttons and palette/difficulty choices expose accessible names and `aria-pressed`.
- Cell-state, control and theme transitions are restrained. `prefers-reduced-motion` remains respected.
- This is a source-level and automated-test milestone; real Android/browser visual checks remain release tasks.

## Contrast check
- Automated palette regression enforces at least 7:1 for primary body text, 4.5:1 for supporting text and action text, and 3:1 for large title text across all six palette presets. These are CSS-token contrast checks, not a complete screen-reader or rendered-device audit.
