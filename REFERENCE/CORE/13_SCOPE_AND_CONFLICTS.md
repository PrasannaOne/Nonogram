# Scope, conflicts and confidence boundaries

## Dutch size-range string versus recovered modes

The metadata contains Dutch text translated as: generated levels have different sizes between 5x5 and 10x10. Earlier research treated this as a global maximum. The recovered per-mode initializer arrays now show:

- Easy: 5x5 through 7x7
- Medium / product Normal: 7x7 through 9x9
- Hard: 10x10 through 12x12
- Mixed: 5x5 through 12x12

The same historical analysis report also records store-listing copy describing 5x5 through 12x12. The Dutch string's exact scope is not identified; it may describe a particular mode or be stale/incomplete for this APK build. It must not override the directly recovered arrays.

## Product boundary

The independent product should use the recovered difficulty schedules only after the user-approved selector and separate-progress architecture are implemented. Its existing uniqueness and quality filters are intentional product improvements, not original-game parity. Mixed remains excluded. Do not copy original code, assets, branding or level content.
