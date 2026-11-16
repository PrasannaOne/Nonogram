# Next polish and verification after v46

## Implemented in v44, v45 and v46
- Original-inspired spacious visual hierarchy, centered title and level/board-size caption.
- SVG heart/home, Share, Settings, native About/Settings dialogs and short intro.
- Six persistent palettes: Lavender, Ocean, Rose, Forest, Midnight and AMOLED.
- Easy / Normal / Hard selector moved into Settings without changing independent progress.
- Share uses Web Share API, clipboard fallback and manual-copy fallback.
- Smooth cell/control/theme transitions and reduced-motion support.
- v44 introduced settings/share/themes; v45 restored the original-game simple play surface; v46 aligned the header and gestures further.
- v46: 90 automated tests, static audit, 340 generator samples, 60 difficulty samples and 2,000 endless unique-solution samples pass.
- v46: no visible progress sentence; top-left wordmark; right-side Heart / Share / Settings; circular glass-like controls; square grid.
- v46: one target state is locked for each fill/cross/erase drag and pointer-up no longer rebuilds the full grid DOM.

## Remaining work
1. Review screenshots on real Android at 320px, 360px, common larger phones, tablets and short landscape.
2. Verify clue contrast and readability in each of the six palettes, particularly 12x12 Hard.
3. Verify settings/about focus, close behaviour and scrolling on small screens.
4. Verify Share sheet and fallback behaviour on Android Chrome.
5. Verify theme persistence, difficulty progress isolation, PWA install/offline relaunch and service-worker update after deployment.
6. Human-play 20+ puzzles per mode and tune hint economy/difficulty only from actual feedback.

## Stop rule
Do not reopen original-game reverse engineering for ordinary product polish. Only investigate native behaviour when a concrete product question cannot be answered from existing evidence or a deliberate product decision.
