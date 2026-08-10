mod generated {
    include!("panel_v2_generated.rs");
}

use generated::{attr_index, arsenal_attrs, bow_attrs, martials, mind_attrs, set_attrs, set_key, Attr, ATTR_COUNT, BASE_ATTRS};

pub const INPUT_LEN: usize = 202;
pub const OUTPUT_LEN: usize = 36;
const LEGACY_LEN: usize = 184;
const SLOT_COUNT: usize = 8;
const SLOT_COLUMNS: [usize; SLOT_COUNT] = [0, 1, 2, 3, 4, 5, 6, 7];

fn add(values: &mut [f64; ATTR_COUNT], attr: Attr, value: f64) {
    values[attr_index(attr)] += value;
}

fn get(values: &[f64; ATTR_COUNT], attr: Attr) -> f64 {
    values[attr_index(attr)]
}

fn add_all(values: &mut [f64; ATTR_COUNT], attrs: &[(Attr, f64)]) {
    for &(attr, value) in attrs { add(values, attr, value); }
}

fn input_cell(input: &[f64], column: usize, row: usize) -> f64 {
    const ROW_STARTS: [usize; 22] = [2, 11, 20, 29, 38, 46, 55, 63, 71, 79, 87, 96, 104, 112, 120, 128, 136, 144, 152, 160, 168, 176];
    let index = ROW_STARTS[row - 3] + column;
    input.get(index).copied().unwrap_or(0.0)
}

fn add_equipment_tunings(values: &mut [f64; ATTR_COUNT], input: &[f64]) {
    let benefit = get(values, Attr::BenefitResistance);
    let mapping = [
        (3, Attr::Jin, false), (4, Attr::Min, false), (5, Attr::Shi, false),
        (6, Attr::MinExternalAttack, false), (7, Attr::MaxExternalAttack, false),
        (8, Attr::AccuracyRate, false), (9, Attr::CriticalRate, false), (10, Attr::InsightRate, false),
        (11, Attr::MinMingjinAttack, false), (12, Attr::MaxMingjinAttack, false),
        (13, Attr::MinLieshiAttack, false), (14, Attr::MaxLieshiAttack, false),
        (15, Attr::MinQiansiAttack, false), (16, Attr::MaxQiansiAttack, false),
        (17, Attr::MinPozhuAttack, false), (18, Attr::MaxPozhuAttack, false),
        (19, Attr::MinWuxiangAttack, false), (20, Attr::MaxWuxiangAttack, false),
        (21, Attr::WeaponDamage, true), (22, Attr::SingleqsDamage, true),
        (23, Attr::BossDamage, true), (24, Attr::WuxueDamage, true),
    ];
    for column in SLOT_COLUMNS {
        for &(row, attr, resisted) in &mapping {
            let mut value = input_cell(input, column, row);
            if matches!(attr, Attr::AccuracyRate | Attr::CriticalRate | Attr::InsightRate | Attr::WeaponDamage | Attr::SingleqsDamage | Attr::BossDamage | Attr::WuxueDamage) {
                value *= 100.0;
            }
            if resisted && benefit > 0.0 { value /= benefit; }
            add(values, attr, value);
        }
    }
}

fn add_fixed_equipment(values: &mut [f64; ATTR_COUNT], input: &[f64]) {
    for slot in 0..SLOT_COUNT {
        if input.get(LEGACY_LEN + slot).copied().unwrap_or(0.0) <= 0.0 { continue; }
        let purple = input.get(LEGACY_LEN + SLOT_COUNT + slot).copied().unwrap_or(0.0) > 0.0;
        match slot {
            0 | 1 => {
                add(values, Attr::MinExternalAttack, if purple { 90.0 } else { 100.0 });
                add(values, Attr::MaxExternalAttack, if purple { 209.0 } else { 232.0 });
            }
            2 => add(values, Attr::MinExternalAttack, if purple { 120.0 } else { 133.0 }),
            3 => add(values, Attr::MaxExternalAttack, if purple { 179.0 } else { 199.0 }),
            _ => {}
        }
    }
}

fn derive_primary(values: &mut [f64; ATTR_COUNT]) {
    let min = get(values, Attr::Min);
    let shi = get(values, Attr::Shi);
    let jin = get(values, Attr::Jin);
    add(values, Attr::MinExternalAttack, min * 0.9 + jin * 0.22);
    add(values, Attr::MaxExternalAttack, shi * 0.9 + jin * 1.36);
    add(values, Attr::CriticalRate, min * 0.076);
    add(values, Attr::InsightRate, shi * 0.038);
}

