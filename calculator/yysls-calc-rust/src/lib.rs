use std::slice;

mod panel_v2;

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
pub extern "C" fn yysls_diy_input_len() -> i32 {
    panel_v2::INPUT_LEN as i32
}

#[unsafe(no_mangle)]
pub extern "C" fn yysls_panel_len() -> i32 {
    panel_v2::OUTPUT_LEN as i32
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn yysls_calc_diy(input: *const f64, output: *mut f64) {
    let input = unsafe { slice::from_raw_parts(input, panel_v2::INPUT_LEN) };
    let output = unsafe { slice::from_raw_parts_mut(output, panel_v2::OUTPUT_LEN) };
    panel_v2::calculate(input, output);
}
