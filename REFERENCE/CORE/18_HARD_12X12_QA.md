# Hard 12x12 generator and board support

## Implemented
- Maximum supported puzzle dimensions raised from 10 to 12.
- Clue calculation, solution validation and uniqueness counter accept 12x12.
- `PuzzleBoard` already supports arbitrary positive dimensions; persisted board validation now accepts 12x12.
- Point reward validation raised to 360, matching 12 × 30.
- Board clue bands calculate their height/width from the maximum clue count in the generated puzzle, avoiding a fixed 5..10 clue-area assumption.

## Stress result
`npm run stress:difficulties` generated 20 samples per mode (60 total), including 12x12 Hard boards. All generated boards were square, within their recovered size bag and uniquely solvable. No failures. Worst accepted-attempt count by mode: Easy 10, Normal 20, Hard 8.

## Not yet verified
- Physical Android display/touch performance at 12x12.
- Real browser screenshot and visual review. Headless Chromium timed out during the v41 attempt in this environment.
- Human assessment of 12x12 clue readability on narrow/short screens.
