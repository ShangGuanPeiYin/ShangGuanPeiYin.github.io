// Generated from yysls-assistant.cn 2026-08-09 23:13:35, 110_RBDZ_DOWN.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Attr {
    AccuracyRate,
    AoeqsDamage,
    BenefitResistance,
    BossDamage,
    CommonDamage,
    CriticalDamage,
    CriticalHealDamage,
    CriticalRate,
    DirectCriticalRate,
    DirectInsightRate,
    ExternalDamage,
    ExternalDefence,
    ExternalHealDamage,
    ExternalPenetration,
    FixedDamage,
    FixedDamageRate,
    InsightDamage,
    InsightRate,
    Jin,
    LevelResistance,
    LieshiDamage,
    LieshiPenetration,
    MaxExternalAttack,
    MaxHp,
    MaxLieshiAttack,
    MaxMingjinAttack,
    MaxPozhuAttack,
    MaxQiansiAttack,
    MaxWuxiangAttack,
    Min,
    MingjinDamage,
    MingjinPenetration,
    MinExternalAttack,
    MinLieshiAttack,
    MinMingjinAttack,
    MinPozhuAttack,
    MinQiansiAttack,
    MinWuxiangAttack,
    PozhuDamage,
    PozhuPenetration,
    QiansiDamage,
    QiansiPenetration,
    RaidDamage,
    Shi,
    SingleqsDamage,
    Ti,
    WeaponDamage,
    WuxiangPenetration,
    WuxueDamage,
    Yu,
}

pub const ATTR_COUNT: usize = 50;
pub const fn attr_index(attr: Attr) -> usize { attr as usize }

pub const BASE_ATTRS: &[(Attr, f64)] = &[(Attr::FixedDamage, 50.0), (Attr::AccuracyRate, 110.1), (Attr::Yu, 283.0), (Attr::Ti, 283.0), (Attr::Jin, 283.0), (Attr::Shi, 283.0), (Attr::Min, 283.0), (Attr::MaxWuxiangAttack, 92.4), (Attr::MinWuxiangAttack, 79.2), (Attr::MinExternalAttack, 930.0), (Attr::MaxExternalAttack, 1688.4), (Attr::RaidDamage, 0.0), (Attr::BenefitResistance, 1.15), (Attr::FixedDamageRate, 50.0), (Attr::LevelResistance, 2.45), (Attr::CriticalRate, 24.0), (Attr::InsightRate, 12.0), (Attr::InsightDamage, 35.0), (Attr::CriticalHealDamage, 50.0), (Attr::CriticalDamage, 50.0), (Attr::PozhuPenetration, 0.0), (Attr::MingjinPenetration, 0.0), (Attr::QiansiPenetration, 0.0), (Attr::LieshiPenetration, 0.0), (Attr::MaxHp, 0.0), (Attr::ExternalDefence, 0.0), (Attr::ExternalPenetration, 0.0), (Attr::WuxiangPenetration, 0.0)];

