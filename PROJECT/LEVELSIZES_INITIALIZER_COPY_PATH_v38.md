# `levelSizes` Initializer Copy-Path Analysis (v38)

Date: 2026-11-16  
Base: uploaded `PrasannaOne_Nonogram_COMPLETE_v37.zip`.  
Scope: continue the unresolved native initializer trace for Easy, Medium and Hard. No runtime/product source changes.

## 1. What this pass established

The helper chain previously described as an opaque path ending in `memcpy` can now be characterized more precisely as the managed-array initialization/copy path:

- `0xb681c8` retains the destination array (`X20`) and the supplied field/handle argument (`X19`).
- It obtains a runtime metadata/class pointer through the global at `0x1ab8b58`, follows the `+0xb8` member, and compares the resulting pointer with `X19` using `0x7d7b40` (`CMP X0, X1; CSET W0, EQ; RET`).
- On the non-equal path it tail-branches to `0x5671c4`, passing the destination array and the field/handle argument.
- `0x5671c4` obtains the destination array's element type/class, validates the supplied field's type compatibility, reads the array length from `[array + 0x18]`, multiplies by the element width, resolves the field's data pointer through `0x5a2d98`, and copies bytes into `[array + 0x20]` via `memcpy` at `0x432c40`.

This is consistent with the `RuntimeHelpers.InitializeArray`-style operation. The important reverse-engineering consequence is that the static targets recorded in v37 are not the final Int32 contents: they are inputs to a runtime field-data resolution path.

## 2. Key instruction evidence

At `0xb681c8`:

- `0xb68200`: load the global runtime metadata pointer.
- `0xb68210`: follow its `+0xb8` member.
- `0xb68214`: load the referenced pointer.
- `0xb68218`: call the pointer equality helper.
- `0xb68230`: branch to `0x5671c4` with array in `X0` and field/handle argument in `X1`.

At `0x5671c4`:

- `0x5671d0`: load array class from `[array]`.
- `0x5671e8` and subsequent calls inspect the array element type and field type.
- `0x56723c`: load array length from `[array + 0x18]`.
- `0x567240`: multiply by the element size.
- `0x567244`: call `0x5a2d98` to resolve the source data pointer.
- `0x567248` / `0x56725c`: prepare destination `[array + 0x20]`, source pointer and byte count.
- `0x567264`: tail-branch to `memcpy`.

The helper bodies were independently disassembled from the archived `libil2cpp.so` using `llvm-objdump` in this pass. The key addresses above are virtual addresses in that ELF image.

## 3. What remains unresolved

The field-data resolver `0x5a2d98` has not yet been followed through its full runtime object/metadata path to the exact source bytes. The encoded-looking values at the v37 targets must not be decoded as dimensions or copied directly into the product.

Still unknown:

- exact source byte address for each field initializer;
- exact three signed Int32 values and order for Easy;
- exact three signed Int32 values and order for Medium;
- exact three signed Int32 values and order for Hard.

Mix has an eight-element initializer, but it is outside the agreed product difficulty selector and is not a target for product implementation.

## 4. Product direction recorded

The product should expose only **Easy / Normal / Hard** in a compact top-settings difficulty control. Do not add Mixed mode. Keep the difficulty setting separate from the active puzzle: switching difficulty must not silently mutate an in-progress board. Preserve independent progression/save state per difficulty. Do not wire the selector to guessed original values; first recover and document the original Easy/Medium/Hard initializer contents, then decide how much to reproduce versus intentionally differentiate.

Current product runtime remains Easy-only. This document records the approved direction, not an implemented UI change.

## 5. Verification and scope

- Re-read v37 `START_HERE.txt` and `RECOVERY_START_HERE.txt`.
- Re-disassembled `0xb681c8`, `0x5671c4`, `0x590f80`, `0x5911c0`, and `0x5a2d98`.
- Confirmed the helper's destination-array layout, element-size multiplication, source-pointer resolution call, and `memcpy` destination/source/length setup.
- No runtime/product code changed in this checkpoint.

## Confidence

**DIRECT:** helper instructions, pointer-equality helper, destination-array length access, element-size multiplication, source-pointer resolver call, and final memcpy setup.

**HIGH-CONFIDENCE SEMANTIC INTERPRETATION:** the helper implements the runtime field-data-to-array initialization path equivalent to `RuntimeHelpers.InitializeArray` behavior.

**UNRESOLVED:** actual source data bytes and all Easy/Medium/Hard `levelSizes` values/order.
