# Static-array SHA-256 proof

The compiler-generated `<PrivateImplementationDetails>` field names are 64-hex-character SHA-256 digests. For each difficulty field, the digest matches the raw bytes of the recovered ordered little-endian Int32 values.

| Mode | Field index | Field name SHA-256 | Raw Int32 bytes (hex) | Values |
|---|---:|---|---|---|
| Easy | 0 | `2e4c4603cb0dea8636f8e802bfa0f24caef5f9943377f91d89fd6fbd9577cd1c` | `050000000600000007000000` | `[5,6,7]` |
| Hard | 2 | `a56d6bbbe254a23749343fb727e7f348b719bc6314763d6a792843e2f7c466ee` | `0a0000000b0000000c000000` | `[10,11,12]` |
| Normal / Medium | 3 | `bcbc01a5036673e493422616677a83718edfe475d3e938b1a879903ffb2a05a0` | `070000000800000009000000` | `[7,8,9]` |
| Mixed (excluded) | 1 | `6da17e477bd491ee17f20b42cc7669458bc3d798dd5e41a42c06c23df1179348` | `05000000060000000700000008000000090000000a0000000b0000000c000000` | `[5,6,7,8,9,10,11,12]` |

## Type-size cross-check

- Fields 0, 2 and 3 reference metadata type index 13687 -> TypeDef 5670 -> `__StaticArrayInitTypeSize=12`.
- Field 1 references metadata type index 13689 -> TypeDef 5671 -> `__StaticArrayInitTypeSize=32`.
- The type sizes exactly match 3 and 8 Int32 values respectively.

Run `../NATIVE_RECOVERY_13/verify_sha256_arrays.py` to recompute the three-value search and verify the Mixed cross-check digest.
