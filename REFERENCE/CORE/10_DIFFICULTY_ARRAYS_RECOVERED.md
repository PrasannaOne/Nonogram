# Original difficulty arrays - recovered

**Status: values recovered from the paired v29 metadata + ARM64 ELF.**

| Product label | Original class | `levelSizes` Int32 values | Grid sizes |
|---|---|---|---|
| Easy | `EasyGamemode` | `[5, 6, 7]` | 5x5, 6x6, 7x7 |
| Normal | `MediumGamemode` | `[7, 8, 9]` | 7x7, 8x8, 9x9 |
| Hard | `HardGamemode` | `[10, 11, 12]` | 10x10, 11x11, 12x12 |

`Normal = original Medium` is the approved product naming mapping. It is not an original class rename. Mixed remains excluded from the product.

## Independent evidence chain

1. Native call sites prove Easy, Hard and Medium each allocate a three-element `Int32[]` and pass it to `LevelGenerator.GenerateLevels`.
2. Corrected static slots resolve to metadata usage tokens: Easy `0x80000001`, Mix `0x80000003`, Hard `0x80000005`, Medium `0x80000007`.
3. Runtime metadata initialization resolves usage kind 4 (FieldInfo) and patches each token slot with a runtime `FieldInfo*` before the copy helper reads it.
4. The four usage indices map to four consecutive fields in `<PrivateImplementationDetails>` TypeDef 5672.
5. Easy/Hard/Medium fields use `__StaticArrayInitTypeSize=12`, matching three Int32 values. Their field names are SHA-256 digests of the exact little-endian Int32 bytes.
6. Brute-force search of all ordered triples in the conservative range 1..30 yields one matching triple for each target digest.

See `11_METADATA_TOKEN_RESOLUTION.md`, `12_HASH_PROOF.md`, and `../NATIVE_RECOVERY_13/` for independently runnable verification.

## Additional cross-check (not product scope)

The excluded Mixed field has type `__StaticArrayInitTypeSize=32`; its field-name digest matches `[5, 6, 7, 8, 9, 10, 11, 12]`. This cross-check supports the SHA-256 interpretation but does not change the product decision to omit Mixed.

## Important correction

Hard reaches 12x12. Older notes that treated 10x10 as the original global maximum relied on a Dutch metadata string describing 5x5 through 10x10 and are superseded for the three difficulty arrays by the direct initializer/hash evidence. The store-listing/metadata discrepancy is recorded in `13_SCOPE_AND_CONFLICTS.md`; do not silently cap Hard at 10.
