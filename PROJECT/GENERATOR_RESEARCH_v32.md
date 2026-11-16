SUPERSESSION NOTICE (v40): original Easy/Medium/Hard arrays and the runtime metadata-token resolution path are now recovered. See ../REFERENCE/CORE/10-14*.md. This v32 file is retained as historical context.

# Generator research v32

Date: 2026-11-16

## Original Easy generator: new native findings

The recovered native body for `LevelGenerator.GenerateLevels` is at VA `0x1150098`, token `0x06000094`, size 1,028 bytes. Unlike the older metadata-only interpretation, this pass follows its important ARM64 instructions and generic calls. Full annotated evidence: `../REFERENCE/MECHANICS_RECOVERY_20.txt`.

Confirmed / strongly supported original behaviour:

1. **Ten-level generation calls.** The method reads the current level collection count, rounds to the current ten-level boundary, and generates until the next ten-level target. This agrees with the embedded Dutch description: start with ten, then generate ten more after all ten are completed.
2. **Random size bag.** It calls `Random.Range(0, workingSizeList.Count)`, retrieves the selected item with `List<T>.get_Item`, then removes it with `List<T>.RemoveAt`. When the working list empties, it creates a fresh copy from the original `levelSizes` list. Therefore sizes are drawn without replacement until a bag is exhausted, then the bag is replenished.
3. **Dimensions.** The selected value is written to both `NumberOfRows` and `NumberOfColumns`; original generated grids are square.
4. **Size range.** Embedded Dutch metadata states generated levels vary between 5x5 and 10x10. The exact values/order in `levelSizes` have not been extracted. `[5,6,7,8,9,10]` is a high-confidence interpretation of the range, but still an assumption until the static collection is decoded.
5. **Reward formula.** The generator multiplies selected dimension by decimal 30 and stores the result in `NonogramLevel.Points`. `EasyGamemode.OnLevelComplete` awards that value to the user's balance on first completion only. Thus 5x5 yields 150 points and 10x10 yields 300 points.
6. **Hint price.** `HintCost` is a serialized `LevelManager` field consumed by the hint callback. Its numeric scene value remains unknown.

## Independent product implementation

The product now uses a deterministic shuffled size bag in hidden ten-level blocks. Each bag contains 5, 6, 7, 8, 9 and 10 once; after the six entries are used, a fresh shuffled bag supplies the remaining four levels in that ten-level block. This mirrors the recovered selection shape without storing level collections or copying Unity RNG/code.

Each square puzzle awards `size * 30` points on its first clear. Replays do not award points again. The single-cell Hint remains priced at 5 points as a provisional product default only; this is not presented as the original cost.

The player still sees one uninterrupted loop: launch directly into puzzle, solve, brief win cue, next puzzle. There is no menu or level selection. Only the current unfinished board and compact progress are saved.

## Generator quality and verification

The independent solution generator continues to enforce non-empty rows/columns, density and clue-variety filters, exact uniqueness, and a rolling fingerprint exclusion. It does not attempt to clone the original candidate algorithm.

- 62 automated tests passed.
- 340 seeded sample cases passed across all six sizes.
- 2,000-level stress: 2,000 generated, 2,000 distinct fingerprints, zero failures, each solution clue set checked to have exactly one solution. Size distribution: 336/342/329/339/328/326 for 5x5 through 10x10. Runtime ~48.5 s in this Node environment.

## Remaining unknowns

- Exact `levelSizes` values/order (the range is known; six consecutive entries inferred).
- Original Unity random seed/state.
- Serialized numeric `HintCost`.
- Candidate pattern/density and uniqueness logic inside the original generator.
- Human-perceived difficulty within Easy.

## Next step

Do not spend unlimited time reverse-engineering. If practical, decode the static size collection and serialized HintCost; then focus on real Android playtesting, visual fit at 10x10, and tuning the independent generator from actual play feedback.
