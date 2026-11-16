SUPERSESSION NOTICE (v40): the three difficulty arrays are now recovered and hash-verified. See ../REFERENCE/CORE/10_DIFFICULTY_ARRAYS_RECOVERED.md. This file is retained as historical trace only.

# Native `levelSizes` Initializer Trace (v36)

Date: 2026-11-16  
Base: uploaded `PrasannaOne_Nonogram_COMPLETE_v35.zip`; no runtime source edits.

## Findings added in this pass

### 1. The allocation lengths are mode-specific and confirmed across four methods

The ARM64 method bodies in `NATIVE_RECOVERY_12/FOCUSED_GAMEPLAY_DISASSEMBLY.txt` and `ASSEMBLY_CSHARP_ALL_METHOD_DISASSEMBLY.txt` show the following immediate array lengths before the shared call to `LevelGenerator.GenerateLevels`:

| Method | Method token | Native VA | `MOV W1, #...` |
|---|---:|---:|---:|
| `EasyGamemode.GenerateNewLevels` | `0x06000013` | `0x114ffe8` | 3 |
| `HardGamemode.GenerateNewLevels` | `0x0600001e` | `0x11514e8` | 3 |
| `MediumGamemode.GenerateNewLevels` | `0x0600002e` | `0x1151bac` | 3 |
| `MixGamemode.GenerateNewLevels` | `0x06000039` | `0x1152270` | 8 |

Each method allocates an `Int32[]`, loads a mode-specific static reference, calls the same helper at `0xb681c8`, and passes the resulting array to the shared `LevelGenerator.GenerateLevels` at `0x1150098`. The four methods have matching control-flow structure; Mix differs in the immediate array length. This is direct disassembly evidence.

### 2. Easy's static initializer reference is now pinned to a concrete data slot

In Easy's method:

- `ADRP X21, 0x1aa9000`
- `LDR X21, [X21, #0x7a8]`
- therefore the referenced global slot is VA `0x1aa97a8`
- after applying the ELF relocations, the slot contains pointer `0x1b29170`
- the pointed-to bytes begin with 64-bit words `0x80000001`, `0x80000003`, `0x80000005`, `0x80000007`, ... through `0x80000017` in the captured region.

This is a useful new anchor for continuing the static-data resolution. It is **not** evidence that these words are grid dimensions. They look like encoded runtime/metadata references, but their exact representation and relationship to the field handle have not yet been established. They must not be interpreted as the `levelSizes` values.

### 3. Helper semantics are not assumed

The target at `0xb681c8` was independently disassembled. It performs runtime metadata/class initialization checks and then dispatches through another helper. The call sequence alone does not justify naming it `RuntimeHelpers.InitializeArray`, nor does the current trace establish the contents of the destination array. The earlier shorthand description “initializer helper” remains deliberately neutral.

## Exact values remain unresolved

The original Easy `levelSizes` array is definitely length 3, but the three signed Int32 contents and their order are still not decoded. The same applies to the three-element Medium and Hard arrays and the eight-element Mix array. No values are inferred from the overall 5..10 dimension bounds.

## Next technical steps

1. Resolve the four mode-specific static references from their GOT/data slots, including the Easy slot at `0x1aa97a8`.
2. Identify the exact runtime structure expected by helper `0xb681c8` and the downstream helper at `0x5671c4`; do not label either from a guessed symbol name.
3. Trace how the `0x80000001`, `0x80000003`, ... encoded words are consumed or resolved.
4. Map the resolved static reference to the generated `<PrivateImplementationDetails>` field or equivalent metadata object, then recover the actual Int32 initializer bytes.
5. Cross-check the resulting three values against the game's embedded 5x5..10x10 metadata, while keeping metadata bounds separate from the initializer itself.

## Verification and scope

- Re-read `START_HERE.txt` and `RECOVERY_START_HERE.txt` in the uploaded v35 archive before continuing.
- Compared Easy, Hard, Medium and Mix native method bodies.
- Independently disassembled helper `0xb681c8` and the helper it calls at `0x7d7b40`; the latter is a pointer equality test, not an array copy routine.
- Re-ran `npm test`: 62 passed, 0 failed.
- Re-ran `npm run audit`: passed.
- No product/runtime source changed.
- Browser visual/E2E and physical Android/PWA tests remain outstanding.

## Confidence labels

**DIRECT:** all four allocation lengths; each mode's distinct static-reference load instruction; Easy static slot VA; relocation-applied pointer and raw bytes at the target; call targets and native control flow.

**UNRESOLVED:** semantic identity of the encoded words; helper's complete high-level semantics; all actual `levelSizes` integer contents and order.
