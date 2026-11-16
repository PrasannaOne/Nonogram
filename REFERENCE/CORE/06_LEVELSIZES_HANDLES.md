# Original levelSizes: corrected static handles and resolved fields

All addresses are ELF virtual addresses in the archived ARM64 `libil2cpp.so`.

| Mode | Effective slot VA | Relocation target VA | Encoded token | Usage index | Field index | Array |
|---|---:|---:|---:|---:|---:|---|
| Easy | `0x1aa97a8` | `0x1b29170` | `0x80000001` | 0 | 0 | `[5,6,7]` |
| Mix (excluded) | `0x1a91080` | `0x1b29178` | `0x80000003` | 1 | 1 | `[5,6,7,8,9,10,11,12]` |
| Hard | `0x1a94448` | `0x1b29180` | `0x80000005` | 2 | 2 | `[10,11,12]` |
| Medium / product Normal | `0x1a96d10` | `0x1b29188` | `0x80000007` | 3 | 3 | `[7,8,9]` |

## Easy correction proof
1. `0x114fffC`: `ADRP X21, 0x1aa9000`.
2. `0x1150008`: branch to `0x115fc6c`.
3. `0x115fc6c`: `LDR X21, [X21, #0x7a8]`, so effective slot is `0x1aa97a8`.
4. ELF relocation at `0x1aa97a8` is `R_AARCH64_RELATIVE -> 0x1b29170`.
5. The mode initializer calls the metadata resolver on the target before loading the first field handle.

The old v37 Easy entry (`0x1aa9000 -> 0x1b15630`) missed the branch-stub register rewrite and is superseded.

## Runtime token interpretation
The encoded words are metadata-usage tokens, not dimensions or final pointers. Kind 4 resolves a FieldInfo reference. See `11_METADATA_TOKEN_RESOLUTION.md`.
