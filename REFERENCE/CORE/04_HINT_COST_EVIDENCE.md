# Serialized HintCost evidence

## Source object
- Asset container: `level3`
- MonoBehaviour PathID: `114`
- GameObject PathID: `25`
- Script: `Assembly-CSharp.dll / LevelManager` (MonoScript PathID `489`)
- Raw payload length: 232 bytes
- SHA-256: `19b63cac4aedbad21cdce9980afc43b1d3c90026686311b1da4d5c32216e5612`

## Schema-backed mapping
The Unity base header occupies bytes 0..31. Nine 12-byte PPtr references occupy bytes 32..139. The next two schema-declared Int32 fields are:

| Serialized offset | Field | Little-endian value |
|---:|---|---:|
| 140 | `HintCost` | **150** |
| 144 | `RowColumnHintCost` | **500** |

This mapping uses the IL2CPP field declaration order/types and the raw payload. These are serialized stream offsets, not native runtime object offsets (`+96` and `+100`).

## Product implication
The original single-cell Hint price is recovered. Our current product price is 5 points and remains a deliberate provisional product setting, not a missing research fact. Original level rewards are dimension × 30, so a 150-point hint would equal the reward for a first-clear 5x5 board. Do not change the live economy automatically; make a separate balancing decision.

## Provenance
Detailed field mapping and verification: `PROJECT/PHONE_DEEP_DUMP_FINDINGS_v35.md` and `REFERENCE/MECHANICS_RECOVERY_23.txt`. Raw source archive: `REFERENCE/PHONE_WORKFLOW/PHONE_DEEP_DUMP.zip`.
