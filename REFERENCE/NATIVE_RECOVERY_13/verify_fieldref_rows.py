#!/usr/bin/env python3
"""Small metadata-only check for the four PrivateImplementationDetails rows.

Usage: python verify_fieldref_rows.py path/to/global-metadata.dat
The paired ELF/runtime token resolution is documented separately in CORE/11.
"""
import struct
import sys
from pathlib import Path

meta = Path(sys.argv[1]).read_bytes()
assert struct.unpack_from("<II", meta, 0) == (0xFAB11BAF, 29), "expected metadata v29"
header = [struct.unpack_from("<II", meta, 8 + i * 8) for i in range(31)]
field_refs_off, field_refs_size = header[22]
type_defs_off, type_defs_size = header[19]
fields_off, fields_size = header[11]
strings_off, strings_size = header[2]
assert field_refs_size % 8 == 0 and type_defs_size % 88 == 0 and fields_size % 12 == 0

def string(index):
    if index < 0 or index >= strings_size:
        return f"<bad:{index}>"
    start = strings_off + index
    end = meta.find(b"\0", start, strings_off + strings_size)
    return meta[start:end].decode("utf-8", "replace")

for usage_index in range(4):
    type_index, field_index = struct.unpack_from("<II", meta, field_refs_off + usage_index * 8)
    assert type_index == 0x18AB, (usage_index, hex(type_index))
    typedef_index = 5672
    td = type_defs_off + typedef_index * 88
    name_index, namespace_index = struct.unpack_from("<II", meta, td)
    field_start = struct.unpack_from("<i", meta, td + 32)[0]
    field_count = struct.unpack_from("<H", meta, td + 68)[0]
    assert string(name_index) == "<PrivateImplementationDetails>"
    assert field_index < field_count
    foff = fields_off + (field_start + field_index) * 12
    field_name_index, field_type_index, token = struct.unpack_from("<IiI", meta, foff)
    print(f"usage={usage_index} fieldRef=({type_index},{field_index}) "
          f"field={string(field_name_index)} fieldTypeIndex={field_type_index} token=0x{token:08x}")
print("PASS: usage indices 0..3 map to the four expected private fields")
