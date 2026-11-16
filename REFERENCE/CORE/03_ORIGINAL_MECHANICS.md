# Original mechanics: confirmed facts only

| Mechanic | Evidence-backed finding | Product status |
|---|---|---|
| Difficulty arrays | Easy `[5,6,7]`; Medium `[7,8,9]`; Hard `[10,11,12]` | Implemented Easy / Normal / Hard selector; independent product generator |
| Mixed | Original cross-check `[5,6,7,8,9,10,11,12]` | Excluded by user decision |
| Grid shape | Rows and columns both receive selected dimension | Product uses square boards |
| Size selection | Random index, `List<T>.get_Item`, `RemoveAt`; refill when empty | Product uses independent deterministic size bag |
| Batch progression | Generates to next ten-level boundary | Product uses independent endless loop |
| Cell generation | `UnityEngine.Random.Range(0,2)` per cell, stored as 0/1 | Product uses independent seeded generator and quality filters |
| First-clear reward | `Points = dimension * 30`; first completion adds level points once | Already adopted |
| Single-cell Hint | Correct filled cell selected; cost goes through `TryUsePoints`; serialized cost 150 | Implemented independently; current price 5 is provisional |
| Row/Column Hint | Separate callback; serialized cost 500 | Intentionally excluded |
| Input/state | Original tile states Empty=0, Blue=1, Cross=99; same-tool click can clear | Product uses independent internal values; same-tool toggle implemented |
| Undo | Native undo stack with latest ten actions | Product has latest-ten per-cell undo |

## Boundaries
- Exact original difficulty arrays are recovered; see `10_DIFFICULTY_ARRAYS_RECOVERED.md`.
- Unity RNG seed/state and exact output sequence are unknown.
- No uniqueness check is visible in the recovered `GenerateLevels` method; do not claim the original used one.
- Our independent generator's uniqueness and quality filters are product choices, not claims of original parity.
