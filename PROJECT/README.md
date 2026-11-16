# PrasannaOne Nonogram

An independently implemented, mobile-first Nonogram with a direct-to-game endless loop and three independent difficulty profiles: Easy, Normal and Hard, with settings, share and six visual palettes.

## Start here
1. `../REFERENCE/CORE/00_INDEX.md` - short original-game research index.
2. `../REFERENCE/CORE/01_CURRENT_STATUS.md` - recovered facts and research boundary.
3. `../REFERENCE/CORE/16_DIFFICULTY_IMPLEMENTATION.md` - current three-mode implementation.
4. `PRODUCT_SCOPE.md` - approved product direction.
5. `../REFERENCE/CORE/20_RESPONSIVE_LAYOUT.md` - 12x12 responsive board layout.
6. `RELEASE_CHECKLIST.md` - automated and device/browser QA status.
7. `CHANGELOG.md` - version history.

## Run locally
Serve this directory over HTTP; do not open `index.html` using `file://`.

```sh
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## Verification commands
Requires Node.js 18 or newer.

```sh
npm test
npm run audit
npm run stress:generator
npm run stress:difficulties
npm run stress:endless
```

## Product features
- Direct-to-game launch with an upper-left Nonogram wordmark, centered points and compact heart/home, native Share and Settings actions.
- Settings includes six persistent palettes (Lavender, Ocean, Rose, Forest, Midnight and AMOLED), plus Easy / Normal / Hard selection. Each difficulty keeps its own progress.
- About panel includes a short how-to-play introduction, creator credit and direct GitHub repository link.
- Recovered difficulty size bags: Easy 5x5..7x7, Normal 7x7..9x9, Hard 10x10..12x12.
- Independent level, completion streak, points, recent fingerprints and unfinished board for each difficulty.
- Unique-solution puzzle generation with density/pattern filters and recent-repeat rejection.
- Erase, Fill and Cross tools; fixed-intent touch/mouse drag (one target state per gesture), per-cell Undo and clue-based completion.
- Single-cell Hint costing 5 points (a deliberate product balance choice).
- Grid-size × 30 points for each first-time completion, matching the recovered original formula.
- Migration of the previous Easy-only v1-v4 save into the Easy profile without discarding its unfinished board; that board is regenerated with the legacy generator until completed.
- Responsive square-cell layout through 12x12, with short-landscape tool rail and safe-area handling.
- PWA shell, offline navigation fallback and keyboard accessibility.

## Architecture
- `web-port/nonogram.js`: difficulty schedules, generator, clue calculation, uniqueness counting and fingerprints.
- `web-port/interaction.js`: cell state, drag history, undo and clue completion.
- `web-port/progress.js`: per-difficulty progress profiles, workspace persistence and legacy migrations.
- `web-port/app.js`: direct launch, theme preferences, settings/about dialogs, sharing, difficulty switching, responsive layout updates, UI and automatic progression.
- `web-port/layout.js`: pure responsive board/clue sizing calculator.
- `web-port/pointer-input.js` / `keyboard-input.js`: touch/mouse coordinate and keyboard helpers.
- `scripts/`: static audit and seeded stress tests.
- `tests/`: regression, save migration, difficulty isolation, generator and PWA tests.

## Persistence
New workspace key: `prasannaone.nonogram.game.v1`. It stores three isolated profiles. The former `prasannaone.nonogram.progress.v4` key and older v1-v3 keys are migration sources. Existing Easy progress, points and unfinished board are preserved. Legacy Easy saves retain the old 5x5..10x10 generator schedule until their currently unfinished puzzle is completed; subsequent Easy puzzles use the recovered 5x5..7x7 schedule. Normal and Hard begin with independent fresh profiles.

## Original-game evidence vs our product choices
Original arrays are recovered and hash-verified: Easy [5,6,7], original Medium (product Normal) [7,8,9], and Hard [10,11,12]. Original generation uses a ten-level batch, a random size bag without replacement/refill, square boards and random 0/1 cell fill. Native code sets Points = dimension × 30 and awards the first completion. Serialized original HintCost is 150; our 5-point Hint remains an independent product balance choice. Our puzzle solution generator is independent and adds uniqueness/quality checks; these are product choices, not claims about the original generator. Mixed mode, Row/Column Hint, ads, monetisation and a separate start/mode-selection screen remain excluded.

The `REFERENCE/` directory is read-only research material. The playable runtime does not import original code, assets, branding, fonts or level content.

## Latest checkpoint: v46
The active play surface has the upper-left wordmark, right-side Heart / Share / Settings, no visible progress-summary line, circular glass-like controls and square grid cells. Fill/Cross drag gestures keep one fixed target state per stroke. Current QA: 91 automated tests plus generator, difficulty and 2,000-puzzle stress checks pass.

## Release status
Feature-complete for the first three difficulty modes, but still pre-release. Automated regression, generator and 12x12 Hard stress checks pass. Real Android touch/layout, browser visual/E2E, PWA installation/offline relaunch and human difficulty/economy review remain pending.
