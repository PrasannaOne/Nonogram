# v41 save migration and per-mode isolation

## New storage model
- Key: `prasannaone.nonogram.game.v1`.
- Root fields: `schemaVersion`, `currentMode`, `profiles`, `savedAt`.
- Profiles: `easy`, `normal`, `hard`.
- Each profile owns level, highest unlocked level, completion streak, points, recent fingerprints, generator version and one unfinished board snapshot.

## Legacy migration
Previous keys are checked in order: `progress.v4`, `progress.v3`, `progress.v2`, `progress.v1`.
The legacy single profile is copied into Easy; Normal and Hard start fresh. The old key is not deleted.

## Critical unfinished-board compatibility
A v1-v4 Easy save without an explicit generator version is marked `generatorVersion: 1`. It resumes using `generateLegacyEasyPuzzle()` and the pre-v40 5x5..10x10 size schedule until that current puzzle is completed. This is necessary because the recovered Easy size array [5,6,7] differs from the former product's inferred [5,6,7,8,9,10] schedule.

The legacy path was compared against the v39 generator on 13 deterministic levels; zero mismatches were observed. Six representative expected fingerprints are locked in `tests/nonogram.test.mjs`.
When the legacy puzzle is completed, `completeLevel()` upgrades that Easy profile to `generatorVersion: 2`; subsequent puzzles use the recovered [5,6,7] schedule.

## Mode switching
The app persists the current profile before switching. The next profile is loaded without mutating the one being left. Points and hint spending are also profile-specific. Switching during a drag commits the stroke first; switching during the win transition cancels the old timer after completion has already been committed.

## Tests
- Legacy v4 board, level, points and completion streak migration.
- Easy/Normal/Hard profile isolation.
- Repository persistence and reload of independent profiles.
- 12x12 Hard unfinished-board snapshot save/reload.
