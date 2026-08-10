use std::slice;

#[cfg(feature = "class")]
mod excel_engine;

#[cfg(feature = "diy")]
mod panel_v2;

#[cfg(all(feature = "diy", feature = "class"))]
compile_error!("build exactly one calculator module at a time");
#[cfg(not(any(feature = "diy", feature = "class")))]
compile_error!("enable either the diy or class feature");

#[unsafe(no_mangle)]
pub extern "C" fn yysls_alloc_f64(len: usize) -> *mut f64 {
    Box::into_raw(vec![0.0_f64; len].into_boxed_slice()).cast::<f64>()
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn yysls_free_f64(ptr: *mut f64, len: usize) {
    if !ptr.is_null() {
        let raw = std::ptr::slice_from_raw_parts_mut(ptr, len);
        drop(unsafe { Box::from_raw(raw) });
    }
}

#[unsafe(no_mangle)]
#[cfg(feature = "class")]
pub extern "C" fn yysls_class_input_len() -> i32 {
    excel_engine::INPUT_LEN as i32
}

#[unsafe(no_mangle)]
#[cfg(feature = "class")]
pub extern "C" fn yysls_class_output_len() -> i32 {
    excel_engine::OUTPUT_LEN as i32
}

#[unsafe(no_mangle)]
#[cfg(feature = "diy")]
pub extern "C" fn yysls_diy_input_len() -> i32 {
    panel_v2::INPUT_LEN as i32
}

#[unsafe(no_mangle)]
#[cfg(feature = "diy")]
pub extern "C" fn yysls_panel_len() -> i32 {
    panel_v2::OUTPUT_LEN as i32
}

#[unsafe(no_mangle)]
#[cfg(feature = "diy")]
pub unsafe extern "C" fn yysls_calc_diy(input: *const f64, output: *mut f64) {
    let input = unsafe { slice::from_raw_parts(input, panel_v2::INPUT_LEN) };
    let output = unsafe { slice::from_raw_parts_mut(output, panel_v2::OUTPUT_LEN) };
    panel_v2::calculate(input, output);
}

#[unsafe(no_mangle)]
#[cfg(feature = "class")]
pub unsafe extern "C" fn yysls_calc_class(flow_id: i32, input: *const f64) -> f64 {
    let input = unsafe { slice::from_raw_parts(input, excel_engine::INPUT_LEN) };
    let mut output = [0.0; 5];
    excel_engine::calculate(flow_id, input, &mut output);
    output[0]
}

#[unsafe(no_mangle)]
#[cfg(feature = "class")]
pub unsafe extern "C" fn yysls_calc_class_outputs(
    flow_id: i32,
    input: *const f64,
    output: *mut f64,
) {
    let input = unsafe { slice::from_raw_parts(input, excel_engine::INPUT_LEN) };
    let output = unsafe { slice::from_raw_parts_mut(output, excel_engine::OUTPUT_LEN) };
    excel_engine::calculate(flow_id, input, output);
}
