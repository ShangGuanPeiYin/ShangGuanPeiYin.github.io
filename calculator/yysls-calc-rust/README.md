# YYSLS calculator next

Source-controlled Rust replacement for `yysls_calc.wasm`, split into two independently deployable modules:

- `yysls_panel.wasm`: equipment/configuration to final panel;
- `yysls_excel.wasm`: final panel and class inputs to damage, ADPS, RDPS, and graduation ratios.

`generated_legacy_semantics.rs` was mechanically recovered from the frozen baseline
WASM and preserves its instruction order and constants. The handwritten wrapper in
`lib.rs` exposes the compatible ABI. Do not hand-edit the generated file. The parity
test reads the retired baseline directly from Git commit `86a4e23`, so the old WASM
is not shipped with the site.

Build and verify:

```bash
./scripts/build.sh
node tests/wasm-parity.mjs
```
