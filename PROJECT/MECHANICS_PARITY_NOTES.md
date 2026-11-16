# Mechanics parity notes - current v40

| Area | Original evidence | PrasannaOne implementation |
|---|---|---|
| Tile states | Empty=0, Blue=1, Cross=99 | UNKNOWN/FILLED/CROSSED independent string values |
| Same-tool toggle | Native TileClicked can clear a tile when incoming state matches | Implemented |
| Drag | Native raycast pipeline processes touched tiles | Coordinate-based pointer painting |
| Undo | Native UndoStack with BasicUndo; latest ten actions | Latest ten per-cell actions |
| Completion | Separate row/column clue checks and whole-board check | Clue-run comparison |
| Single-cell hint | Random correct filled cell not already Blue; hint callback charges HintCost | Random correct filled cell, costs 5 product points |
| Line hint | Native method exists; detailed exact candidate policy partly open | Removed from product by user decision |
| Level generation | Easy/Medium/Hard arrays recovered as [5,6,7] / [7,8,9] / [10,11,12]; ten-level batches and random size bag recovered | Independent deterministic generator; current runtime remains Easy-only; selector not implemented |
| Level reward | First completion adds level.Points to User.Points; repeated completion does not reward again | Grid dimension × 30 points per first-time level completion; matches native formula |
| Hint economy | HintCost=150 and User.TryUsePoints; insufficient-points path | -5 product points per single-cell hint; deliberate provisional product price |
| Progression | EasyGamemode owns Levels and completion hooks | Continuous automatic endless sequence |
| Save | EasyGamemode Save/Load and lifecycle hooks | Browser localStorage schema v4 |

## Evidence confidence
- Native state values, toggle behaviour, hint target selection, hint cost callback, first-completion point award and User.TryUsePoints are directly supported by the mapped native methods/disassembly notes.
- Original difficulty arrays and serialized HintCost=150 are now recovered. Unity RNG seed/state, possible post-processing outside GenerateLevels and human difficulty distribution remain unknown. Original reward formula (dimension × 30) is recovered.
- The exact six-item size list assumption, deterministic shuffle seed, density/pattern filters, recent-fingerprint window and 5-point Hint price are independent product decisions. The product 5x5..10x10 schedule is independent; the original difficulty arrays span 5x5 through 12x12. The dimension × 30 reward formula is supported by native evidence.

## Current user-directed scope
Only Fill, Cross, Undo and one single-cell Hint are required. Row/column hint is intentionally absent. The goal is a simple, quick-win continuous loop, not a literal recreation of every original screen or monetisation feature.
