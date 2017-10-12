
let wasm = 'wasm_demo-b9dd1cf10ee92da1'

var Module = {
    wasmBinaryFile: `http://127.0.0.1:3017/${wasm}.wasm`,
    onRuntimeInitialized: main,
};
function main() {
    let get_data = Module.cwrap('get_data', 'string', []);
    console.log(get_data());
}
