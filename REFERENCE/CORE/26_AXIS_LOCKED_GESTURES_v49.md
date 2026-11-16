# Axis-locked Fill/Cross gestures (v49)

## User-facing rule
- Tap changes only the tapped cell.
- A horizontal drag paints only the row containing the starting cell.
- A vertical drag paints only the column containing the starting cell.
- The first meaningful movement selects the axis. Diagonal drift is projected onto the locked row or column.
- An 8px dead zone filters initial touch jitter.
- The starting cell determines the stroke target state: fill, cross or erase. Revisited cells do not toggle.

## Implementation
`PROJECT/web-port/pointer-input.js` exports `createAxisLockedStroke` and `getAxisLockedCell`. The app creates the stroke on pointer-down, resolves the visually targeted cell during pointer movement, projects it onto the selected axis, and clears the axis state on pointer-up/cancel/blur.

## Regression coverage
`PROJECT/tests/pointer-input.test.mjs` covers horizontal/vertical locking, diagonal drift, dead-zone handling and invalid input. The broader interaction tests continue to cover fixed fill/cross/erase intent and no inversion.

## Limits
Automated logic tests and generator stress checks pass. Real-device Android gesture feel still requires physical testing.
