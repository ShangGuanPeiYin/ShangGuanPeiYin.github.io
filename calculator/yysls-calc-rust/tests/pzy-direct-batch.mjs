import fs from "node:fs";

const [modulePath, corpusPath] = process.argv.slice(2);
const corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8"));
const wasm = (await WebAssembly.instantiate(fs.readFileSync(modulePath), {})).instance.exports;
if (wasm.yysls_class_input_len() !== 40 || wasm.yysls_class_output_len() !== 5) throw new Error("ABI mismatch");
const inputPtr = wasm.yysls_alloc_f64(40);
const outputPtr = wasm.yysls_alloc_f64(5);
const results = corpus.map(input => {
  new Float64Array(wasm.memory.buffer, inputPtr, 40).set(input);
  wasm.yysls_calc_class_outputs(0, inputPtr, outputPtr);
  return Array.from(new Float64Array(wasm.memory.buffer, outputPtr, 5));
});
process.stdout.write(JSON.stringify(results));
