# v45 visual direction and implementation

## Visual target
Use the supplied original-game screenshot as the visual reference. Keep the active play screen intentionally quiet: a small top status strip, centered light-weight Nonogram title, one line of level/difficulty/size, generous open space around the board, crisp square grid, and three oversized icon-only tools. The About dialog holds the game introduction; do not add promotional copy to the play screen.

## Implemented
- Removed the hero subtitle from the play surface.
- Moved points into the centered top bar.
- Kept Hint as a small bulb action above the board.
- Made Undo / Fill / Cross large round targets, with accessible hidden labels.
- Restored the original-like muted Undo, blue Fill and understated Cross visual hierarchy.
- Increased grid line definition and kept square cells / responsive clue bands.
- Kept interaction logic, puzzle generator, progress and storage untouched.
- Service-worker cache v9.

## Verification
- 84/84 automated tests; static audit clean.
- 340 generator samples, 60 cross-difficulty samples including 12x12, and 2,000 endless unique puzzles passed.
- Visual browser/device testing still required.