pub struct Martial { pub attrs: &'static [(Attr, f64)], pub talents: &'static [(Attr, f64, Attr, f64)] }
pub fn martials(class_id: i32) -> &'static [Martial] { match class_id {
    781 => &[Martial { attrs: &[(Attr::MinMingjinAttack, 153.0), (Attr::MaxMingjinAttack, 306.0)], talents: &[(Attr::Shi, 432.0, Attr::InsightRate, 7.0), (Attr::MinMingjinAttack, 447.0, Attr::MingjinDamage, 15.0)] }, Martial { attrs: &[(Attr::MinMingjinAttack, 153.0), (Attr::MaxMingjinAttack, 306.0)], talents: &[(Attr::Shi, 432.0, Attr::MaxExternalAttack, 122.0), (Attr::MinMingjinAttack, 447.0, Attr::MingjinPenetration, 30.0)] }],
    779 => &[Martial { attrs: &[(Attr::MinMingjinAttack, 153.0), (Attr::MaxMingjinAttack, 306.0)], talents: &[(Attr::Jin, 432.0, Attr::InsightRate, 7.0), (Attr::MinMingjinAttack, 447.0, Attr::MingjinPenetration, 30.0)] }, Martial { attrs: &[(Attr::MinMingjinAttack, 153.0), (Attr::MaxMingjinAttack, 306.0)], talents: &[(Attr::Jin, 432.0, Attr::MaxExternalAttack, 122.0), (Attr::MinMingjinAttack, 447.0, Attr::MingjinDamage, 15.0)] }],
    594 => &[Martial { attrs: &[(Attr::MinPozhuAttack, 153.0), (Attr::MaxPozhuAttack, 306.0)], talents: &[(Attr::Min, 432.0, Attr::CriticalRate, 14.0), (Attr::MinPozhuAttack, 447.0, Attr::PozhuPenetration, 30.0)] }, Martial { attrs: &[(Attr::MinPozhuAttack, 153.0), (Attr::MaxPozhuAttack, 306.0)], talents: &[(Attr::Min, 432.0, Attr::MinExternalAttack, 122.0), (Attr::MinPozhuAttack, 447.0, Attr::PozhuDamage, 15.0)] }],
    596 => &[Martial { attrs: &[(Attr::MinPozhuAttack, 153.0), (Attr::MaxPozhuAttack, 306.0)], talents: &[(Attr::Min, 432.0, Attr::CriticalRate, 14.0), (Attr::MinPozhuAttack, 447.0, Attr::PozhuPenetration, 30.0)] }, Martial { attrs: &[(Attr::MinPozhuAttack, 153.0), (Attr::MaxPozhuAttack, 306.0)], talents: &[(Attr::Min, 432.0, Attr::MinExternalAttack, 122.0), (Attr::MinPozhuAttack, 447.0, Attr::PozhuDamage, 15.0)] }],
    597 => &[Martial { attrs: &[(Attr::MinPozhuAttack, 153.0), (Attr::MaxPozhuAttack, 306.0)], talents: &[(Attr::Min, 432.0, Attr::MinExternalAttack, 122.0), (Attr::MinPozhuAttack, 447.0, Attr::PozhuDamage, 15.0)] }, Martial { attrs: &[(Attr::MinPozhuAttack, 153.0), (Attr::MaxPozhuAttack, 306.0)], talents: &[(Attr::Min, 432.0, Attr::CriticalRate, 14.0), (Attr::MinPozhuAttack, 447.0, Attr::PozhuPenetration, 30.0)] }],
    700 => &[Martial { attrs: &[(Attr::MinLieshiAttack, 153.0), (Attr::MaxLieshiAttack, 306.0)], talents: &[(Attr::Jin, 432.0, Attr::MaxExternalAttack, 122.0), (Attr::MinLieshiAttack, 447.0, Attr::LieshiPenetration, 30.0)] }, Martial { attrs: &[(Attr::MinLieshiAttack, 153.0), (Attr::MaxLieshiAttack, 306.0)], talents: &[(Attr::MinLieshiAttack, 447.0, Attr::LieshiDamage, 15.0)] }],
    702 => &[Martial { attrs: &[(Attr::MinLieshiAttack, 153.0), (Attr::MaxLieshiAttack, 306.0)], talents: &[(Attr::Min, 432.0, Attr::CriticalRate, 14.0), (Attr::MinLieshiAttack, 447.0, Attr::LieshiPenetration, 30.0)] }, Martial { attrs: &[(Attr::MinLieshiAttack, 153.0), (Attr::MaxLieshiAttack, 306.0)], talents: &[(Attr::Min, 432.0, Attr::MinExternalAttack, 122.0), (Attr::MinLieshiAttack, 447.0, Attr::LieshiDamage, 15.0)] }],
    547 => &[Martial { attrs: &[(Attr::MinQiansiAttack, 153.0), (Attr::MaxQiansiAttack, 306.0)], talents: &[(Attr::Min, 432.0, Attr::CriticalRate, 14.0), (Attr::MinQiansiAttack, 447.0, Attr::QiansiPenetration, 30.0)] }, Martial { attrs: &[(Attr::MinQiansiAttack, 153.0), (Attr::MaxQiansiAttack, 306.0)], talents: &[(Attr::Min, 432.0, Attr::MinExternalAttack, 122.0), (Attr::MinQiansiAttack, 447.0, Attr::QiansiDamage, 15.0)] }],
    549 => &[Martial { attrs: &[(Attr::MinQiansiAttack, 153.0), (Attr::MaxQiansiAttack, 306.0)], talents: &[(Attr::Min, 432.0, Attr::MinExternalAttack, 122.0), (Attr::MinQiansiAttack, 447.0, Attr::QiansiDamage, 15.0)] }, Martial { attrs: &[(Attr::MinQiansiAttack, 153.0), (Attr::MaxQiansiAttack, 306.0)], talents: &[(Attr::Min, 432.0, Attr::CriticalRate, 14.0), (Attr::MinQiansiAttack, 447.0, Attr::QiansiPenetration, 30.0)] }],
    550 => &[Martial { attrs: &[(Attr::MinQiansiAttack, 153.0), (Attr::MaxQiansiAttack, 306.0)], talents: &[(Attr::Min, 432.0, Attr::MinExternalAttack, 122.0), (Attr::MinQiansiAttack, 447.0, Attr::QiansiDamage, 15.0)] }, Martial { attrs: &[(Attr::MinQiansiAttack, 153.0), (Attr::MaxQiansiAttack, 306.0)], talents: &[(Attr::Min, 432.0, Attr::CriticalRate, 14.0), (Attr::MinQiansiAttack, 447.0, Attr::QiansiPenetration, 30.0)] }],
    _ => &[],
} }

