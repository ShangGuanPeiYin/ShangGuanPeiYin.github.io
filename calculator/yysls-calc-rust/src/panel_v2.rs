mod generated {
    include!("panel_v2_generated.rs");
}

use generated::{attr_index, arsenal_attrs, bow_attrs, martials, mind_attrs, set_attrs, Attr, ATTR_COUNT, BASE_ATTRS};

pub const INPUT_LEN: usize = 202;
pub const OUTPUT_LEN: usize = 36;
const LEGACY_LEN: usize = 184;
const SLOT_COUNT: usize = 8;
const SLOT_COLUMNS: [usize; SLOT_COUNT] = [0, 1, 2, 3, 4, 5, 6, 7];

fn add(values: &mut [f64; ATTR_COUNT], attr: Attr, value: f64) {
    let index = attr_index(attr);
    values[index] = round_decimal(values[index] + value, 4);
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
    let mapping = [
        (3, Attr::Jin), (4, Attr::Min), (5, Attr::Shi),
        (6, Attr::MinExternalAttack), (7, Attr::MaxExternalAttack),
        (8, Attr::AccuracyRate), (9, Attr::CriticalRate), (10, Attr::InsightRate),
        (11, Attr::MinMingjinAttack), (12, Attr::MaxMingjinAttack),
        (13, Attr::MinLieshiAttack), (14, Attr::MaxLieshiAttack),
        (15, Attr::MinQiansiAttack), (16, Attr::MaxQiansiAttack),
        (17, Attr::MinPozhuAttack), (18, Attr::MaxPozhuAttack),
        (19, Attr::MinWuxiangAttack), (20, Attr::MaxWuxiangAttack),
        (21, Attr::WeaponDamage), (22, Attr::SingleqsDamage),
        (23, Attr::BossDamage), (24, Attr::WuxueDamage),
    ];
    for column in SLOT_COLUMNS {
        for &(row, attr) in &mapping {
            let mut value = input_cell(input, column, row);
            if matches!(attr, Attr::AccuracyRate | Attr::CriticalRate | Attr::InsightRate | Attr::WeaponDamage | Attr::SingleqsDamage | Attr::BossDamage | Attr::WuxueDamage) {
                value *= 100.0;
            }
            add(values, attr, value);
        }
    }
}

fn round_decimal(value: f64, digits: u32) -> f64 {
    let factor = 10_f64.powi(digits as i32);
    (value * factor).round() / factor
}

fn round_to_8(value: f64) -> f64 {
    ((value + f64::EPSILON) * 100_000_000.0).round() / 100_000_000.0
}

fn apply_equipment_benefit_resistance(values: &mut [f64; ATTR_COUNT], equipment: &[f64; ATTR_COUNT]) {
    let resistance = get(values, Attr::BenefitResistance);
    if resistance <= 0.0 { return; }
    for attr in [Attr::WeaponDamage, Attr::WuxueDamage, Attr::BossDamage, Attr::SingleqsDamage, Attr::ExternalPenetration, Attr::WuxiangPenetration] {
        let index = attr_index(attr);
        let equipment_value = equipment[index];
        if equipment_value != 0.0 {
            values[index] = round_to_8(values[index] - equipment_value + equipment_value / resistance);
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
    values[attr_index(Attr::MinExternalAttack)] += min * 0.9 + jin * 0.22;
    values[attr_index(Attr::MaxExternalAttack)] += shi * 0.9 + jin * 1.36;
    values[attr_index(Attr::CriticalRate)] += min * 0.076;
    values[attr_index(Attr::InsightRate)] += shi * 0.038;
}

fn apply_talents(values: &mut [f64; ATTR_COUNT], class_id: i32) {
    for martial in martials(class_id) {
        for &(require_attr, required, reward_attr, reward) in martial.talents {
            let current = round_decimal(get(values, require_attr), 4);
            let ratio = if required > 0.0 { round_decimal(current / required, 12).clamp(0.0, 1.0) } else { 0.0 };
            add(values, reward_attr, round_decimal(reward * ratio, 4));
        }
    }
}

fn output(values: &[f64; ATTR_COUNT], out: &mut [f64]) {
    let resistance = get(values, Attr::LevelResistance);
    let accuracy = round_decimal(65.0 + (round_decimal(get(values, Attr::AccuracyRate), 4) - 65.0).max(0.0) / resistance, 4);
    let rate = |attr| round_decimal(round_decimal(get(values, attr), 4) / resistance, 4) / 100.0;
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
    let mut equipment = [0.0; ATTR_COUNT];
    add_all(&mut values, BASE_ATTRS);
    let class_id = input.get(95).copied().unwrap_or(0.0) as i32; // f14
    for martial in martials(class_id) { add_all(&mut values, martial.attrs); }
    for index in [10usize, 19, 28, 37] { add_all(&mut values, mind_attrs(input.get(index).copied().unwrap_or(0.0) as i32)); }
    add_all(&mut values, set_attrs(input.get(1).copied().unwrap_or(0.0) as i32));
    add_all(&mut values, bow_attrs(input.first().copied().unwrap_or(0.0) as i32));
    let common_armory = input.get(54).copied().unwrap_or(0.0) as i32 == 728;
    add_all(&mut values, arsenal_attrs(common_armory, class_id));
    add_fixed_equipment(&mut equipment, input);
    add_equipment_tunings(&mut equipment, input);
    for index in 0..ATTR_COUNT { values[index] = round_decimal(values[index] + equipment[index], 4); }
    apply_talents(&mut values, class_id);
    apply_equipment_benefit_resistance(&mut values, &equipment);
    derive_primary(&mut values);
    output(&values, out);
}
