# Product Scope - v44

## Current playable experience
- Header actions: SVG heart/home link, Share and Settings.
- Six persistent palettes: Lavender, Ocean, Rose, Forest, Midnight and AMOLED.
- About panel contains the short game introduction and GitHub repository link.
- Opens directly into the active puzzle; no start screen, menu or level picker.
- Easy / Normal / Hard selector inside Settings. Mixed is excluded.
- Easy uses recovered sizes [5,6,7]; Normal maps to original Medium [7,8,9]; Hard uses [10,11,12].
- Each difficulty owns its current level, highest unlocked level, completion streak, points, recent fingerprints and unfinished puzzle snapshot.
- Switching difficulty saves the active profile and restores the other profile without clearing its unfinished board.
- Independent unique-solution generator, quality filters and recent-repeat rejection.
- Fill, Cross, drag, Undo and one single-cell Hint.
- Automatic next puzzle after a win.
- First-clear reward uses dimension × 30 points.
- Product Hint price remains 5 points; original serialized HintCost=150 is evidence, not an automatic product balance change.

## Save migration
- New workspace key: `prasannaone.nonogram.game.v1`.
- Previous Easy-only `progress.v4` and v1-v3 saves migrate into the Easy profile.
- Existing unfinished Easy boards retain the v39 generator/schedule until that board is completed, preventing migration from silently replacing a live puzzle.
- Normal and Hard start as separate fresh profiles.

## Explicit exclusions
- Mixed mode.
- Row/Column Hint.
- Ads, monetisation, rewarded video and store.
- A separate start screen, full mode-selection screen or level picker; Settings/About remain lightweight overlays.
- Original branding, code, art, fonts or puzzle content.

## Evidence boundary
- Original arrays: Easy [5,6,7], Medium/Normal [7,8,9], Hard [10,11,12].
- Original generation method uses a random size bag without replacement/refill, square grids and per-cell Unity random 0/1 values.
- Product generator remains independently implemented and enforces exactly one solution plus quality filters.
- Exact Unity RNG seed/state is not required for this independent product implementation.
- Original reward formula is dimension × 30; current product adopts it.
- Original HintCost=150; product retains 5 pending human balance review.

## Remaining release gates
- Android touch/layout and real-device performance.
- Browser visual/E2E and screenshot review.
- PWA installation, offline relaunch and update testing.
- Human difficulty/variety and hint-economy review.