pub fn mind_attrs(id: i32) -> &'static [(Attr, f64)] { match id {
    168 => &[(Attr::MinMingjinAttack, 20.7), (Attr::MaxMingjinAttack, 41.3), (Attr::MingjinPenetration, 6.0)], // \"千山法\"
    629 => &[(Attr::MinLieshiAttack, 20.7), (Attr::MaxLieshiAttack, 41.3), (Attr::LieshiPenetration, 6.0)], // \"穿喉决\"
    356 => &[(Attr::MinLieshiAttack, 20.7), (Attr::MaxLieshiAttack, 41.3), (Attr::LieshiPenetration, 6.0), (Attr::CommonDamage, 10.0)], // \"抗造大法\"
    206 => &[(Attr::MinExternalAttack, 40.5), (Attr::MaxExternalAttack, 80.9), (Attr::ExternalDamage, 2.8)], // \"四时无常\"
    418 => &[(Attr::MinExternalAttack, 40.5), (Attr::MaxExternalAttack, 80.9), (Attr::DirectCriticalRate, 4.6)], // \"易水歌\"
    322 => &[(Attr::MinExternalAttack, 109.2), (Attr::ExternalPenetration, 5.1)], // \"征人归\"
    669 => &[(Attr::MinExternalAttack, 109.2), (Attr::ExternalPenetration, 5.1)], // \"绳舟行木\"
    324 => &[(Attr::MinExternalAttack, 109.2), (Attr::ExternalPenetration, 5.1)], // \"心弥泥鱼\"
    581 => &[(Attr::MinExternalAttack, 121.3), (Attr::DirectCriticalRate, 4.6)], // \"相和歌\"
    159 => &[(Attr::MaxExternalAttack, 121.3), (Attr::DirectInsightRate, 2.3)], // \"剑气纵横\"
    352 => &[(Attr::MinExternalAttack, 121.3), (Attr::DirectCriticalRate, 4.6)], // \"扶摇直上\"
    402 => &[(Attr::AccuracyRate, 11.2), (Attr::DirectCriticalRate, 4.1)], // \"断石之构\"
    257 => &[(Attr::AccuracyRate, 11.2), (Attr::CriticalDamage, 4.0)], // \"大唐歌\"
    339 => &[(Attr::AccuracyRate, 11.2), (Attr::ExternalDamage, 2.5)], // \"所恨年年\"
    279 => &[(Attr::InsightRate, 6.3), (Attr::InsightDamage, 5.2)], // \"威猛歌\"
    727 => &[(Attr::InsightRate, 6.3), (Attr::InsightDamage, 5.2)], // \"逐狼心经\"
    169 => &[(Attr::CriticalRate, 14.0), (Attr::ExternalDamage, 2.8)], // \"千营一呼\"
    326 => &[(Attr::CriticalRate, 14.0), (Attr::CriticalDamage, 4.4)], // \"忘川绝响\"
    198 => &[(Attr::CriticalRate, 14.0), (Attr::DirectCriticalRate, 4.6)], // \"君臣药\"
    683 => &[(Attr::CriticalRate, 14.0), (Attr::DirectCriticalRate, 4.6)], // \"花上月令\"
    300 => &[(Attr::CriticalRate, 14.0), (Attr::CriticalDamage, 4.4)], // \"山河绝韵\"
    280 => &[(Attr::CriticalRate, 12.6), (Attr::CriticalDamage, 4.0)], // \"孤忠不辞\"
    764 => &[(Attr::CriticalRate, 12.6), (Attr::CriticalDamage, 4.0)], // \"风知意\"
    384 => &[(Attr::CriticalRate, 12.6), (Attr::CriticalDamage, 4.0)], // \"擒天势\"
    657 => &[(Attr::MinExternalAttack, 36.4), (Attr::MaxExternalAttack, 72.8), (Attr::ExternalPenetration, 5.1)], // \"纵地摘星\"
    425 => &[(Attr::MinExternalAttack, 36.4), (Attr::MaxExternalAttack, 72.8), (Attr::ExternalDamage, 2.5)], // \"春雷篇\"
    50 => &[(Attr::MinExternalAttack, 36.4), (Attr::MaxExternalAttack, 72.8), (Attr::ExternalDamage, 2.5)], // \"三穷致知\"
    140 => &[(Attr::MinExternalAttack, 36.4), (Attr::MaxExternalAttack, 72.8), (Attr::ExternalPenetration, 5.1)], // \"凝神章\"
    310 => &[(Attr::MinExternalAttack, 36.4), (Attr::MaxExternalAttack, 72.8), (Attr::ExternalDamage, 2.5)], // \"弦墨篇\"
    472 => &[(Attr::MaxExternalAttack, 84.4), (Attr::CriticalDamage, 3.5)], // \"极乐泣血\"
    621 => &[(Attr::MaxMingjinAttack, 57.7), (Attr::MingjinDamage, 3.0)], // \"移经易武\"
    _ => &[],
} }