fn apply_talents(values: &mut [f64; ATTR_COUNT], class_id: i32) {
    for martial in martials(class_id) {
        for &(require_attr, required, reward_attr, reward) in martial.talents {
            let ratio = if required > 0.0 { (get(values, require_attr) / required).clamp(0.0, 1.0) } else { 0.0 };
            add(values, reward_attr, reward * ratio);
        }
    }
}

fn output(values: &[f64; ATTR_COUNT], out: &mut [f64]) {
    let resistance = get(values, Attr::LevelResistance);
    let accuracy = 65.0 + (get(values, Attr::AccuracyRate) - 65.0).max(0.0) / resistance;
    let rate = |attr| get(values, attr) / resistance / 100.0;
    let percent = |attr| get(values, attr) / 100.0;
    let rows = [
        get(values, Attr::MinExternalAttack), get(values, Attr::MaxExternalAttack), accuracy / 100.0,
        rate(Attr::CriticalRate), percent(Attr::DirectCriticalRate), percent(Attr::CriticalDamage),
        rate(Attr::InsightRate), percent(Attr::DirectInsightRate), percent(Attr::InsightDamage),
        get(values, Attr::MinMingjinAttack), get(values, Attr::MaxMingjinAttack),
        get(values, Attr::MinLieshiAttack), get(values, Attr::MaxLieshiAttack),
        get(values, Attr::MinQiansiAttack), get(values, Attr::MaxQiansiAttack),
        get(values, Attr::MinPozhuAttack), get(values, Attr::MaxPozhuAttack),
        get(values, Attr::MinWuxiangAttack), get(values, Attr::MaxWuxiangAttack),
        0.0, 0.0, 0.0,
        get(values, Attr::ExternalPenetration), percent(Attr::ExternalDamage),
        get(values, Attr::MingjinPenetration), percent(Attr::MingjinDamage),
        get(values, Attr::LieshiPenetration), percent(Attr::LieshiDamage),
        get(values, Attr::QiansiPenetration), percent(Attr::QiansiDamage),
        get(values, Attr::PozhuPenetration), percent(Attr::PozhuDamage),
        percent(Attr::WeaponDamage), percent(Attr::SingleqsDamage),
        percent(Attr::BossDamage) + percent(Attr::CommonDamage), percent(Attr::WuxueDamage),
    ];
    out[..OUTPUT_LEN].copy_from_slice(&rows);
}

pub fn calculate(input: &[f64], out: &mut [f64]) {
    let mut values = [0.0; ATTR_COUNT];
    add_all(&mut values, BASE_ATTRS);
    let class_id = input.get(95).copied().unwrap_or(0.0) as i32; // f14
    for martial in martials(class_id) { add_all(&mut values, martial.attrs); }
    for index in [10usize, 19, 28, 37] { add_all(&mut values, mind_attrs(input.get(index).copied().unwrap_or(0.0) as i32)); }
    add_all(&mut values, set_attrs(input.get(1).copied().unwrap_or(0.0) as i32));
    add_all(&mut values, bow_attrs(input.first().copied().unwrap_or(0.0) as i32));
    let common_armory = input.get(54).copied().unwrap_or(0.0) as i32 == 728;
    add_all(&mut values, arsenal_attrs(common_armory, class_id));
    add_fixed_equipment(&mut values, input);
    add_equipment_tunings(&mut values, input);
    derive_primary(&mut values);
    apply_talents(&mut values, class_id);
    match set_key(input.get(1).copied().unwrap_or(0.0) as i32) {
        "SET_WEAPON_FEISUN" => {
            values[attr_index(Attr::MinExternalAttack)] *= 1.1;
            values[attr_index(Attr::MaxExternalAttack)] *= 1.1;
        }
        "SET_WEAPON_HANTIAN" => {
            for attr in [Attr::MinExternalAttack, Attr::MaxExternalAttack, Attr::MinWuxiangAttack, Attr::MaxWuxiangAttack,
                Attr::MinMingjinAttack, Attr::MaxMingjinAttack, Attr::MinLieshiAttack, Attr::MaxLieshiAttack,
                Attr::MinQiansiAttack, Attr::MaxQiansiAttack, Attr::MinPozhuAttack, Attr::MaxPozhuAttack] {
                values[attr_index(attr)] *= 1.06;
            }
        }
        _ => {}
    }
    output(&values, out);
}
