# YYSLS calculator next

Source-controlled Rust replacement for `yysls_calc.wasm`, split into two independently deployable modules:

- `yysls_panel.wasm`: equipment/configuration to final panel;
- `yysls_excel.wasm`: final panel and class inputs to damage, ADPS, RDPS, and graduation ratios.

`generated_legacy_semantics.rs` was mechanically recovered from the frozen baseline
WASM and preserves its instruction order and constants. The handwritten wrapper in
`lib.rs` exposes the compatible ABI. Do not hand-edit the generated file. The parity
test reads the retired baseline directly from Git commit `86a4e23`, so the old WASM
is not shipped with the site.

Module boundaries:

| Module | Feature | Input | Output |
| --- | --- | --- | --- |
| `yysls_panel.wasm` | `diy` | 184 `f64` configuration/equipment fields | 36 `f64` final-panel fields |
| `yysls_excel.wasm` | `class` | flow ID plus 40 `f64` class fields | total damage, ADPS, graduation ratio, RDPS, RDPS graduation ratio |

The modules have separate WebAssembly memories. `excel-runtime.js` copies the panel
result into its JavaScript object model, builds the class input, and then writes that
input into the Excel module. Updating Excel formulas normally requires rebuilding and
deploying only `yysls_excel.wasm`, unless the shared field/string contract also changes.

Build and verify:

```bash
./scripts/build.sh
node tests/wasm-parity.mjs
```

`scripts/build.sh` intentionally builds each feature separately. Enabling both or
neither feature is a compile error, preventing accidental recreation of a combined
production module.
