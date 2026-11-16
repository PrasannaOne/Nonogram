# Original generator pipeline - bounded native lift

**Method:** `LevelGenerator.GenerateLevels`, token `0x06000094`, VA `0x1150098`, body size 1,028 bytes.

## Directly observed

1. **Ten-level batches:** reads current level collection count, computes the next multiple-of-ten target, and generates until that target is reached.
2. **Size bag:** when the working list is empty, copies the original `levelSizes` list. It selects an index with `UnityEngine.Random.Range(0, Count)`, reads `List<T>.get_Item(index)`, then calls `List<T>.RemoveAt(index)`. Each bag is sampled without replacement; the list refills when exhausted.
3. **Square dimensions:** the selected dimension is written to both `NumberOfRows` and `NumberOfColumns`.
4. **Random cell fill:** nested loops call `UnityEngine.Random.Range(0, 2)` for each cell and store the resulting 0/1 byte in the generated matrix.
5. **Reward:** `NonogramLevel.Points = selectedDimension * 30`. Completion research confirms the reward is added only on first completion.

## Method-resolution cross-check

The call target `0xe2f584` maps to `UnityEngine.Random.Range(int, int)` in `UnityEngine.CoreModule.dll`, token `0x0600023d`. The list operations map to `System.Collections.Generic.List<T>.get_Item` (`0x92c1d0`) and `RemoveAt` (`0x92dac0`).

## What this does not prove

- The Unity RNG seed/state or a reproducible output sequence.
- That no other method ever post-processes generated boards. No uniqueness solver, density gate or rejection loop appears in this `GenerateLevels` body.
- That the original used the same uniqueness guarantees as our independent product generator.

## Product implication

Use the recovered size arrays for difficulty progression if desired, but retain our independent unique-solution generator and quality filters unless deliberately changing product behaviour. Hard requires 12x12 layout, accessibility and stress coverage before release.
