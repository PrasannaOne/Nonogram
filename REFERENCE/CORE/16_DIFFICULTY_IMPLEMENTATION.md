# v41 product implementation: difficulty modes

## User-approved scope
- Top-bar selector: Easy / Normal / Hard.
- Mixed is excluded.
- Product Normal maps to original MediumGamemode.
- Preserve independent progress and unfinished puzzle per difficulty.

## Implemented size schedules
| Mode | Size bag | Grid range |
|---|---|---|
| Easy | `[5,6,7]` | 5x5 to 7x7 |
| Normal | `[7,8,9]` | 7x7 to 9x9 |
| Hard | `[10,11,12]` | 10x10 to 12x12 |

`web-port/nonogram.js` now exports `generatePuzzle({difficulty, level, seed, ...})`, `getGridSizeForLevel(level, difficulty)` and the `DIFFICULTY_GRID_SIZES` constant. The old `generateEasyPuzzle()` export remains as a compatibility wrapper.

## Product generator behaviour
- Deterministic mode-specific seeds and size bags.
- Bag shuffling is independent from the original Unity RNG; exact Unity RNG parity is not a product requirement.
- Density, non-empty line, variety, recent-fingerprint and exactly-one-solution filters remain product safeguards.
- Solution validation, uniqueness counting, progress snapshots and point reward bounds support up to 12x12.
- First-clear reward supports the 12x12 value of 360 points.

## Interface
In v41 the selector was a compact three-button segmented control in the top bar. In v44 it was moved inside the Settings dialog; it still exposes `aria-pressed` state, preserves the direct-to-game launch and does not add a separate mode screen or Mixed option.

## Verification
- `npm test`: 72/72 passed.
- `npm run audit`: passed.
- `npm run stress:generator`: 340 Easy puzzles, zero failures.
- `npm run stress:difficulties`: 60 puzzles across all three modes, zero failures; Hard includes 12x12.
- Real Android and browser visual QA remain pending.
