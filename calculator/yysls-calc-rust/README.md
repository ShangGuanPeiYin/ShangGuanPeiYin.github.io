# YYSLS calculator next

Source-controlled Rust replacement for `yysls_calc.wasm`, split into two independently deployable modules:

- `yysls_panel.wasm`: equipment/configuration to final panel;
- `excel/*.wasm`: 11 direct-compiled modules, one per workbook version, converting final panel and class inputs to damage, ADPS, RDPS, and graduation ratios.

The panel module uses the structured `110_RBDZ_DOWN` data recovered from the local
`yysls-assistant.cn` snapshot. `panel_v2.rs` contains the calculation order and
`panel_v2_generated.rs` contains generated constants. The 11 Excel modules are
generated from the current workbooks by `scripts/generate_excel_engine.py`; only the
five outputs' formula dependencies are retained and compiled to direct Rust code.

Module boundaries:

| Module | Feature | Input | Output |
| --- | --- | --- | --- |
| `yysls_panel.wasm` | `diy` | 202 `f64` configuration/equipment fields | 36 `f64` final-panel fields |
| `excel/*.wasm` | standalone `rustc` build | 40 `f64` class fields | total damage, ADPS, graduation ratio, RDPS, RDPS graduation ratio |

The modules have separate WebAssembly memories. `excel-runtime.js` copies the panel
result into its JavaScript object model, builds the class input, and then writes that
input into the Excel module. Updating Excel formulas normally requires rebuilding and
deploying only the regenerated `excel/*.wasm` modules and metadata, unless the shared field/string contract also changes.

`scripts/generate_excel_engine.py` traces dependencies backwards from the five outputs and emits direct Rust expressions. `scripts/build_excel_modules.sh` compiles and validates the 11 standalone modules. The browser loads the Panel module immediately and lazily loads only the selected Excel module.

Build and verify:

```bash
node scripts/generate_panel_v2.mjs
python3 scripts/generate_excel_engine.py
./scripts/build.sh
./scripts/build_excel_modules.sh
node tests/panel-v2.mjs
node tests/excel-direct-parity.mjs
python3 tests/pzy-workbook-parity.py
```

The first 184 panel inputs retain the previous field/string contract. Inputs 184–191
record whether each of the eight slots is equipped, 192–199 record purple quality,
and 200–201 record the two weapon types. These additions are internal to
`excel-runtime.js`; its public API and saved/imported equipment format are unchanged.

`scripts/build.sh` builds only the Panel module. Excel modules are standalone generated
Rust crates and are built by `scripts/build_excel_modules.sh`, preventing accidental
recreation of a combined production module.

There are 10 user-facing PVE classes and 11 internal Excel versions. 牵丝翊 maps to
independent 1.2 and 2.0 formula sections; 2.0 is the default.
