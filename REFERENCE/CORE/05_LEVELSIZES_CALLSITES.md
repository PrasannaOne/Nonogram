# Original levelSizes: method call sites

All addresses below are ELF virtual addresses in the archived ARM64 `libil2cpp.so`.

| Original class/method | Method VA | Array length | Helper | Generator call |
|---|---:|---:|---:|---:|
| `EasyGamemode.GenerateNewLevels` | `0x114ffe8` | 3 | `0xb681c8` | `0x1150098` |
| `HardGamemode.GenerateNewLevels` | `0x11514e8` | 3 | `0xb681c8` | `0x1150098` |
| `MediumGamemode.GenerateNewLevels` | `0x1151bac` | 3 | `0xb681c8` | `0x1150098` |
| `MixGamemode.GenerateNewLevels` | `0x1152270` | 8 | `0xb681c8` | `0x1150098` |

The first three each allocate a three-element `Int32[]` and pass it as `levelSizes` to `LevelGenerator.GenerateLevels`. Mix is out of product scope.

## Important distinction
The product's approved labels are Easy / Normal / Hard. The original class names are Easy / Medium / Hard. **Normal = original Medium** is the approved product naming mapping, not an original-game naming fact.

## Evidence source
`REFERENCE/NATIVE_RECOVERY_12/ASSEMBLY_CSHARP_ALL_METHOD_DISASSEMBLY.txt` and the archived `libil2cpp.so`. The relevant method bodies are small ranges around the VAs in the table.

The exact values for the first three rows are now recovered; see `10_DIFFICULTY_ARRAYS_RECOVERED.md`.
