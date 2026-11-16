# levelSizes initializer: field-data resolver trace (updated v40)

## Runtime token resolution closes the old mismatch
The difficulty methods call `0x538f78` on the static target before loading its first word. That wrapper reaches `0x5b3178` and `0x545764`, which decodes the metadata-usage token and patches the slot with a runtime `FieldInfo*`. For kind 4, the dispatch reaches `0x5457f4`, resolves the field-reference row and constructs the FieldInfo pointer.

Therefore the later `0x5a2d98` dereference is valid: it receives the patched runtime descriptor, not the original `0x800000xx` word. The previous unresolved mismatch is superseded.

## Field-data copy path
- `0xb681c8` preserves the allocated array and resolved field descriptor.
- It reaches `0x5671c4`, which checks the array element type, reads array length at `[array + 0x18]`, multiplies by element width, and calls `0x5a2d98`.
- `0x5a2d98` reads the resolved field descriptor and calls `0x5459c4` through `0x5afb84`.
- `0x5459c4` derives the field index from the FieldInfo pointer and its declaring class field array, performs a `bsearch` over 12-byte field-data records, resolves the matching field-data base/offset and returns the source pointer.
- `0x5671c4` copies the bytes into the newly allocated `Int32[]` using `memcpy` at `0x432c40`.

## Resolved values
The actual ordered Int32 arrays are proven by the `PrivateImplementationDetails` field-name SHA-256 hashes. See `10_DIFFICULTY_ARRAYS_RECOVERED.md` and `12_HASH_PROOF.md`.

## Remaining boundary
The exact runtime address of each source data blob is not needed to establish the values after the field-name hash and 12/32-byte type-size cross-checks. Do not spend another pass trying to rediscover the same values from the resolver unless a new discrepancy appears.
