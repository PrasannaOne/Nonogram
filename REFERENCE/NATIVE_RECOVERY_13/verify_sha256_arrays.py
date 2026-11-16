#!/usr/bin/env python3
"""Verify recovered PrivateImplementationDetails Int32-array hashes.

The field-name digests are read from the metadata evidence table in CORE/12.
This script independently searches ordered Int32 triples in 1..30 and checks
that the excluded Mixed 8-int cross-check hashes correctly.
"""
import hashlib
import itertools
import struct

TARGETS = {
    "Easy": "2e4c4603cb0dea8636f8e802bfa0f24caef5f9943377f91d89fd6fbd9577cd1c",
    "Hard": "a56d6bbbe254a23749343fb727e7f348b719bc6314763d6a792843e2f7c466ee",
    "Normal (original Medium)": "bcbc01a5036673e493422616677a83718edfe475d3e938b1a879903ffb2a05a0",
}
found = {name: [] for name in TARGETS}
for values in itertools.product(range(1, 31), repeat=3):
    digest = hashlib.sha256(struct.pack("<3i", *values)).hexdigest()
    for name, target in TARGETS.items():
        if digest == target:
            found[name].append(values)

expected = {
    "Easy": (5, 6, 7),
    "Normal (original Medium)": (7, 8, 9),
    "Hard": (10, 11, 12),
}
for name, values in expected.items():
    matches = found[name]
    assert matches == [values], f"{name}: expected one {values} match, got {matches}"
    raw = struct.pack("<3i", *values)
    print(f"{name}: {values} | bytes={raw.hex()} | sha256={hashlib.sha256(raw).hexdigest()} | UNIQUE")

mixed = (5, 6, 7, 8, 9, 10, 11, 12)
mixed_hash = "6da17e477bd491ee17f20b42cc7669458bc3d798dd5e41a42c06c23df1179348"
mixed_raw = struct.pack("<8i", *mixed)
assert hashlib.sha256(mixed_raw).hexdigest() == mixed_hash
print(f"Mixed (excluded cross-check): {mixed} | bytes={mixed_raw.hex()} | sha256={mixed_hash} | MATCH")
print("PASS: all recovered field-name hashes verified")
