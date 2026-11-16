# Nonogram Release and Quality Checklist

Last audited: 2026-11-16  
Checkpoint: v48 simplified header, whole-grid clear and three-tool rail  
Status: **pre-release / Android and browser QA outstanding**

Legend: `[x]` verified in source/tests; `[ ]` not completed; `[~]` implemented but requires real-device/browser confirmation.

## 1. Product direction
- [x] One continuous play loop with Easy / Normal / Hard selection inside Settings.
- [x] No start screen, menu or level picker.
- [x] Recovered size bags: Easy 5x5..7x7, Normal 7x7..9x9, Hard 10x10..12x12.
- [x] Automatic next puzzle after a short success cue.
- [x] One unfinished board per difficulty is stored.
- [x] Completed puzzle boards are discarded.

## 2. Gameplay
- [x] Fill and Cross tools; whole-grid Clear action in the upper-left controls.
- [x] Tap and drag painting; every gesture locks one target state from its starting tile.
- [x] Fill/Cross strokes lock their action from the starting tile; tapping an already marked cell clears it; Clear Grid clears all marks.
- [x] Per-cell Undo bounded to ten recent actions.
- [x] Row/column clue-run checks and whole-board completion.
- [x] Single-cell Hint only; Row/Column Hint removed from product UI and runtime API.
- [x] Automatic next level after completion.
- [ ] Tune the 560 ms transition from real player feedback.
- [ ] Verify all gestures on Android.

## 3. Generator quality
- [x] Deterministic level-derived seed.
- [x] Exactly-one-solution validation.
- [x] Density filter and no empty rows/columns.
- [x] Minimum clue complexity and distinct row/column pattern filters.
- [x] 64-bit solution fingerprint.
- [x] Rolling recent-repeat exclusion (128 fingerprints per mode in production).
- [x] Strict 2,000-level stress run with all previous fingerprints excluded.
- [x] 340 seeded generator/uniqueness sample.
- [ ] Human difficulty/variety review after playing a longer run.
- [ ] Continue monitoring rare generation attempt spikes on low-powered phones.

## 4. Points and Hint economy
- [x] Grid dimension × 30 points per first-time completion (recovered original formula).
- [x] -5 points per single-cell Hint (provisional product default; original serialized HintCost=150 is recovered).
- [x] Insufficient points blocks Hint and reports balance.
- [x] Duplicate/replay completion cannot award points twice.
- [x] Points persist through reload and schema migration.
- [x] Original evidence documented: per-level Points added to User.Points on first completion; HintCost uses TryUsePoints.
- [ ] Decide whether to retain or rebalance the product Hint price against original HintCost=150. Reward formula is known: grid dimension × 30.

## 5. Progress and persistence
- [x] Sequential progression and compact `completedThrough` counter.
- [x] Workspace key `prasannaone.nonogram.game.v1` with isolated Easy / Normal / Hard profiles.
- [x] Migrate previous Easy-only v1-v4 saves into Easy without losing its unfinished puzzle.
- [x] Preserve one unfinished board, points and recent fingerprints per difficulty.
- [x] Legacy Easy puzzle resumes using exact previous generator output until completed.
- [x] 2,000 consecutive wins remain compact.
- [ ] Verify migration/resume on Android Chrome.
- [ ] Verify local storage failure/quota behaviour on device.

## 6. Interface and accessibility
- [x] Minimal direct-to-game UI with upper-left wordmark, centered points and Heart / Share / Settings on the right.
- [x] No visible progress-summary sentence under the puzzle.
- [x] Circular glass-like controls; square grid cells remain deliberately unrounded.
- [x] Easy / Normal / Hard selector inside Settings; each mode keeps isolated progress.
- [x] Level counter and points balance.
- [x] Hint, Undo, Fill and Cross controls only.
- [x] Keyboard grid navigation and Ctrl/Command+Z.
- [x] Focus-visible and reduced-motion handling.
- [x] Responsive square-cell sizing calculator covers seven representative viewport profiles.
- [x] Short-landscape layout and any-orientation PWA configuration implemented.
- [ ] Test horizontal, vertical and diagonal drag on Android.
- [x] Responsive sizing matrix tests seven representative viewport profiles.
- [x] PWA manifest allows portrait and landscape; short-landscape tool rail implemented.
- [x] Theme preference persists independently of game progress; app theme-color meta updates with selection.
- [ ] Test landscape, short-height, zoom and gesture safe areas on actual devices.
- [ ] Screen-reader QA.
- [ ] Screenshot review at phone widths.

## 7. PWA / offline
- [x] Manifest and local icons.
- [x] Service-worker shell cache v10; app, interaction, layout and pointer modules are precached.
- [x] Offline navigation fallback in source.
- [ ] Add to Home Screen on Android Chrome over HTTPS.
- [ ] Verify offline relaunch after first successful online load.
- [ ] Verify service-worker update on an existing installation.

