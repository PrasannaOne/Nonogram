## v46 - Fixed-intent painting and glass-finish interface (2026-11-16)
- Repositioned the Nonogram wordmark to the upper left and grouped Heart, Share and Settings at the upper right; points remain a compact center pill.
- Removed the visible progress sentence beneath the board and removed difficulty copy from the live play surface; level and board size remain as a single compact line.
- Restyled header actions, hint, undo, fill and cross as circular translucent glass controls; kept the puzzle grid square-cornered.
- Matched the reference board more closely with a softer lavender cell surface, stronger muted grid lines, larger blue filled cells and bolder slate crosses.
- Reworked drag painting so the first tile locks a stroke to one target state: fill, cross or erase. Revisited/mixed-state cells are never toggled individually during the same gesture.
- Avoided rebuilding the complete grid on pointer-up; existing in-place cell/clue updates are retained. Bumped service-worker cache to v10.
- Added fixed-intent fill/cross/erase regression coverage. Automated and stress QA recorded in QA_v46.txt.

## v45 - Original-game simplicity and tactile polish (2026-11-16)
- Simplified the live screen to match the reference game's quiet composition: no subtitle under the title, points centered in the top bar, and only level/mode/board-size metadata below the title.
- Reworked the bottom tool rail into three large, simple icon targets: muted Undo, soft-blue Fill and quiet Cross; labels remain available to assistive technology without adding visual clutter.
- Strengthened the square grid lines and clue hierarchy while retaining the six contrast-checked palettes and responsive 12x12 layout.
- Tuned touch feedback for quick cell changes, kept drag painting and undo behavior unchanged, and preserved reduced-motion preferences.
- Bumped the service-worker cache to v9 and added simple-surface regression tests.
- Verification: 84/84 tests, static audit, 340 generator samples, 60 cross-difficulty samples and 2,000 endless unique-solution samples passed. Real-device/browser visual QA remains open.

## v44 - Interface, themes and sharing polish (2026-11-16)
- Reworked the live screen around the original game's calm, spacious visual language: a centered Nonogram title, soft palette, clear level/board-size caption and more deliberate clue/grid contrast.
- Added a compact SVG heart link to the PrasannaOne home page, native Share action with clipboard/prompt fallback, and Settings action.
- Added six selectable, persistent palettes: Lavender, Ocean, Rose, Forest, Midnight and true-black AMOLED.
- Moved Easy / Normal / Hard selection into Settings while preserving isolated per-mode progress and unfinished-board snapshots.
- Added an About panel with a short puzzle introduction, creator credit and direct repository link.
- Smoothed cell-state, control and palette transitions while retaining reduced-motion support, square board sizing, drag painting and current game rules.
- Updated service-worker shell cache to v8 and PWA description/theme defaults.
- Verification: 82/82 automated tests, static audit, 340 generator samples, 60 difficulty samples including 12x12, and 2,000 endless unique-solution puzzles passed.
- Browser visual/device QA remains outstanding; a local Chromium navigation attempt was blocked by the execution environment, so no visual-hardware pass is claimed.

# Changelog

## v42 - Responsive 12x12 layout polish (2026-11-16)
- Replaced accumulated layout overrides with a cohesive responsive stylesheet.
- Added `web-port/layout.js` to calculate clue bands and one square cell size from the available viewport.
- Row clue band now accounts for the longest rendered clue label, including multi-digit values.
- Added ResizeObserver/orientation recalculation and a compact landscape tool rail.
- Kept safe-area and reduced-motion support; PWA manifest orientation is now `any`.
- Bumped service-worker shell cache to v7 and precached the layout module.
- Added viewport-matrix, invalid-input, multi-digit-clue and grid-track tests.
- Verification: 77/77 tests; static audit; 340 generator; 60 cross-difficulty; 2,000 endless Easy stress samples passed.
- Chromium visual navigation was blocked by the environment; real device/browser QA remains open.

