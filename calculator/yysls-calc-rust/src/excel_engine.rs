use std::convert::TryInto;

pub const INPUT_LEN: usize = 40;
pub const OUTPUT_LEN: usize = 5;
const NONE: u32 = u32::MAX;
const SECTION_HEADER: usize = 44;
const DATA: &[u8] = include_bytes!("generated_excel_data.bin");

fn u32_at(data: &[u8], offset: usize) -> u32 {
    u32::from_le_bytes(data[offset..offset + 4].try_into().unwrap())
}

fn f64_at(data: &[u8], offset: usize) -> f64 {
    f64::from_le_bytes(data[offset..offset + 8].try_into().unwrap())
}

struct Engine {
    section: &'static [u8],
    code_start: usize,
    cell_count: usize,
    lookup_start: usize,
    lookup_rows: usize,
    gain_start: usize,
    gain_rows: usize,
    cache: Vec<f64>,
    state: Vec<u8>,
}

impl Engine {
    fn new(flow_id: usize, input: &[f64]) -> Option<Self> {
        if &DATA[0..4] != b"YEXL" || u32_at(DATA, 4) != 1 {
            return None;
        }
        let count = u32_at(DATA, 8) as usize;
        if flow_id >= count {
            return None;
        }
        let start = u32_at(DATA, 12 + flow_id * 4) as usize;
        let end = if flow_id + 1 < count {
            u32_at(DATA, 12 + (flow_id + 1) * 4) as usize
        } else {
            DATA.len()
        };
        let section = &DATA[start..end];
        let cell_count = u32_at(section, 0) as usize;
        let code_len = u32_at(section, 4) as usize;
        let lookup_rows = u32_at(section, 12) as usize;
        let gain_rows = u32_at(section, 16) as usize;
        let records_start = SECTION_HEADER + INPUT_LEN * 4;
        let lookup_start = records_start + cell_count * 8;
        let gain_start = lookup_start + lookup_rows * (8 + 31 * 4);
        let code_start = section.len() - code_len;
        let mut engine = Self {
            section,
            code_start,
            cell_count,
            lookup_start,
            lookup_rows,
            gain_start,
            gain_rows,
            cache: vec![0.0; cell_count],
            state: vec![0; cell_count],
        };
        for index in 0..INPUT_LEN.min(input.len()) {
            let cell_id = u32_at(section, SECTION_HEADER + index * 4);
            if cell_id != NONE && (cell_id as usize) < cell_count {
                engine.cache[cell_id as usize] = input[index];
                engine.state[cell_id as usize] = 2;
            }
        }
        Some(engine)
    }

    fn cell(&mut self, id: usize) -> f64 {
        if id >= self.cell_count {
            return 0.0;
        }
        if self.state[id] == 2 {
            return self.cache[id];
        }
        if self.state[id] == 1 {
            return f64::NAN;
        }
        self.state[id] = 1;
        let records_start = SECTION_HEADER + INPUT_LEN * 4;
        let offset = u32_at(self.section, records_start + id * 8) as usize;
        let length = u32_at(self.section, records_start + id * 8 + 4) as usize;
        let value = self.eval(offset, length);
        self.cache[id] = value;
        self.state[id] = 2;
        value
    }

    fn pop2(stack: &mut Vec<f64>) -> (f64, f64) {
        let right = stack.pop().unwrap_or(0.0);
        let left = stack.pop().unwrap_or(0.0);
        (left, right)
    }