pub fn set_attrs(id: i32) -> &'static [(Attr, f64)] { match id {
    63 => &[(Attr::CriticalRate, 14.0)], // \"浣花\"
    536 => &[(Attr::AccuracyRate, 12.5)], // \"烟柳\"
    413 => &[(Attr::AccuracyRate, 12.5), (Attr::CriticalDamage, 10.0)], // \"时雨\"
    697 => &[(Attr::MinExternalAttack, 121.0)], // \"裁云\"
    383 => &[(Attr::MinExternalAttack, 121.0)], // \"撼天\"
    393 => &[(Attr::MinExternalAttack, 121.0), (Attr::CommonDamage, 5.0)], // \"断岳\"
    723 => &[(Attr::MinExternalAttack, 121.0)], // \"连星\"
    539 => &[(Attr::MinExternalAttack, 121.0)], // \"燕归\"
    768 => &[(Attr::InsightRate, 7.0)], // \"飞隼\"
    555 => &[(Attr::MaxExternalAttack, 121.0)], // \"玉斗\"
    _ => &[],
} }

pub fn set_key(id: i32) -> &'static str { match id {
    63 => "SET_WEAPON_HUANHUA",
    536 => "SET_WEAPON_YANLIU",
    413 => "SET_WEAPON_SHIYU",
    697 => "SET_WEAPON_CAIYUN",
    383 => "SET_WEAPON_HANTIAN",
    393 => "SET_WEAPON_DUANYUE",
    723 => "SET_WEAPON_LIANXING",
    539 => "SET_WEAPON_YANGUI",
    768 => "SET_WEAPON_FEISUN",
    555 => "SET_WEAPON_YUDOU",
    _ => "",
} }

pub fn bow_attrs(id: i32) -> &'static [(Attr, f64)] { match id {
    648 => &[(Attr::AccuracyRate, 6.2)],
    63 => &[(Attr::CriticalRate, 7.0)],
    69 => &[(Attr::InsightRate, 3.5)],
    _ => &[],
} }

pub fn arsenal_attrs(common: bool, class_id: i32) -> &'static [(Attr, f64)] { if common { return &[(Attr::MaxExternalAttack, 373.0), (Attr::MinExternalAttack, 186.0)]; } match class_id {
    781 => &[(Attr::MaxMingjinAttack, 373.0), (Attr::MinMingjinAttack, 186.0)],
    779 => &[(Attr::MaxMingjinAttack, 373.0), (Attr::MinMingjinAttack, 186.0)],
    594 => &[(Attr::MaxPozhuAttack, 373.0), (Attr::MinPozhuAttack, 186.0)],
    596 => &[(Attr::MaxPozhuAttack, 373.0), (Attr::MinPozhuAttack, 186.0)],
    597 => &[(Attr::MaxPozhuAttack, 373.0), (Attr::MinPozhuAttack, 186.0)],
    700 => &[(Attr::MaxLieshiAttack, 373.0), (Attr::MinLieshiAttack, 186.0)],
    702 => &[(Attr::MaxLieshiAttack, 373.0), (Attr::MinLieshiAttack, 186.0)],
    547 => &[(Attr::MaxQiansiAttack, 373.0), (Attr::MinQiansiAttack, 186.0)],
    549 => &[(Attr::MaxQiansiAttack, 373.0), (Attr::MinQiansiAttack, 186.0)],
    550 => &[(Attr::MaxQiansiAttack, 373.0), (Attr::MinQiansiAttack, 186.0)],
    _ => &[],
} }
