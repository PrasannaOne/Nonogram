# Evidence file map

## Start with CORE
`REFERENCE/CORE/` contains short, current, topic-sized handoff notes.

## Product implementation
- `PROJECT/index.html` - app shell.
- `PROJECT/web-port/nonogram.js` - generation, clues, uniqueness and fingerprints.
- `PROJECT/web-port/interaction.js` - board state, pointer strokes, undo and completion.
- `PROJECT/web-port/progress.js` - persistence, progression and points.
- `PROJECT/web-port/app.js` - screen, controls and automatic next puzzle.
- `PROJECT/tests/` - regression tests.
- `PROJECT/scripts/` - audit and stress scripts.
- `GITHUB_PAGES_UPLOAD/` in the compact handoff and `Nonogram_v44_GITHUB_PAGES_UPLOAD.zip` - deployable public site payload only.

## Native evidence
- Raw Unity/IL2CPP binaries, full method dumps and the deep phone dump are intentionally excluded from the compact v43/v44 handoff. Keep the original v42/v43 source archive as a cold forensic backup; do not add those binary payloads to the normal development package.
- `REFERENCE/NATIVE_RECOVERY_13/` - compact initializer slots, runtime token resolution, field-reference CSV, generator excerpts and runnable verification scripts.
- `PROJECT/PHONE_DEEP_DUMP_FINDINGS_v35.md` - LevelManager serialized field proof.
- `REFERENCE/PHONE_WORKFLOW/PHONE_DEEP_DUMP.zip` - raw phone extraction archive.

## Historical notes
`MECHANICS_RECOVERY_*.txt`, `EXTENSIVE_AUDIT_*.txt`, `DEEP_MECHANICS_TRACE_*.txt`, and `PROJECT/*_vNN.*` are preserved as history. Prefer the CORE files for current status; open a historical file only when a CORE note points to it or exact provenance is needed.
