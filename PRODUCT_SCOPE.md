# PrasannaOne Nonogram: product scope

A standalone, mobile-first, browser-playable Nonogram puzzle game.

## Product principles
- One relaxed Easy experience. No Easy/Normal/Hard/Mixed mode picker.
- A wholly independent visual identity, interface, assets, sounds, and source code. The reference game is behavioural research only, never a source of shipped creative assets or copied implementation.
- No scoring, points, coins, rewards, ads, shop, or monetisation mechanics.
- Core puzzle interaction: fill, cross, erase, drag painting, undo, and reset.
- Separate row/column completion feedback and whole-board completion.
- Generated puzzles with deterministic seeds and uniqueness validation.
- Local progress saving with a versioned browser storage schema.
- First ten levels in the opening batch; generate another batch after all ten
  are completed. This cadence is supported by a string in the reference
  metadata; the browser implementation is independently written.

## Reference boundary
The REFERENCE folder is read-only research material. It is not loaded by the
playable app. No original proprietary code, sprites, textures, fonts, sounds,
animations, branding, screen artwork, or level data are used in the independent
runtime. Research findings are translated into generic functional requirements;
all product expression and implementation are designed independently. See
`INDEPENDENT_PRODUCT_IDENTITY.md` for the release guardrails.
