# Current status and next step

## What is confirmed
- Original gameplay `LevelManager.HintCost = 150`; `RowColumnHintCost = 500`.
- Original Easy `levelSizes = [5,6,7]`.
- Original Medium `levelSizes = [7,8,9]`; product label is Normal.
- Original Hard `levelSizes = [10,11,12]`.
- Excluded Mixed cross-check: `[5,6,7,8,9,10,11,12]`.
- The values are verified through runtime metadata token resolution, metadata field references, `PrivateImplementationDetails` field types and SHA-256 field-name hashes.
- The earlier encoded-token/runtime-pointer mismatch is explained: initialization resolves kind-4 FieldInfo tokens and patches the static slots before the array copy.
- Original generator uses ten-level batches, a random size bag without replacement/refill, square boards, and `UnityEngine.Random.Range(0,2)` per cell.
- Original generated-level reward is `dimension * 30`, awarded on first completion.

## What is not confirmed
- Exact Unity RNG state/seed and resulting sequence.
- Whether another code path post-processes generated boards; no uniqueness solver/rejection loop is visible in `LevelGenerator.GenerateLevels` itself.
- Full original UI hierarchy and every serialized event connection.

## v42 baseline before v44 interface update
- Easy / Normal / Hard selector is implemented in the top bar; Mixed is excluded.
- Recovered size arrays are wired into the independent generator.
- Per-mode level, points, completion streak, fingerprints and unfinished board are stored independently.
- 12x12 generator, uniqueness checking, progress snapshots and reward validation are supported.
- Responsive board layout uses square cell tracks calculated from the available viewport; clue bands account for multi-digit row clues.
- Short landscape layout moves tools beside the board; PWA orientation allows portrait and landscape; service-worker cache is v7.
- Existing Easy-only v1-v4 saves migrate into Easy; unfinished legacy puzzles retain the old generator until completion.
- Product's 5-point Hint price remains a deliberate provisional choice; do not silently replace it with original 150.

## Release QA still outstanding
- Real Android touch/layout and 12x12 clue readability; the new layout math is covered, but visual hardware verification is not complete.
- Browser visual/E2E and screenshot review.
- PWA installation, offline relaunch and update testing.
- Human difficulty/variety and hint-economy review.

## Bounded status
The original difficulty arrays are no longer a blocker. Do not repeat static handle/hash research. Continue with product implementation only when requested, or investigate a specific remaining runtime behaviour.


## Current implementation checkpoint: v44 interface polish
- The direct-to-game loop remains. A compact Settings dialog now contains six persistent palettes and Easy / Normal / Hard selection. Each mode's level, points and unfinished board remain independent.
- The screen now has a centered Nonogram identity, SVG heart link to the PrasannaOne home page, Share action, Settings action, level/dimension caption and a short intro line.
- Share uses the native Web Share API where available, then clipboard copy, with a manual-copy prompt as the final fallback.
- About contains a concise how-to-play introduction, creator credit and the direct `PrasannaOne/Nonogram` GitHub link.
- Service-worker cache is v8. Automated tests: 82/82, including palette contrast checks; static audit; 340 generator samples; 60 cross-mode samples including 12x12; 2,000 endless unique fingerprints all passed.
- Real Android and browser visual QA is still open. Do not describe the UI as hardware-verified.


## Current implementation checkpoint: v46
- Nonogram wordmark is upper left; points are centered; Heart/home, Share and Settings are grouped at upper right.
- The visible progress sentence under the board has been removed. Only level and board dimensions remain above the board; hint is icon-only.
- Header, hint and bottom tool controls use circular translucent surfaces with a restrained glass finish. Grid cells remain square.
- Fill/Cross strokes lock a target state from the starting tile. Every cell entered by one gesture receives that same state; a gesture beginning on an already active mark becomes an erase gesture. This prevents per-cell inversion.
- The pointer-up path avoids rebuilding the entire board DOM.
- v46 automated QA: 90 tests; static audit; 340 generator samples; 60 difficulty samples including 12x12; 2,000 unique Easy endless puzzles passed.
- Actual Android/browser visual and touch QA remains outstanding. A local headless Chromium screenshot attempt did not complete, so do not describe the UI as browser- or device-verified.

## Current implementation checkpoint: v49 axis-locked gestures
- Fill/Cross pointer gestures now choose a single axis from the first meaningful pointer movement (8px jitter threshold): horizontal locks to the starting row; vertical locks to the starting column.
- Diagonal drift is projected onto the locked line, so a gesture cannot paint neighbouring rows/columns. Tap remains a single-cell action.
- Existing starting-cell target-state behaviour remains: a stroke applies one consistent fill/cross/erase intent and never toggles visited cells repeatedly.
- Service-worker cache is v13 so installed clients refresh the pointer module.
- v49 automated QA: 99/99 tests; static audit; 340 generator samples; 60 difficulty samples including 12x12; 2,000 unique endless puzzles all passed.
- Real Android/browser touch QA remains outstanding.
