# Product decisions (current)

## Approved
- Independent Nonogram product; no original branding, assets, code or level content.
- Compact difficulty selector in the top game settings: **Easy / Normal / Hard**.
- Product Normal maps to original `MediumGamemode`.
- No Mixed mode.
- Preserve independent progress for each difficulty.
- Switching difficulty must not erase or mutate an unfinished puzzle.
- Keep direct-to-game play; avoid adding a large mode-selection screen.

## Recovered reference schedules
- Easy: `[5,6,7]`.
- Normal / original Medium: `[7,8,9]`.
- Hard: `[10,11,12]`.
- Mixed: `[5,6,7,8,9,10,11,12]`, retained only as a research cross-check and excluded from product scope.

## Implemented in v41
- Initial compact top-bar selector: Easy / Normal / Hard; moved into Settings in v44.
- Recovered difficulty size bags wired into the independent generator.
- Separate level/progress/points/recent fingerprints/unfinished board per mode.
- 12x12 Hard support in generator, solver, board persistence and reward validation.
- Legacy Easy save migration preserves an unfinished v39 puzzle using the old generator until completion.

## Still separately decided
- Whether to adopt original `HintCost = 150` or retain/tune our own 5-point price.
- Any future changes to puzzle generation, rewards or board flow beyond current product decisions.

## Release gate
Selector and save isolation are implemented and automated tests pass. Physical Android/browser/PWA checks and human puzzle-quality review remain. Keep the independent unique-solution generator unless deliberately changing product behaviour. Do not change the current 5-point Hint economy automatically.


## v44 interface decisions
- Keep direct-to-game launch. Settings and About are lightweight overlays, not a start/menu screen.
- Put difficulty selection inside Settings, preserving Easy / Normal / Hard and isolated progress.
- Approved palettes: Lavender (default), Ocean, Rose, Forest, Midnight and AMOLED black. Preference is stored separately from puzzle progress.
- Keep a small SVG heart/home link, Share action and Settings icon in the header. About owns the concise game intro, creator credit and GitHub repository link.
- The original image is a visual direction reference only; do not use original assets, branding, fonts or proprietary content.
