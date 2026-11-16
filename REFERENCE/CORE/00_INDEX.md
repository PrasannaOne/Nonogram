# Nonogram research quick index

**Current checkpoint:** v49 (axis-locked Fill/Cross strokes, glass-like UI and simplified play screen)  
**Product source:** v46 keeps the three independent difficulty modes and responsive 12x12 generator, with six persistent palettes, Share, Settings and About; one fixed target state and one row/column axis are locked per pointer stroke. **Research:** difficulty arrays are recovered; focus is product and device QA.

## Read first
1. [01_CURRENT_STATUS.md](01_CURRENT_STATUS.md) - current product and research status.
2. [20_RESPONSIVE_LAYOUT.md](20_RESPONSIVE_LAYOUT.md) - square-cell responsive board sizing.
3. [21_LAYOUT_TEST_MATRIX.md](21_LAYOUT_TEST_MATRIX.md) - deterministic viewport sizing checks.
4. [22_DEVICE_QA_LIMITS.md](22_DEVICE_QA_LIMITS.md) - manual device test plan and remaining limits.
5. [16_DIFFICULTY_IMPLEMENTATION.md](16_DIFFICULTY_IMPLEMENTATION.md) - shipped selector, schedules and 12x12 support.
6. [17_SAVE_MIGRATION.md](17_SAVE_MIGRATION.md) - per-mode progress and legacy save preservation.
7. [18_HARD_12X12_QA.md](18_HARD_12X12_QA.md) - 12x12 generator constraints and stress evidence.
8. [19_NEXT_POLISH.md](19_NEXT_POLISH.md) - bounded real-device and release QA.
9. [23_INTERFACE_POLISH_v44.md](23_INTERFACE_POLISH_v44.md) - theme, share and About foundation.
10. [24_VISUAL_POLISH_v45.md](24_VISUAL_POLISH_v45.md) - original-inspired game surface.
11. [25_GLASS_UI_AND_FIXED_STROKES_v46.md](25_GLASS_UI_AND_FIXED_STROKES_v46.md) - live UI and fixed-intent stroke rules.
12. [26_AXIS_LOCKED_GESTURES_v49.md](26_AXIS_LOCKED_GESTURES_v49.md) - one-row/one-column drag behaviour and verification.

## Original-game evidence
9. [10_DIFFICULTY_ARRAYS_RECOVERED.md](10_DIFFICULTY_ARRAYS_RECOVERED.md) - exact Easy / Normal / Hard arrays.
10. [11_METADATA_TOKEN_RESOLUTION.md](11_METADATA_TOKEN_RESOLUTION.md) - encoded handles and FieldInfo resolution.
11. [12_HASH_PROOF.md](12_HASH_PROOF.md) - raw bytes, field hashes and type-size proof.
12. [13_SCOPE_AND_CONFLICTS.md](13_SCOPE_AND_CONFLICTS.md) - conflicting historical size-range text.
13. [14_ORIGINAL_GENERATOR_PIPELINE.md](14_ORIGINAL_GENERATOR_PIPELINE.md) - recovered native generation flow.
14. [03_ORIGINAL_MECHANICS.md](03_ORIGINAL_MECHANICS.md) - other confirmed original mechanics.
15. [04_HINT_COST_EVIDENCE.md](04_HINT_COST_EVIDENCE.md) - serialized economy evidence.
16. [05_LEVELSIZES_CALLSITES.md](05_LEVELSIZES_CALLSITES.md) - exact native method call sites.
17. [06_LEVELSIZES_HANDLES.md](06_LEVELSIZES_HANDLES.md) - effective static slots and tokens.
18. [07_FIELD_DATA_RESOLVER.md](07_FIELD_DATA_RESOLVER.md) - resolver trace, now explained by runtime patching.
19. [08_PROJECT_QA.md](08_PROJECT_QA.md) - earlier source/test/device status.
20. [09_FILE_MAP.md](09_FILE_MAP.md) - where larger source evidence lives.
21. [15_NEXT_STEPS.md](15_NEXT_STEPS.md) - bounded product/research next actions.

## Rules
- These CORE files are the short current handoff. Historical `MECHANICS_RECOVERY_*`, versioned traces and full disassemblies remain preserved; do not reread them all every session.
- Use direct binary/disassembly evidence over older summaries when they conflict.
- Never interpret encoded metadata words as dimensions or pointers before runtime resolution.
- Product Normal maps to original `MediumGamemode`; this is a product naming decision.
- Mixed is excluded from the product, even though its original array was recovered as a cross-check.
- No original assets, branding, code or level content are to be copied into the independent game.
