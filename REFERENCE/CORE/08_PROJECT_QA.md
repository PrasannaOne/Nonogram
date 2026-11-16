# Project QA status - v41

## Original-game research verification (v40)
- Native static slots: 4/4.
- Field-reference rows: 4/4.
- Static array type sizes: 12 bytes for Easy/Normal/Hard; 32 bytes for excluded Mixed.
- SHA-256 value proof: all three difficulty arrays uniquely matched; Mixed cross-check matched.
- Runtime metadata kind-4 FieldInfo resolution and static-slot patching explained.

## Product implementation verification (v41)
- `npm test`: 72 passed, 0 failed.
- `npm run audit`: passed (7 unique HTML IDs, 6 direct app ID references, 7 named buttons, 7 JS modules).
- `npm run stress:generator`: 340 Easy puzzles, 0 failures.
- `npm run stress:difficulties`: 60 puzzles across all modes, 0 failures; includes 12x12 Hard.
- `npm run stress:endless`: 2,000 Easy puzzles, 0 failures, 2,000 unique fingerprints, all uniquely solvable.
- Legacy generator parity: 13 deterministic levels compared against v39 source, 0 mismatches; fixture at `PROJECT/tests/fixtures/legacy-easy-v39-parity.json`.
- Save isolation, v4 migration and 12x12 Hard snapshot save/reload tests pass.

## Not yet verified
- Real Android touch/layout, especially 12x12 clue legibility.
- Browser visual/E2E and screenshot review. Headless Chromium timed out in the v41 environment attempt.
- PWA installation, offline relaunch and service-worker update on Android Chrome.
- Human puzzle difficulty/variety and hint economy review.

See `PROJECT/QA_v41.txt`, `CORE/16_DIFFICULTY_IMPLEMENTATION.md` through `CORE/19_NEXT_POLISH.md`, and `PROJECT/RELEASE_CHECKLIST.md`.
