# Metadata token resolution - mismatch explained

## The earlier mismatch

The static initializer targets contain words such as `0x80000001`. Those are not pointers and are not dimensions. The copy helper later dereferences a `FieldInfo*`, so the static file view alone appeared inconsistent.

## Runtime path

- Difficulty methods call `0x538f78` with the initializer target address before loading its first word.
- `0x538f78` branches to `0x5b3178`.
- `0x5b3178` sets the metadata-usage resolution flag and branches to `0x545764`.
- `0x545764` atomically reads the encoded token, extracts usage kind from bits 29..31 and the usage index from bits 1..28, then dispatches by kind.
- For kind 4, the dispatch reaches `0x5457f4`. It reads the corresponding field-reference pair, resolves its type/class and field index, and constructs the runtime `FieldInfo*`.
- The resolved pointer is atomically written back into the original static slot.
- The difficulty method then loads that patched pointer and passes it to `0xb681c8` / `0x5671c4`, which copies the requested number of bytes into the new `Int32[]`.

## Token decoding

| Token | Kind `(token >> 29) & 7` | Usage index `(token >> 1) & 0x0fffffff` |
|---|---:|---:|
| `0x80000001` | 4 | 0 |
| `0x80000003` | 4 | 1 |
| `0x80000005` | 4 | 2 |
| `0x80000007` | 4 | 3 |

The matching metadata field-reference rows are 0 through 3. Each row points to the same `<PrivateImplementationDetails>` type (`Il2CppType` index `0x18ab`, TypeDef index 5672) and selects field index 0 through 3.

## Direct evidence addresses

- Initializer resolver wrapper: `0x538f78` -> `0x5b3178` -> `0x545764`.
- Kind-4 field-reference dispatch: `0x5457f4`.
- FieldInfo field-data resolver: `0x5a2d98` -> `0x5459c4`.
- Copy helper: `0x5671c4`; `memcpy` tail: `0x432c40`.

This closes the static-token/runtime-pointer mismatch. The earlier claim that the encoded word reached `0x5a2d98` unchanged is superseded.
