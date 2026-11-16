# Responsive layout verification matrix

The layout calculator is tested with a worst-case 12x12 clue envelope (up to six clue runs in each direction and an 11-character row-clue label).

| Viewport profile | Test viewport | Modelled board-wrap width | Modelled board-wrap height | Cell size |
|---|---:|---:|---:|---:|
| Small Android portrait | 320x568 | 300 | 312 | 20 px |
| Standard Android portrait | 360x800 | 340 | 440 | 22 px |
| Large Android portrait | 432x960 | 412 | 528 | 27 px |
| Compact landscape | 667x375 | 647 | 262 | 17 px |
| Wide landscape | 800x360 | 780 | 252 | 16 px |
| Tablet portrait | 768x1024 | 748 | 563 | 39 px |
| Desktop | 1280x900 | 700 | 495 | 34 px |

These are deterministic calculator outputs using representative available-space assumptions, not screenshots from real devices. The test asserts positive usable cell size, square cell tracks and no calculated board overflow.

Automated suite: 77 tests passed. Static audit: passed. Generator stress: 340/340. Cross-difficulty stress: 60/60 including 12x12. Endless Easy stress: 2,000/2,000 unique fingerprints and unique solutions.
