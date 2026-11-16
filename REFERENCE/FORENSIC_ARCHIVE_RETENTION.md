# Forensic archive retention

The compact v43 handoff intentionally omits the original APK-extracted Unity/
IL2CPP binary payloads and complete raw disassembly listings to avoid carrying
large, rarely needed files in every development handoff.

The untouched `PrasannaOne_Nonogram_COMPLETE_v42.zip` remains the full forensic
archive. It contains the original `assets/bin/Data/` tree, `libil2cpp.so`,
`global-metadata.dat`, `PHONE_DEEP_DUMP.zip`, and full native disassemblies.
Use that archive only if a future question genuinely requires binary-level
re-verification. The compact CORE notes and NATIVE_RECOVERY_13 artifacts are
the normal reference set.

No files have been removed from v42; v43 is a separate compact derivative.