## v41 - Three-difficulty product implementation (2026-11-16)
- Implemented the compact top-bar Easy / Normal / Hard selector; Mixed remains excluded.
- Bound the recovered size bags: Easy [5,6,7], Normal [7,8,9], Hard [10,11,12].
- Extended the independent generator, solution validator, progress snapshots and reward bounds through 12x12.
- Added independent per-difficulty progress, points, recent fingerprints and unfinished-board persistence.
- Added workspace save schema `prasannaone.nonogram.game.v1` and migration from the old Easy-only v1-v4 keys.
- Preserved unfinished v39 Easy saves by retaining exact legacy generator compatibility until their current puzzle is completed; six reference fingerprints pass.
- Added dynamic clue-area sizing for dense 12x12 clue stacks and bumped service-worker cache to v6.
- Added difficulty stress coverage (60 puzzles across all modes) and 12x12 save-resume tests.
- Verification: 70/70 tests, static audit, 340 Easy generator samples and 60 cross-difficulty samples passed. Android/browser visual QA remains outstanding.

- Recovered and hash-verified Easy [5,6,7], Normal/original Medium [7,8,9], and Hard [10,11,12].
- Cross-checked excluded Mixed as [5,6,7,8,9,10,11,12].
- Explained the encoded metadata token path: runtime kind-4 FieldInfo resolution patches static slots before the initializer copy.
- Added small CORE evidence chunks plus independent field-reference and SHA-256 verification scripts.
- Expanded original-generator notes: random size bag, ten-level batches, square boards, and per-cell Unity Random.Range(0,2).
- No playable runtime/product source changes; this is a research and documentation checkpoint only.

## v39 - Research handoff compression and resolver correction
- Added small, topic-specific current reference files under `REFERENCE/CORE/` and an index so future sessions do not need to reread the entire historical archive.
- Corrected the effective Easy initializer slot to `0x1aa97a8 -> 0x1b29170` after following the branch stub at `0x115fc6c`; the v37 Easy row was incomplete.
- Rechecked `0x5a2d98` and its `0x5459c4` bsearch-based field-data lookup path. Documented the still-unresolved encoded-token/descriptor mismatch instead of guessing.
- Updated the current product scope and README: original HintCost=150 is known; our 5-point price remains a provisional product choice; Easy / Normal / Hard is approved but not implemented.
- No runtime/product source changes.

# Changelog

## v35 - Serialized economy and levelSizes recovery (2026-11-16)
- Decoded original LevelManager.HintCost = 150 and RowColumnHintCost = 500 from the 232-byte gameplay-scene payload using the IL2CPP field schema.
- Found direct native evidence that EasyGamemode passes a three-element Int32 levelSizes array; exact values remain unresolved. This supersedes the earlier six-size source-list inference.
- Kept product runtime and its independent 5-point Hint / six-size schedule unchanged pending an explicit parity decision.
- Re-ran tests: 62/62 passing.


## v34 - Phone deep-dump integration (2026-11-16)
- Added the user-provided PHONE_DEEP_DUMP.zip and full extraction report.
- Mapped gameplay-scene LevelManager and LevelCreator MonoScript identities.
- Documented that raw MonoBehaviour payloads are preserved but custom fields remain undecoded.
- Added precise next-step hand-off for serialized HintCost and levelSizes recovery.
- No runtime game code changes; v33 source suite rerun: 62/62 passing.


## v30 - Endless Easy Play Loop (2026-11-16)
- Removed start/menu flow, mode selection, level picker, share/info controls, restart dialog and win dialog.
- App opens directly into the saved current puzzle.
- Completing a puzzle commits progress and automatically loads the next level after a 560 ms cue.
- Replaced ten-level batch progression with immediate sequential unlocks.
- Added compact schema v3 `completedThrough` streak storage; migrates v1 and v2 saves.
- Changed Easy grid schedule to 5x5 levels 1-50, 6x6 levels 51-150, then 7x7.
- Added 2,000-level deterministic generator stress test and endless-flow static regression tests.
- Bumped service-worker cache to v3.

