#!/usr/bin/env python3
"""Resolve PrivateImplementationDetails field type indexes to size TypeDefs.

Usage: python verify_field_type_sizes.py path/to/libil2cpp.so path/to/global-metadata.dat
The script validates the unique metadata-registration type table before reading it.
"""
import struct
import sys
from pathlib import Path

b = bytearray(Path(sys.argv[1]).read_bytes())
m = Path(sys.argv[2]).read_bytes()
U16 = lambda o: struct.unpack_from("<H", b, o)[0]
U32 = lambda o: struct.unpack_from("<I", b, o)[0]
U64 = lambda o: struct.unpack_from("<Q", b, o)[0]
assert b[:6] == b"\x7fELF\x02\x01"
assert struct.unpack_from("<II", m, 0) == (0xFAB11BAF, 29)
H = [struct.unpack_from("<II", m, 8 + i * 8) for i in range(31)]
type_defs_off, type_defs_size = H[19]
type_count = type_defs_size // 88
strings_off, strings_size = H[2]

def string(i):
    if i < 0 or i >= strings_size:
        return f"<bad:{i}>"
    p = strings_off + i
    e = m.find(b"\0", p, strings_off + strings_size)
    return m[p:e].decode("utf-8", "replace")

phoff = U64(32); phents = U16(54); phnum = U16(56)
loads = []
for i in range(phnum):
    o = phoff + i * phents
    typ, flags = struct.unpack_from("<II", b, o)
    off, va, _, filesz, memsz, _ = struct.unpack_from("<QQQQQQ", b, o + 8)
    if typ == 1:
        loads.append((flags, off, va, filesz, memsz))

def vaoff(va):
    for _, off, base, filesz, _ in loads:
        if base <= va < base + filesz:
            return off + va - base
    raise ValueError(f"unmapped VA {va:#x}")

# Apply RELATIVE and ABS64 relocations, matching the v29 registration parser.
shoff = U64(40); shents = U16(58); shnum = U16(60); shstrndx = U16(62)
sections = []
for i in range(shnum):
    o = shoff + i * shents
    name, typ = struct.unpack_from("<II", b, o)
    off, size = struct.unpack_from("<QQ", b, o + 24)
    ent = struct.unpack_from("<Q", b, o + 56)[0]
    sections.append((name, typ, off, size, ent))
ss = sections[shstrndx]
shstr = bytes(b[ss[2]:ss[2] + ss[3]])
named = []
for sec in sections:
    e = shstr.find(b"\0", sec[0])
    named.append((shstr[sec[0]:e].decode("ascii", "replace"), *sec[1:]))
symsec = next(x for x in named if x[0] == ".dynsym")
symbols = []
for o in range(symsec[2], symsec[2] + symsec[3], symsec[4]):
    val, _ = struct.unpack_from("<QQ", b, o + 8)
    symbols.append(val)
dynamic = None
for i in range(phnum):
    o = phoff + i * phents
    if U32(o) == 2:
        dynamic = (struct.unpack_from("<Q", b, o + 8)[0], struct.unpack_from("<Q", b, o + 32)[0])
        break
assert dynamic
stags = {}
for o in range(dynamic[0], dynamic[0] + dynamic[1], 16):
    tag = struct.unpack_from("<q", b, o)[0]
    val = U64(o + 8)
    if tag == 0: break
    stags[tag] = val
for o in range(vaoff(stags[7]), vaoff(stags[7]) + stags[8], 24):
    ro, ri, addend = struct.unpack_from("<QQq", b, o)
    typ, sym = ri & 0xffffffff, ri >> 32
    if typ == 1027:
        val = addend & 0xffffffffffffffff
    elif typ == 257 and sym < len(symbols):
        val = (symbols[sym] + addend) & 0xffffffffffffffff
    else:
        continue
    try: struct.pack_into("<Q", b, vaoff(ro), val)
    except ValueError: pass

execs = [(va, va + memsz) for flags, _, va, _, memsz in loads if flags & 1]
data = [(off, va, filesz) for flags, off, va, filesz, memsz in loads if flags & 2]
candidates = []
for off, va, filesz in data:
    end = min(off + filesz, len(b))
    for pos in range(off, end - 32, 8):
        if U64(pos) != type_count or U64(pos + 16) != type_count:
            continue
        ptr = U64(pos + 24)
        try:
            sample = [U64(vaoff(ptr + j * 8)) for j in range(type_count)]
        except Exception:
            continue
        if all(x == 0 or any(a <= x < z for a, z in execs) for x in sample):
            candidates.append((va + pos - off - 80, pos, ptr))
assert len(candidates) == 1, f"expected unique metadata registration, got {len(candidates)}"
base, _, _ = candidates[0]
q = [U64(vaoff(base + i * 8)) for i in range(16)]
types_count, types_ptr = q[6], q[7]
assert types_count > 13689

for index, expected in [(13687, "__StaticArrayInitTypeSize=12"), (13689, "__StaticArrayInitTypeSize=32")]:
    il2cpp_type = U64(vaoff(types_ptr + index * 8))
    typedef_index = U64(vaoff(il2cpp_type))
    td = type_defs_off + typedef_index * 88
    name_index = struct.unpack_from("<I", m, td)[0]
    name = string(name_index)
    assert name == expected, (index, typedef_index, name, expected)
    print(f"Il2CppType[{index}] -> TypeDef[{typedef_index}] {name} PASS")
print("PASS: static array type sizes match 12 bytes (3 Int32) and 32 bytes (8 Int32)")
