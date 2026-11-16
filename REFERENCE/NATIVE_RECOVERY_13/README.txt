NATIVE RECOVERY 13 - DIFFICULTY INITIALIZER PROOF
=================================================

Purpose
-------
Small, focused evidence for the recovered Easy / Normal / Hard levelSizes
arrays. This folder is intentionally separate from the large v12 disassembly.

Read
----
1. 01_INITIALIZER_SLOTS.txt
2. 02_RUNTIME_TOKEN_RESOLVER.txt
3. 03_FIELD_REFERENCE_MAP.csv
4. 04_GENERATOR_CORE.txt and 04_GENERATOR_CORE_DISASSEMBLY.txt
5. 05_RANDOM_RANGE_METHOD_MAP.txt
6. ../CORE/10_DIFFICULTY_ARRAYS_RECOVERED.md
7. ../CORE/12_HASH_PROOF.md

Re-run checks (run from this directory)
----------------------------------------
python verify_static_token_slots.py /path/to/libil2cpp.so
python verify_fieldref_rows.py /path/to/global-metadata.dat
python verify_sha256_arrays.py
python verify_field_type_sizes.py /path/to/libil2cpp.so /path/to/global-metadata.dat

Input pair SHA-256
-----------------
libil2cpp.so:
4eebd81e9a28b556faf0ccaa2b70e7402b137e9e669284c70eb1b0d24466ee9f

global-metadata.dat:
8c254808d083face6b981a6b3a0ae0886730f7a766a79dc672c12b6eb4cc9afd

No playable source is modified by these research files.