## v29
- Fixed next-level progression after out-of-order play.
- Improved progress migration, multi-board persistence and keyboard access.

## v28
- Added multi-level unfinished board persistence, keyboard navigation and PWA shell.

Earlier checkpoint history is preserved in the versioned implementation notes and test reports.

## v31 - Generator focus and simple point economy
- Removed Row/Column Hint from the product UI and runtime interaction API; retained its original native research notes only.
- Changed endless Easy mode to a fixed 5x5 grid for consistently fast wins.
- Added generator quality filters: density band, no empty lines, pattern variety, minimum clue-run complexity and exact uniqueness.
- Added compact solution fingerprints and a 128-puzzle recent-repeat window. Completed puzzle boards are not stored.
- Added points: +10 per first-time level clear and -5 per single-cell Hint. These are provisional product values because original numeric constants are not recovered.
- Updated progress to schema v4, migrate v1/v2/v3 saves, retain only the current unfinished board, and store points plus recent fingerprints.
- Added 2,000-level strict uniqueness/non-repeat stress coverage and source-vs-inference documentation.


## v32 - Original Easy generator parity discoveries
- Lifted the mapped native `LevelGenerator.GenerateLevels` body and documented the ten-level generation loop.
- Recovered random size selection without replacement from a working list, replenished when empty.
- Restored square grid sizes 5x5 through 10x10 using an independent deterministic shuffled size bag in hidden ten-level blocks.
- Recovered original point reward formula: grid dimension * 30; first-clear-only award.
- Hint cost 5 remains explicitly provisional because the serialized original `HintCost` value is still unknown.
- Added regression tests for size-bag coverage, dimensions, reward formula and invalid rewards.
- Expanded generator stress coverage to 2,000 levels across all six sizes.

## v33 research checkpoint
- Re-audited the original Easy generator native body and documented its exact ten-level target formula, random size-bag refill, square dimensions, and dimension × 30 reward.
- Clarified evidence confidence: [5,6,7,8,9,10] remains a high-confidence inference, not a directly decoded source array.
- Documented the serialized HintCost bottleneck and the failed MonoBehaviour decode limitation.
- No runtime game code changed; 62 tests re-run successfully.

## v38 - Native initializer copy-path analysis and difficulty scope
- Traced the shared runtime helper through array type validation, length/element-size calculation, field-data pointer resolution and memcpy setup.
- Narrowed the remaining reverse-engineering target to the field-data resolver at 0x5a2d98 and its runtime metadata chain.
- Recorded approved product direction: Easy / Normal / Hard selector; Mixed excluded; preserve separate progression and unfinished boards per difficulty.
- No runtime/product source changes; public upload payload unchanged.
\n## v47\n- Added a dedicated circular Erase tool alongside Undo, Fill and Cross.\n- Rebalanced the four-tool layout for portrait, compact and landscape screens.\n- Bumped the service-worker shell cache to v11 so deployed clients receive the updated interface.\n
## v48 - Cleaner header and whole-grid clear
- Reworked the header into a simple left-aligned Nonogram title and compact right-side heart/share/settings actions.
- Removed the points capsule; points now appear as quiet, unboxed text beneath the header.
- Added a circular Clear Grid action at the upper-left of the puzzle controls. It clears all filled and crossed cells in one action.
- Removed the redundant bottom Erase tool; the bottom rail now contains Undo, Fill and Cross.
- Increased grid-line contrast, refined square-cell fill highlights and made the heart a brighter pink.
- Bumped the service-worker shell cache to v12.
- Added UI regression coverage for header density, plain points and whole-grid clearing.
- Verification: 95 tests passed; static audit passed; 340 generator samples, 60 difficulty samples and 2,000 endless puzzles passed.
