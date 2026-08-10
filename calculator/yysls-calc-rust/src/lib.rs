use std::cell::UnsafeCell;
use std::slice;

include!("generated_legacy_semantics.rs");

#[cfg(all(feature = "diy", feature = "class"))]
compile_error!("build exactly one calculator module at a time");
#[cfg(not(any(feature = "diy", feature = "class")))]
compile_error!("enable either the diy or class feature");

struct Runtime {
    engine: Instance,
    #[cfg(feature = "diy")]
    diy_input: i32,
    #[cfg(feature = "diy")]
    diy_output: i32,
    #[cfg(feature = "class")]
    class_input: i32,
    #[cfg(feature = "class")]
    class_output: i32,
}

impl Runtime {
    fn new() -> Self {
        let mut engine = Instance::new();
        #[cfg(feature = "diy")]
        let diy_input_len = engine.func18();
        #[cfg(feature = "diy")]
        let diy_output_len = engine.func20();
        #[cfg(feature = "class")]
        let class_input_len = engine.func16();
        #[cfg(feature = "class")]
        let class_output_len = engine.func17();
        #[cfg(feature = "diy")]
        let diy_input = engine.func12(diy_input_len);
        #[cfg(feature = "diy")]
        let diy_output = engine.func12(diy_output_len);
        #[cfg(feature = "class")]
        let class_input = engine.func12(class_input_len);
        #[cfg(feature = "class")]
        let class_output = engine.func12(class_output_len);
        Self {
            engine,
            #[cfg(feature = "diy")]
            diy_input,
            #[cfg(feature = "diy")]
            diy_output,
            #[cfg(feature = "class")]
            class_input,
            #[cfg(feature = "class")]
            class_output,
        }
    }
}

struct EngineCell(UnsafeCell<Option<Runtime>>);

unsafe impl Sync for EngineCell {}

static ENGINE: EngineCell = EngineCell(UnsafeCell::new(None));

fn with_runtime<T>(f: impl FnOnce(&mut Runtime) -> T) -> T {
    // The browser runtime invokes this module synchronously on one JS thread.
    let slot = unsafe { &mut *ENGINE.0.get() };
    f(slot.get_or_insert_with(Runtime::new))
}

unsafe fn copy_from_engine(engine: &Instance, source: i32, target: *mut f64, len: usize) {
    let byte_len = len * size_of::<f64>();
    let target = unsafe { slice::from_raw_parts_mut(target.cast::<u8>(), byte_len) };
    target.copy_from_slice(&engine.mem()[source as usize..source as usize + byte_len]);
}

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
    with_runtime(|runtime| runtime.engine.func16())
}

#[unsafe(no_mangle)]
#[cfg(feature = "class")]
pub extern "C" fn yysls_class_output_len() -> i32 {
    with_runtime(|runtime| runtime.engine.func17())
}

#[unsafe(no_mangle)]
#[cfg(feature = "diy")]
pub extern "C" fn yysls_diy_input_len() -> i32 {
    with_runtime(|runtime| runtime.engine.func18())
}

#[unsafe(no_mangle)]
#[cfg(feature = "diy")]
pub extern "C" fn yysls_panel_len() -> i32 {
    with_runtime(|runtime| runtime.engine.func20())
}

#[unsafe(no_mangle)]
#[cfg(feature = "diy")]
pub unsafe extern "C" fn yysls_calc_diy(input: *const f64, output: *mut f64) {
    with_runtime(|runtime| {
        let engine = &mut runtime.engine;
        let input_len = engine.func18() as usize;
        let output_len = engine.func20() as usize;
        let byte_len = input_len * size_of::<f64>();
        let source = unsafe { slice::from_raw_parts(input.cast::<u8>(), byte_len) };
        engine.mem_mut()[runtime.diy_input as usize..runtime.diy_input as usize + byte_len]
            .copy_from_slice(source);
        engine.func15(runtime.diy_input, runtime.diy_output);
        unsafe { copy_from_engine(engine, runtime.diy_output, output, output_len) };
    });
}

#[unsafe(no_mangle)]
#[cfg(feature = "class")]
pub unsafe extern "C" fn yysls_calc_class(flow_id: i32, input: *const f64) -> f64 {
    with_runtime(|runtime| {
        let engine = &mut runtime.engine;
        let input_len = engine.func16() as usize;
        let byte_len = input_len * size_of::<f64>();
        let source = unsafe { slice::from_raw_parts(input.cast::<u8>(), byte_len) };
        engine.mem_mut()[runtime.class_input as usize..runtime.class_input as usize + byte_len]
            .copy_from_slice(source);
        engine.func13(flow_id, runtime.class_input)
    })
}

#[unsafe(no_mangle)]
#[cfg(feature = "class")]
pub unsafe extern "C" fn yysls_calc_class_outputs(
    flow_id: i32,
    input: *const f64,
    output: *mut f64,
) {
    with_runtime(|runtime| {
        let engine = &mut runtime.engine;
        let input_len = engine.func16() as usize;
        let output_len = engine.func17() as usize;
        let byte_len = input_len * size_of::<f64>();
        let source = unsafe { slice::from_raw_parts(input.cast::<u8>(), byte_len) };
        engine.mem_mut()[runtime.class_input as usize..runtime.class_input as usize + byte_len]
            .copy_from_slice(source);
        engine.func14(flow_id, runtime.class_input, runtime.class_output);
        unsafe { copy_from_engine(engine, runtime.class_output, output, output_len) };
    });
}
