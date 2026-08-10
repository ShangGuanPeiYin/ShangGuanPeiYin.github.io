# YYSLS calculator next

Source-controlled Rust replacement for `yysls_calc.wasm`.

`generated_legacy_semantics.rs` is mechanically recovered from the frozen baseline
WASM and preserves its instruction order and constants. The handwritten wrapper in
`lib.rs` exposes the legacy ABI. Do not hand-edit the generated file; regenerate it
with `scripts/regenerate.sh` and verify bit parity before accepting any change.

Build and verify:

```bash
./scripts/build.sh
node tests/wasm-parity.mjs
```

