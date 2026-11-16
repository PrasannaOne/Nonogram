#!/usr/bin/env python3
"""Verify relocated static initializer slots and their encoded usage tokens."""
import struct
import sys
from pathlib import Path

blob = bytearray(Path(sys.argv[1]).read_bytes())
assert blob[:6] == b"\x7fELF\x02\x01", "expected little-endian ELF64"
U16 = lambda o: struct.unpack_from("<H", blob, o)[0]
U32 = lambda o: struct.unpack_from("<I", blob, o)[0]
U64 = lambda o: struct.unpack_from("<Q", blob, o)[0]
phoff, = struct.unpack_from("<Q", blob, 32)
phents, phnum = U16(54), U16(56)
loads, dynamic = [], None
for i in range(phnum):
    o = phoff + i * phents
    typ, flags = struct.unpack_from("<II", blob, o)
    off, va, _, filesz, memsz, _ = struct.unpack_from("<QQQQQQ", blob, o + 8)
    if typ == 1:
        loads.append((off, va, filesz, memsz, flags))
    elif typ == 2:
        dynamic = (off, filesz)

def vaoff(va):
    for off, base, filesz, _, _ in loads:
        if base <= va < base + filesz:
            return off + va - base
    raise ValueError(f"unmapped VA {va:#x}")

assert dynamic, "missing PT_DYNAMIC"
tags = {}
for o in range(dynamic[0], dynamic[0] + dynamic[1], 16):
    tag = struct.unpack_from("<q", blob, o)[0]
    val = U64(o + 8)
    if tag == 0:
        break
    tags[tag] = val
assert 7 in tags and 8 in tags, "missing DT_RELA/DT_RELASZ"
shoff, = struct.unpack_from("<Q", blob, 40)
shents, shnum = U16(58), U16(60)
shstrndx = U16(62)
sections = []
for i in range(shnum):
    o = shoff + i * shents
    name, typ = struct.unpack_from("<II", blob, o)
    off, size = struct.unpack_from("<QQ", blob, o + 24)
    link = U32(o + 40)
    ent = struct.unpack_from("<Q", blob, o + 56)[0]
    sections.append((name, typ, off, size, link, ent))
ss = sections[shstrndx]
shstr = bytes(blob[ss[2]:ss[2] + ss[3]])
sections_named = []
for sec in sections:
    nameoff = sec[0]
    end = shstr.find(b"\0", nameoff)
    name = shstr[nameoff:end].decode("ascii", "replace")
    sections_named.append((name, *sec[1:]))
symsec = next(x for x in sections_named if x[0] == ".dynsym")
symbols = []
for o in range(symsec[2], symsec[2] + symsec[3], symsec[5]):
    _, _, _, _ = struct.unpack_from("<IBBH", blob, o)
    value, _ = struct.unpack_from("<QQ", blob, o + 8)
    symbols.append(value)
for o in range(vaoff(tags[7]), vaoff(tags[7]) + tags[8], 24):
    r_offset, r_info, addend = struct.unpack_from("<QQq", blob, o)
    typ, sym = r_info & 0xffffffff, r_info >> 32
    if typ == 1027:
        value = addend & 0xffffffffffffffff
    elif typ == 257 and sym < len(symbols):
        value = (symbols[sym] + addend) & 0xffffffffffffffff
    else:
        continue
    try:
        struct.pack_into("<Q", blob, vaoff(r_offset), value)
    except ValueError:
        pass

expected = {
    "Easy": (0x1aa97a8, 0x1b29170, 0x80000001),
    "Mixed (excluded)": (0x1a91080, 0x1b29178, 0x80000003),
    "Hard": (0x1a94448, 0x1b29180, 0x80000005),
    "Medium / product Normal": (0x1a96d10, 0x1b29188, 0x80000007),
}
for name, (slot, target, token) in expected.items():
    actual_target = U64(vaoff(slot))
    actual_token = U64(vaoff(actual_target))
    assert actual_target == target, (name, hex(actual_target), hex(target))
    assert actual_token == token, (name, hex(actual_token), hex(token))
    kind = (actual_token >> 29) & 7
    index = (actual_token >> 1) & 0x0fffffff
    assert kind == 4
    print(f"{name}: slot={slot:#x} target={target:#x} token={token:#010x} kind={kind} index={index} PASS")
print("PASS: all four relocated initializer handles match")
