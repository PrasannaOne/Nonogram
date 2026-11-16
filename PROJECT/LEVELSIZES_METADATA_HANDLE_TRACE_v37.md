# Native `levelSizes` Metadata-Handle Trace (v37)

Date: 2026-11-16  
Base: uploaded `PrasannaOne_Nonogram_COMPLETE_v36.zip`. This is a research-only update; no runtime/product source changed.

## Purpose

Continue the original `levelSizes` initializer investigation without repeating the already-established allocation lengths. This pass re-read the v36 handoff files, inspected the exact ARM64 call sites, resolved the relocation-backed static slots, and disassembled the common helper path.

## 1. Corrected static-slot interpretation

The v36 trace correctly found that Easy executes `ADRP X21, 0x1aa9000`, but it incorrectly treated the separate class-initialization access at `0x1aa97a8` as the initializer-data reference.

The actual initializer argument is loaded at Easy VA `0x1150050` by `LDR X1, [X21]`. At that point `X21` still contains the page address `0x1aa9000`. Therefore the actual slot is **VA `0x1aa9000`**, not `0x1aa97a8`.

The `0x1aa97a8` access occurs earlier at `0x1150030` as part of the class-initialization guard (`bl 0x538f78`). Its relocation target `0x1b29170` is not the direct argument loaded for `InitializeArray`/the common helper.

This distinction matters: do not use the v36 pointer `0x1b29170` as proof of the Easy array's raw Int32 initializer bytes.

## 2. Four mode-specific static slots and relocation targets

The common instruction sequence loads the first pointer stored at each slot and passes it as `X1` to helper `0xb681c8` before calling `LevelGenerator.GenerateLevels`.

| Mode | Static slot VA | Relocation-applied target VA | Array allocation length |
|---|---:|---:|---:|
| Easy | `0x1aa9000` | `0x1b15630` | 3 Int32s |
| Hard | `0x1a94448` | `0x1b29180` | 3 Int32s |
| Medium | `0x1a96d10` | `0x1b29188` | 3 Int32s |
| Mix | `0x1a91080` | `0x1b29178` | 8 Int32s |

These are direct instruction + ELF relocation observations. The slot/target mapping was independently checked against `.rela.dyn` entries and the bytes in the mapped RW `PT_LOAD` segment.

## 3. Raw bytes at the targets

The pointed-to data begins as follows (little-endian 64-bit words):

- Easy `0x1b15630`: `0x00000000c001077d`, `0x00000000c001077f`, `0x00000000c0010781`, `0x00000000c0010783`, `0x00000000c0010785`, `0x00000000c0010787`, then `0x00000000c0009e87`, `0x00000000c0009e8f`, ...
- Hard `0x1b29180`: `0x0000000080000005`, `0x0000000080000007`, `0x0000000080000009`, `0x000000008000000b`, ...
- Medium `0x1b29188`: `0x0000000080000007`, `0x0000000080000009`, `0x000000008000000b`, ...
- Mix `0x1b29178`: `0x0000000080000003`, `0x0000000080000005`, `0x0000000080000007`, ...

These are **not decoded grid dimensions**. The patterns look like encoded handles/indices, not ordinary signed Int32 dimensions. In particular, treating `0x80000005` as the integer 5 would be unjustified without proving how the helper consumes this representation.

## 4. Common helper path: what is and is not established

At `0xb681c8`, the code retains the array in `X20` and the supplied static pointer in `X19`, then obtains another pointer through runtime metadata/class state and compares it with `X19` using the tiny equality helper at `0x7d7b40`. If unequal, it branches to `0x5671c4`; if equal, it follows the exception/error path.

`0x7d7b40` is definitively just `CMP X0, X1; CSET W0, EQ; RET`.

At `0x5671c4`, the routine uses the destination array and its second argument to determine the copy size and eventually branches to `memcpy` at `0x432c40`. The current trace does **not** yet explain how the encoded values at the static targets become the structure/pointer expected by this routine. It would be unsafe to label the values as final field handles or to infer dimensions from them.

The metadata-registration probe in this archive reports `metadataUsages count = 0` in its recovered registration structure. That does not, by itself, prove there is no other runtime metadata indirection; it only means the existing registration parser does not expose a populated metadata-usage array here.

## 5. Next investigation, narrowly scoped

1. Resolve the encoded `0xC001....` and `0x800000..` entries through the exact runtime metadata/field-handle representation consumed by `0xb681c8` and `0x5671c4`.
2. Identify the runtime structure reached through the metadata pointer chain at `0xb68200` and its `+0xb8` member.
3. Trace the helper calls around `0x590f80`, `0x5911c0`, and `0x5a2d98` far enough to identify the source pointer and byte count passed to `memcpy`.
4. Once the source bytes are located, decode exactly 3 signed Int32s for Easy, Hard, Medium and 8 for Mix, then cross-check against the embedded dimension metadata.

Do not repeat the allocation-length comparison or claim the three values are known until the source bytes have been identified.

## Confidence

**DIRECT:** four allocation lengths; four load instructions and static-slot VAs; four relocation targets; raw target bytes; helper control flow; equality helper implementation; final `memcpy` branch.

**UNRESOLVED:** semantic type of encoded words; metadata indirection; exact initializer bytes; all original `levelSizes` integer values and their order.

## Verification

- Read v36 `START_HERE.txt` and `RECOVERY_START_HERE.txt` before analysis.
- Rechecked the four mode disassembly blocks and ELF relocations.
- No runtime/product code changed.