    fn eval(&mut self, offset: usize, length: usize) -> f64 {
        let mut pc = self.code_start + offset;
        let end = pc + length;
        let mut stack = Vec::with_capacity(32);
        while pc < end {
            let opcode = self.section[pc];
            pc += 1;
            match opcode {
                0 => {
                    stack.push(f64_at(self.section, pc));
                    pc += 8;
                }
                1 => {
                    let id = u32_at(self.section, pc) as usize;
                    pc += 4;
                    stack.push(self.cell(id));
                }
                2..=11 => {
                    let (a, b) = Self::pop2(&mut stack);
                    stack.push(match opcode {
                        2 => a + b,
                        3 => a - b,
                        4 => a * b,
                        5 => a / b,
                        6 => (a == b) as u8 as f64,
                        7 => (a != b) as u8 as f64,
                        8 => (a < b) as u8 as f64,
                        9 => (a > b) as u8 as f64,
                        10 => (a <= b) as u8 as f64,
                        11 => (a >= b) as u8 as f64,
                        _ => 0.0,
                    });
                }
                12 => {
                    let false_value = stack.pop().unwrap_or(0.0);
                    let true_value = stack.pop().unwrap_or(0.0);
                    let condition = stack.pop().unwrap_or(0.0);
                    stack.push(if condition != 0.0 { true_value } else { false_value });
                }
                13..=15 => {
                    let (a, b) = Self::pop2(&mut stack);
                    stack.push(match opcode {
                        13 => ((a != 0.0) || (b != 0.0)) as u8 as f64,
                        14 => a.min(b),
                        15 => a.max(b),
                        _ => 0.0,
                    });
                }
                16 => {
                    let col = self.section[pc] as usize;
                    pc += 1;
                    let key = stack.pop().unwrap_or(0.0);
                    stack.push(self.vlookup(key, col));
                }
                17 => {
                    let count = u16::from_le_bytes(self.section[pc..pc + 2].try_into().unwrap()) as usize;
                    pc += 2;
                    let key = stack.pop().unwrap_or(0.0);
                    let mut found = 0.0;
                    for _ in 0..count {
                        let key_id = u32_at(self.section, pc);
                        let value_id = u32_at(self.section, pc + 4);
                        pc += 8;
                        if key_id != NONE && self.cell(key_id as usize) == key {
                            found = if value_id == NONE { 0.0 } else { self.cell(value_id as usize) };
                        }
                    }
                    stack.push(found);
                }
                18 => {
                    let col = self.section[pc] as usize;
                    pc += 1;
                    let default = stack.pop().unwrap_or(0.0);
                    let key = stack.pop().unwrap_or(0.0);
                    stack.push(self.xlookup_gain(key, col, default));
                }
                _ => return f64::NAN,
            }
        }
        stack.pop().unwrap_or(0.0)
    }

    fn vlookup(&mut self, key: f64, col: usize) -> f64 {
        if !(1..=31).contains(&col) {
            return 0.0;
        }
        let row_size = 8 + 31 * 4;
        for row in 0..self.lookup_rows {
            let base = self.lookup_start + row * row_size;
            if f64_at(self.section, base) == key {
                let id = u32_at(self.section, base + 8 + (col - 1) * 4);
                return if id == NONE { 0.0 } else { self.cell(id as usize) };
            }
        }
        0.0
    }

    fn xlookup_gain(&mut self, key: f64, col: usize, default: f64) -> f64 {
        if !(1..=23).contains(&col) {
            return default;
        }
        let row_size = 8 + 23 * 4;
        for row in 0..self.gain_rows {
            let base = self.gain_start + row * row_size;
            if f64_at(self.section, base) == key {
                let id = u32_at(self.section, base + 8 + (col - 1) * 4);
                return if id == NONE { 0.0 } else { self.cell(id as usize) };
            }
        }
        default
    }
}

pub fn calculate(flow_id: i32, input: &[f64], output: &mut [f64]) {
    output.fill(0.0);
    let Some(mut engine) = Engine::new(flow_id.max(0) as usize, input) else {
        return;
    };
    let outputs = [
        u32_at(engine.section, 20) as usize,
        u32_at(engine.section, 24) as usize,
        u32_at(engine.section, 28) as usize,
        u32_at(engine.section, 32) as usize,
    ];
    let rdps_baseline = f64_at(engine.section, 36);
    output[0] = engine.cell(outputs[0]);
    output[1] = engine.cell(outputs[1]);
    output[2] = engine.cell(outputs[2]);
    output[3] = engine.cell(outputs[3]);
    output[4] = output[3] / rdps_baseline;
}
