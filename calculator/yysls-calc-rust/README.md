# YYSLS calculator next

Source-controlled Rust replacement for `yysls_calc.wasm`, split into two independently deployable modules:

- `yysls_panel.wasm`: equipment/configuration to final panel;
- `yysls_excel.wasm`: final panel and class inputs to damage, ADPS, RDPS, and graduation ratios.

The panel module uses the structured `110_RBDZ_DOWN` data recovered from the local
`yysls-assistant.cn` snapshot. `panel_v2.rs` contains the calculation order and
`panel_v2_generated.rs` contains generated constants. The Excel module is generated
from the 11 current workbooks by `scripts/generate_excel_engine.py`; formulas are
compiled to bytecode and interpreted by `excel_engine.rs`.

Module boundaries:

| Module | Feature | Input | Output |
| --- | --- | --- | --- |
| `yysls_panel.wasm` | `diy` | 202 `f64` configuration/equipment fields | 36 `f64` final-panel fields |
| `yysls_excel.wasm` | `class` | flow ID plus 40 `f64` class fields | total damage, ADPS, graduation ratio, RDPS, RDPS graduation ratio |

The modules have separate WebAssembly memories. `excel-runtime.js` copies the panel
result into its JavaScript object model, builds the class input, and then writes that
input into the Excel module. Updating Excel formulas normally requires rebuilding and
deploying only `yysls_excel.wasm`, unless the shared field/string contract also changes.

Build and verify:

```bash
node scripts/generate_panel_v2.mjs
python3 scripts/generate_excel_engine.py
./scripts/build.sh
node tests/panel-v2.mjs
node tests/wasm-parity.mjs
```

The first 184 panel inputs retain the previous field/string contract. Inputs 184–191
record whether each of the eight slots is equipped, 192–199 record purple quality,
and 200–201 record the two weapon types. These additions are internal to
`excel-runtime.js`; its public API and saved/imported equipment format are unchanged.

`scripts/build.sh` intentionally builds each feature separately. Enabling both or
neither feature is a compile error, preventing accidental recreation of a combined
production module.

There are 10 user-facing PVE classes and 11 internal Excel versions. 牵丝翊 maps to
independent 1.2 and 2.0 formula sections; 2.0 is the default.
