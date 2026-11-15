# PrasannaOne Nonogram

An independently implemented, relaxed Nonogram project. The original APK is
kept only in the sibling `REFERENCE/` folder for technical research; the
playable project does not import or load any reference assets or code.

## Current working modules
- `web-port/nonogram.js`: seeded Easy puzzle generation, clue calculation,
  solution counting, and board-solution comparison.
- `web-port/interaction.js`: independent cell-state model, fill/cross/erase
  tools, grouped stroke undo, reset undo, separate row/column completion,
  completed-line reporting, and whole-board validation.
- `tests/`: automated tests for generator, interaction, line completion,
  undo history, and whole-board completion (10 passing tests at last run).

## Run tests
Requires Node.js:

```sh
npm test
```

## Product direction
One relaxed Easy experience with a completely new product identity and design
system. No scoring, points, coins, rewards, advertisements, shop, monetisation,
or mode selector. The reference is behavioural research only, not a source of
shipped art, assets, code or level data. See `INDEPENDENT_PRODUCT_IDENTITY.md`.

The browser UI and single-file-friendly `index.html` are not built yet. The
intended handoff is one ZIP with an obvious `index.html` when the game is ready.

## Research boundary
`../REFERENCE/` contains the original game's retained research materials.
Nothing in `PROJECT/` depends on that folder. Research notes distinguish
metadata facts from hypotheses and unresolved native-code behaviour.

## Progress and local saving

`web-port/progress.js` contains the independent Easy-only progression and
localStorage repository. It stores a versioned progress record, completed
level IDs, current level, batch count, and an optional current puzzle snapshot.
It intentionally has no scoring or reward fields. Run `npm test` to execute
the generator, interaction, and persistence tests.

## Latest hardening pass

Audit 08 adds strict validation for persisted puzzle snapshots and edge-case coverage for drag-stroke undo, no-op strokes, invalid input, locked levels and defensive copying. See `../REFERENCE/EXTENSIVE_AUDIT_08.txt`. The current 26-test suite passes. The browser UI is not yet implemented; these files are the independent game-logic core.

## First playable browser interface (v16)
`index.html` is now the standalone mobile-first entry point. It uses the independent
puzzle generator, board interaction model, and versioned local progress repository.
It includes deterministic level generation, fill/cross/erase tools, drag painting,
undo, reset, row/column completion feedback, a one-cell hint, completion flow,
and local resume. Open `index.html` through a static web server or a browser that
supports ES modules. The interface uses a new PrasannaOne visual identity and
contains no reference-game artwork, fonts, branding, or copied screen assets.