## 8. Automated checks
- [x] `npm test`: 91 passed, 0 failed (v46 run).
- [x] `npm run audit`: static audit.
- [x] `npm run stress:generator`: 340 Easy seeded puzzles, zero failures.
- [x] `npm run stress:difficulties`: 60 puzzles across Easy / Normal / Hard, zero failures; includes 12x12.
- [x] `npm run stress:endless`: 2,000 5x5..7x7 Easy puzzles, 2,000 distinct fingerprints, zero failures.
- [x] All 2,000 strict stress puzzles have exactly one solution.
- [x] Public upload payload rebuilt from product source and byte-compared.
- [ ] Browser visual/E2E test. Chromium local navigation was blocked by the execution environment during v42 review.
- [ ] Physical Android device QA.

## 9. Difficulty implementation
- [x] Original arrays recovered: Easy [5,6,7], Normal/original Medium [7,8,9], Hard [10,11,12].
- [x] Implement Easy / Normal / Hard selector inside Settings.
- [x] Persist progress and unfinished board independently per difficulty.
- [x] Expand Hard generator, clue layout and save snapshots through 12x12.
- [x] Automated mode-isolation and legacy-save migration tests.
- [ ] Real-device switching and unfinished-board resume QA. Mixed mode remains excluded.

## 10. Explicit blockers and release gate
- [ ] Browser visual/E2E and screenshot QA.
- [ ] Android touch/layout/install/offline checks.
- [ ] Human validation of puzzle difficulty and point economy.

Do not call this v1.0, bug-free or release-ready until the above checks are complete. The 2,000-level stress test validates deterministic generation and code-level uniqueness, not infinite non-repetition or human enjoyment of every puzzle.


## 11. v34 research checkpoint (2026-11-16)
- [x] Preserve user-supplied PHONE_DEEP_DUMP.zip in the research archive.
- [x] Cross-check inventory: 1,260 objects; 150 MonoBehaviours; 545 MonoScripts; 2 TextAssets; 66,904 raw MonoBehaviour bytes; zero extraction exceptions.
- [x] Resolve gameplay LevelManager and LevelCreator script identities from MonoScript records.
- [x] Document the distinction between raw payload preservation and custom-field decoding.
- [x] Decode serialized LevelManager.HintCost=150 and RowColumnHintCost=500 using the IL2CPP field schema and Unity serialization layout.
- [x] Decode original Easy / Medium / Hard `levelSizes` arrays; see `REFERENCE/CORE/10_DIFFICULTY_ARRAYS_RECOVERED.md`.
- [ ] Resolve Unity external FileID mappings before broader scene/script joins.

This is a documentation/research checkpoint only. Runtime product code and public upload files are unchanged from v33.


## 12. v42 responsive layout polish (2026-11-16)
- [x] Rebuilt responsive layout around measured board-wrap width/height.
- [x] All cell tracks use one calculated size, keeping 12x12 cells square.
- [x] Row clue band accounts for actual longest clue text, including multi-digit clues.
- [x] ResizeObserver recalculates on parent/viewport size changes.
- [x] Short landscape view places tools beside the board.
- [x] PWA orientation changed to any; service-worker cache v7 precaches layout.js.
- [x] Automated responsive layout matrix and regression tests: 77/77.
- [ ] Real Android/browser screenshot, touch, PWA and offline QA remains outstanding.


## 13. v44 interface polish (2026-11-16)
- [x] Heart/home SVG link, Share and Settings actions implemented.
- [x] Settings and About are native modal dialogs; the game still launches directly into the saved puzzle.
- [x] Six palette choices with separate persistent theme preference; includes dark and AMOLED-black contrast sets.
- [x] Difficulty selection lives in Settings and retains independent saved profiles.
- [x] Game introduction and GitHub repo link appear in About.
- [x] Soft board/control transitions and reduced-motion handling.
- [x] 82/82 tests, static audit, generator/difficulty/endless stress suites pass.
- [ ] Verify palette contrast and modal layout on real Android devices, including 320px and 360px widths.
- [ ] Verify native Share sheet and clipboard fallback on Android Chrome.
- [ ] Verify light/dark/AMOLED persistence after a full PWA close/relaunch.


## 14. v46 fixed-intent gestures and visual simplification (2026-11-16)
- [x] Upper-left Nonogram wordmark; Heart, Share and Settings grouped at upper right.
- [x] Removed the visible row/column/points progress sentence below the grid.
- [x] Kept only level and dimensions on the compact line above the board; hint is icon-only.
- [x] Circular glass-like buttons and subtle blur/highlights; board cells remain square.
- [x] Grid stroke scales with cell size, with soft blue fills and bolder X marks.
- [x] Fixed-intent gestures: first tile determines fill/cross/erase target for the whole stroke; revisits never toggle.
- [x] Pointer-up saves and checks completion without rebuilding the grid DOM.
- [x] 90/90 automated tests; static audit; generator, difficulty and 2,000-puzzle stress suites all pass.
- [ ] Confirm actual touch feel and visual fidelity on Android; a headless Chromium screenshot could not be completed here.

## v48 release verification
- [x] Header de-cluttered; points shown without a pill/button surface.
- [x] Whole-grid Clear action moved to the upper-left of the puzzle header.
- [x] Bottom tool rail reduced to Undo / Fill / Cross.
- [x] 95 automated tests, static audit and all generator stress suites pass.
- [ ] Android physical-device visual and touch QA.
