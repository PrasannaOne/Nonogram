# PrasannaOne Nonogram: Independent Product Identity

## Non-negotiable direction

Build a new product that stands on its own. The reference game is a source of behavioural research only. We are not making a reskin, pixel-perfect clone, asset port, or branded imitation.

## What we may learn from the reference

- General Nonogram rules and familiar interaction concepts.
- Broad feature behaviour: fill/cross/erase, undo, hints, line completion, puzzle progression, persistence, navigation and feedback.
- Technical lessons about scene organisation, input handling, state management and performance.
- The user's screenshot as a checklist of functional information that a puzzle screen needs to communicate.

## What must be independently designed

- Product name, logo, icon, brand voice and all written microcopy.
- Colour palette, typography, spacing system, visual hierarchy, shapes, button treatments and motion language.
- Every icon and illustration. Do not extract or reuse the reference game's sprites, textures, fonts, sounds, animations or other expressive assets.
- Screen composition and navigation patterns. Keep the required information and controls, but design a distinct arrangement and visual grammar.
- Puzzle content, level identities, tutorials, onboarding and any promotional material.
- All source code and data structures. Do not copy decompiled code or proprietary level data.

## Feature parity is not visual copying

The product should support the useful capabilities identified during research, but express them through our own interaction design. For example, retain a back action, undo, hint access, grid status, points-free puzzle information and fill/cross/erase tools where they serve the product. Their iconography, placement, shape, wording and visual treatment must be newly created.

## Product personality

A calm, focused, modern puzzle experience. It should feel deliberate and recognisably ours, not like the reference with a new coat of paint. Use a fresh design system and test it at phone sizes first.

## Release checklist

- [ ] No reference-game name, logo, branding or confusingly similar identity.
- [ ] No extracted reference sprites, textures, fonts, sounds, animations or level data in the shipped app.
- [ ] No copied/decompiled reference source code in the shipped app.
- [ ] Fresh palette, type choices, icon family, spacing, screen layouts and motion.
- [ ] Independently generated or properly licensed puzzle content.
- [ ] Feature requirements traced to our own product specification and tests.
- [ ] Reference material remains isolated in `REFERENCE/` and is never imported by the runtime.
