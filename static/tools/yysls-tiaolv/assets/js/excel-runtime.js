/* global YYSLS_CALC_METADATA, YYSLS_CALC_STRING_IDS */
(function () {
    "use strict";

    const META = window.YYSLS_CALC_METADATA || {};
    const STRING_IDS = window.YYSLS_CALC_STRING_IDS || {};
    const ASSET_VERSION = "21652c0c";
    const WASM_URL = `assets/wasm/yysls_calc.wasm?v=${ASSET_VERSION}`;

    const slotColumns = {
        weapon1: "k",
        weapon2: "l",
        ring: "m",
        pendant: "n",
        head: "o",
        chest: "p",
        legs: "q",
        hands: "r"
    };
    const purpleBaseAttackPenalty = {
        weapon: {
            "最小外功攻击": 10,
            "最大外功攻击": 23
        },
        ring: {
            "最小外功攻击": 13
        },
        pendant: {
            "最大外功攻击": 20
        }
    };
    const purplePenaltySlotKeys = {
        weapon1: "weapon",
        weapon2: "weapon",
        ring: "ring",
        pendant: "pendant"
    };
    const purplePenaltySlotIdKeys = {
        "1": "weapon",
        "3": "ring",
        "4": "pendant"
    };
    const statRows = {
        "劲": 3,
        "敏": 4,
        "势": 5,
        "最小外功攻击": 6,
        "最大外功攻击": 7,
        "精准率": 8,
        "会心率": 9,
        "会意率": 10,
        "最小鸣金攻击": 11,
        "最大鸣金攻击": 12,
        "最小裂石攻击": 13,
        "最大裂石攻击": 14,
        "最小牵丝攻击": 15,
        "最大牵丝攻击": 16,
        "最小破竹攻击": 17,
        "最大破竹攻击": 18,
        "最小无相攻击": 19,
        "最大无相攻击": 20,
        "对首领单位增伤": 23,
        "全武学增效": 24
    };
    const inputPercentStats = new Set([
        "精准率", "会心率", "会意率", "直接会心率", "直接会意率",
        "会心伤害加成", "会意伤害加成", "外功伤害加成", "属攻伤害加成",
        "外功治疗加成", "会心治疗加成", "全武学增效", "指定武学增效",
        "对首领单位增伤", "对玩家单位增效", "指定武学技能增伤",
        "单体类奇术增伤", "群体类奇术增伤", "剑武学增效", "枪武学增效",
        "伞武学增效", "扇武学增效", "绳标武学增效", "双刀武学增效",
        "陌刀武学增效", "横刀武学增效", "拳甲武学增效", "鼓武学增效"
    ]);
    const weaponStatRows = new Set([
        "剑武学增效", "枪武学增效", "伞武学增效", "扇武学增效",
        "绳标武学增效", "双刀武学增效", "陌刀武学增效", "横刀武学增效", "拳甲武学增效", "鼓武学增效"
    ]);
    const weaponStatLabels = {
        "剑": "剑武学增效",
        "枪": "枪武学增效",
        "伞": "伞武学增效",
        "扇": "扇武学增效",
        "绳标": "绳标武学增效",
        "双刀": "双刀武学增效",
        "陌刀": "陌刀武学增效",
        "横刀": "横刀武学增效",
        "拳甲": "拳甲武学增效",
        "鼓": "鼓武学增效"
    };
    const damageBonusResistance = 1.15;
    const classSkillLabels = {
        "鸣金影": "积矩九剑·流血增伤",
        "鸣金虹": "无名剑法·蓄力技增伤",
        "破竹尘": "醉梦游春·武学技增伤",
        "破竹风": "栗子游尘·鼠鼠增伤",
        "裂石钧（纯唐）": "斩雪刀法·轻重击派生技增伤",
        "裂石钧": "十方破阵·蓄力技增伤",
        "牵丝玉": "九重春色·特殊技增伤",
        "裂石威": "嗟夫刀法·蓄力技增伤",
        "破竹鸢": "天志垂象·蓄力技增伤",
        "牵丝翊": "鼓特殊技",
        "牵丝霖": "明川药典·治疗技增疗"
    };
    const xinfaOuterPenBonuses = {
        "征人归": 5.1,
        "绳舟行木": 5.1,
        "心弥泥鱼": 5.1,
        "明晦同尘": 5.1,
        "纵地摘星": 5.1,
        "凝神章": 5.1
    };
    const bowLabels = {
        precision: "精准",
        crit: "会心",
        intent: "会意"
    };
    const fallbackDiyAssumedOuterPen = 58.4;
    let wasm = null;
    let memory = null;
    let diyPtr = 0;
    let panelPtr = 0;
    let classPtr = 0;
    let classOutputPtr = 0;
    let classOutputLen = 3;
    const panelDamageBonusStates = new WeakMap();
    const panelDamageBonusStateKey = Symbol("yyslsPanelDamageBonusState");

    function markPanelDamageBonusState(panel, state) {
        if (panel && typeof panel === "object") {
            const normalizedState = {
                commonEffective: !!state.commonEffective,
                genericWeaponEffective: !!state.genericWeaponEffective,
                weaponSpecificEffective: !!state.weaponSpecificEffective,
                qishuEffective: !!state.qishuEffective,
                dingyinEffective: !!state.dingyinEffective
            };
            panelDamageBonusStates.set(panel, normalizedState);
            Object.defineProperty(panel, panelDamageBonusStateKey, {
                value: normalizedState,
                enumerable: true,
                configurable: true
            });
        }
        return panel;
    }

    function panelDamageBonusState(panel) {
        if (!panel || typeof panel !== "object") return {};
        return panelDamageBonusStates.get(panel) || panel[panelDamageBonusStateKey] || {};
    }

    function stringId(value) {
        const key = String(value || "").trim();
        if (Object.prototype.hasOwnProperty.call(STRING_IDS, key)) return STRING_IDS[key];
        if (Object.prototype.hasOwnProperty.call(STRING_IDS, "N/A") && !key) return STRING_IDS["N/A"];
        return 0;
    }

    const stringByIdMap = new Map(Object.entries(STRING_IDS).map(([key, value]) => [Number(value), key]));

    function stringById(value) {
        return stringByIdMap.get(Number(value) || 0) || "";
    }

    function fieldIndex(fields) {
        const map = new Map();
        (fields || []).forEach((field, index) => map.set(field, index));
        return map;
    }

    const diyIndex = fieldIndex(META.diyFields);
    const classIndexCache = new Map();

    function classFieldsFor(flowName) {
        return META.flowClassFields && META.flowClassFields[flowName] || META.classFields || [];
    }

    function classKindsFor(flowName) {
        return META.flowClassKinds && META.flowClassKinds[flowName] || META.classKinds || [];
    }

    function classCellsFor(flowName) {
        return META.flowClassCells && META.flowClassCells[flowName] || META.classCells || [];
    }

    function classDefaultsFor(flowName) {
        return META.flowClassDefaultValues && META.flowClassDefaultValues[flowName] || META.classDefaultValues && META.classDefaultValues[flowName] || [];
    }

    function classIndexFor(flowName) {
        const key = flowName || "";
        if (!classIndexCache.has(key)) classIndexCache.set(key, fieldIndex(classFieldsFor(flowName)));
        return classIndexCache.get(key);
    }

    function setRaw(raw, indexMap, field, value) {
        const index = indexMap.get(field);
        if (index !== undefined) raw[index] = Number(value) || 0;
    }

    function setRawString(raw, indexMap, field, value) {
        const index = indexMap.get(field);
        if (index !== undefined) raw[index] = stringId(value);
    }

    function classRawFromDefaults(className) {
        const defaults = classDefaultsFor(className);
        const kinds = classKindsFor(className);
        const raw = new Float64Array(classFieldsFor(className).length);
        defaults.forEach((value, index) => {
            raw[index] = kinds && kinds[index] === "str" ? stringId(value) : Number(value) || 0;
        });
        return raw;
    }

    function resolveFlowName(className, options = {}) {
        if (options.flowName && META.flowIds && META.flowIds[options.flowName] !== undefined) {
            return options.flowName;
        }
        if (options.flowVersion && META.classTableVersions && META.classTableVersions[className]) {
            const match = META.classTableVersions[className].find(version => version.key === options.flowVersion);
            if (match && META.flowIds && META.flowIds[match.flowName] !== undefined) return match.flowName;
        }
        if (typeof window.getCurrentFlowNameForClass === "function") {
            const current = window.getCurrentFlowNameForClass(className);
            if (current && META.flowIds && META.flowIds[current] !== undefined) return current;
        }
        return className;
    }

    async function init() {
        const response = await fetch(WASM_URL);
        const bytes = await response.arrayBuffer();
        const instance = await WebAssembly.instantiate(bytes, {});
        wasm = instance.instance ? instance.instance.exports : instance.exports;
        memory = wasm.memory;
        diyPtr = wasm.yysls_alloc_f64(wasm.yysls_diy_input_len());
        panelPtr = wasm.yysls_alloc_f64(wasm.yysls_panel_len());
        classPtr = wasm.yysls_alloc_f64(wasm.yysls_class_input_len());
        classOutputLen = typeof wasm.yysls_class_output_len === "function" ? wasm.yysls_class_output_len() : 3;
        classOutputPtr = wasm.yysls_alloc_f64(classOutputLen);
        runtime.available = true;
        setTimeout(() => {
            if (typeof window.updateStats === "function") window.updateStats();
        }, 0);
        return runtime;
    }

    function writeF64(ptr, values) {
        new Float64Array(memory.buffer, ptr, values.length).set(values);
    }

    function readF64(ptr, len) {
        return Array.from(new Float64Array(memory.buffer, ptr, len));
    }

    function inputValue(stat, rawValue) {
        const value = Number(rawValue);
        if (!Number.isFinite(value) || value === 0) return 0;
        return inputPercentStats.has(stat.type) ? value / 100 : value;
    }

    function roundStatValue(value) {
        const number = Number(value);
        return Number.isFinite(number) ? Math.round(number * 100) / 100 : 0;
    }

    function getChengyinValue(stat, fallbackValue) {
        if (!stat || !stat.type) return fallbackValue;
        const chengyinValues = META.chengyinValues || {};
        const excelValue = Number(chengyinValues[stat.type]);
        if (Number.isFinite(excelValue) && excelValue > 0) return excelValue;
        const maxValues = {
            ...(window.CommonData && window.CommonData.MAX_VALUES || {}),
            ...(META.maxValues || {})
        };
        const max = Number(maxValues[stat.type]);
        return Number.isFinite(max) && max > 0 ? roundStatValue(max * 0.94) : fallbackValue;
    }

    function equipStatValue(equip, stat) {
        if (!stat) return undefined;
        return equip && equip.isChengyin && !equip.ignoreChengyinValue ? getChengyinValue(stat, stat.value) : stat.value;
    }

    function addInput(raw, slotKey, stat, rawValue) {
        if (!stat || !stat.type || rawValue === undefined || rawValue === null) return;
        const col = slotColumns[slotKey];
        if (!col) return;
        const row = statInputRow(stat.type);
        if (!row) return;
        const field = `${col}${row}`;
        const index = diyIndex.get(field);
        if (index !== undefined) raw[index] += inputValue(stat, rawValue);
    }

    function statInputRow(type) {
        let row = statRows[type];
        if (weaponStatRows.has(type)) row = 21;
        if (type === "单体类奇术增伤" || type === "群体类奇术增伤") row = 22;
        return row;
    }

    function modifierList(modifiers) {
        return Array.isArray(modifiers) ? modifiers : modifiers ? [modifiers] : [];
    }

    function modifierDelta(modifier) {
        if (!modifier || !modifier.type) return 0;
        const value = inputValue({ type: modifier.type }, modifier.value);
        if (!Number.isFinite(value) || value === 0) return 0;
        return modifier.operation === "remove" ? -value : value;
    }

    function rowTotal(raw, row) {
        return Object.values(slotColumns).reduce((total, col) => {
            const index = diyIndex.get(`${col}${row}`);
            return total + (index !== undefined ? Number(raw[index]) || 0 : 0);
        }, 0);
    }

    function addRawModifier(raw, modifier) {
        if (!modifier || !modifier.type) return;
        const row = statInputRow(modifier.type);
        if (!row) return;
        const delta = modifierDelta(modifier);
        if (!delta) return;
        const field = `${slotColumns.weapon1}${row}`;
        const index = diyIndex.get(field);
        if (index === undefined) return;
        raw[index] += delta;
        const total = rowTotal(raw, row);
        if (total < 0) raw[index] -= total;
    }

    function addEquip(raw, slotKey, equip, loanDingyin) {
        if (!equip) return;
        addInput(raw, slotKey, equip.mainStat, equipStatValue(equip, equip.mainStat));
        (equip.subStats || []).forEach(stat => addInput(raw, slotKey, stat, equipStatValue(equip, stat)));
        if (!loanDingyin && equip.dingyinStat) {
            addInput(raw, slotKey, equip.dingyinStat, equip.dingyinStat.value);
        }
    }

    function buildDiyRaw(options) {
        const raw = new Float64Array(META.diyFields.length);
        setRawString(raw, diyIndex, "s2", bowLabels[options.bow] || "精准");
        setRawString(raw, diyIndex, "t2", options.setName || "");
        setRawString(raw, diyIndex, "g9", options.armory === "通用" ? "通用" : "本系");
        const diyClassName = options.className === "牵丝霖" ? "牵丝玉" : options.className || "";
        setRawString(raw, diyIndex, "f14", diyClassName);
        (options.xinfa || []).slice(0, 4).forEach((name, index) => {
            setRawString(raw, diyIndex, `f${4 + index}`, name || "N/A");
        });
        for (let index = (options.xinfa || []).length; index < 4; index += 1) {
            setRawString(raw, diyIndex, `f${4 + index}`, "N/A");
        }
        Object.entries(options.equippedItems || {}).forEach(([slotKey, equip]) => {
            addEquip(raw, slotKey, equip, options.loanDingyin);
        });
        modifierList(options.modifiers).forEach(modifier => addRawModifier(raw, modifier));
        return raw;
    }

    function panelFromArray(values) {
        const byRow = row => Number(values[(META.panelRows || []).indexOf(row)]) || 0;
        const actualPrecision = byRow(6) * 100;
        const actualCrit = byRow(7) * 100;
        const actualIntent = byRow(10) * 100;
        const resistance = seasonResistance();
        return {
            "最小外功攻击": byRow(4),
            "最大外功攻击": byRow(5),
            "实际精准率": actualPrecision,
            "实际会心率": actualCrit,
            "直接会心率": byRow(8) * 100,
            "会心伤害加成": byRow(9) * 100,
            "实际会意率": actualIntent,
            "直接会意率": byRow(11) * 100,
            "会意伤害加成": byRow(12) * 100,
            "最小鸣金攻击": byRow(13),
            "最大鸣金攻击": byRow(14),
            "最小裂石攻击": byRow(15),
            "最大裂石攻击": byRow(16),
            "最小牵丝攻击": byRow(17),
            "最大牵丝攻击": byRow(18),
            "最小破竹攻击": byRow(19),
            "最大破竹攻击": byRow(20),
            "最小无相攻击": byRow(21),
            "最大无相攻击": byRow(22),
            "外功穿透": byRow(26),
            "外功伤害加成": byRow(27) * 100,
            "鸣金穿透": byRow(28),
            "鸣金伤害加成": byRow(29) * 100,
            "裂石穿透": byRow(30),
            "裂石伤害加成": byRow(31) * 100,
            "牵丝穿透": byRow(32),
            "牵丝伤害加成": byRow(33) * 100,
            "破竹穿透": byRow(34),
            "破竹伤害加成": byRow(35) * 100,
            "指定武学增效": byRow(36) * 100,
            "单体类奇术增伤": byRow(37) * 100,
            "群体类奇术增伤": byRow(37) * 100,
            "对首领单位增伤": byRow(38) * 100,
            "全武学增效": byRow(39) * 100,
            "_白字精准率": 65 + (actualPrecision - 65) * resistance,
            "_白字会心率": actualCrit * resistance,
            "_白字会意率": actualIntent * resistance
        };
    }

    function applyPurpleBaseAttackPenalty(panel, equippedItems) {
        if (!panel) return panel;
        const adjusted = { ...panel };
        Object.entries(equippedItems || {}).forEach(([slotKey, equip]) => {
            if (!equip || !equip.isPurple) return;
            const normalizedSlot = purplePenaltySlotKeys[slotKey] || purplePenaltySlotIdKeys[String(equip.slotId || "")];
            const penalty = purpleBaseAttackPenalty[normalizedSlot];
            if (!penalty) return;
            Object.entries(penalty).forEach(([stat, value]) => {
                adjusted[stat] = Math.max(0, num(adjusted[stat]) - value);
            });
        });
        return adjusted;
    }

    function applyClassPanelRules(panel, className) {
        if (!panel) return panel;
        const adjusted = { ...panel };
        if (className === "牵丝玉" || className === "牵丝翊" || className === "牵丝霖") {
            const minTsAttack = num(adjusted["最小牵丝攻击"]);
            adjusted["牵丝穿透"] = minTsAttack >= 441 ? 29.6 : 29;
            adjusted["牵丝伤害加成"] = minTsAttack >= 441 ? 14.8 : 14.5;
        }
        return adjusted;
    }

    function num(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function seasonResistance() {
        const seasonStats = window.CommonData && window.CommonData.SEASON_STATS || {};
        return num(seasonStats["赛季抗性"]) || 2.15;
    }

    function diyAssumedOuterPen() {
        const maxValues = window.CommonData && window.CommonData.MAX_VALUES || {};
        const maxOuterPen = Number(maxValues["外功穿透"]);
        return Number.isFinite(maxOuterPen) && maxOuterPen > 0 ? 4 * maxOuterPen : fallbackDiyAssumedOuterPen;
    }

    function applyRateOverflow(panel, options = {}) {
        if (!panel) return panel;
        const adjusted = { ...panel };
        const resistance = seasonResistance();
        const className = options.originalClassName || options.className || adjusted["当前流派"] || adjusted.currentClass || "";
        const setName = options.setName || adjusted["套装"] || "";

        const rawPrecision = num(adjusted["实际精准率"] !== undefined ? adjusted["实际精准率"] : adjusted["精准率"]);
        const rawCrit = num(adjusted["实际会心率"] !== undefined ? adjusted["实际会心率"] : adjusted["会心率"]);
        const rawIntent = num(adjusted["实际会意率"] !== undefined ? adjusted["实际会意率"] : adjusted["会意率"]);
        const directCrit = num(adjusted["直接会心率"]);
        const directIntent = num(adjusted["直接会意率"]);

        let critCapBonus = 0;
        if (className === "裂石威") critCapBonus += 24;
        if (setName === "浣花") critCapBonus += 5;

        let actualCrit = rawCrit;
        let critOverflow = 0;
        if (rawCrit + critCapBonus > 80) {
            critOverflow = (rawCrit + critCapBonus - 80) * resistance;
            if (actualCrit > 80) actualCrit = 80;
        }

        let actualIntent = rawIntent;
        let intentOverflow = 0;
        if (actualIntent > 40) {
            intentOverflow = (actualIntent - 40) * resistance;
            actualIntent = 40;
        }

        let actualPrecision = rawPrecision;
        let precisionOverflow = 0;
        if (actualPrecision > 100) {
            precisionOverflow = (actualPrecision - 100) * resistance;
            actualPrecision = 100;
        }

        const critForCombinedCap = actualCrit + critCapBonus > 80 ? 80 : actualCrit + critCapBonus;
        const combinedRate = actualIntent + critForCombinedCap + directCrit + directIntent;
        if (combinedRate > 100) {
            critOverflow += (combinedRate - 100) * resistance;
        }

        if (className === "裂石钧" && actualPrecision > 0) {
            const critLimit = (70 - directCrit * actualPrecision / 100) / actualPrecision * 100;
            if (actualCrit > critLimit) critOverflow = (actualCrit - critLimit) * resistance;
        }

        adjusted["实际精准率"] = actualPrecision;
        adjusted["实际会心率"] = actualCrit;
        adjusted["实际会意率"] = actualIntent;
        adjusted["精准率溢出"] = Math.max(precisionOverflow, num(adjusted["精准率溢出"]));
        adjusted["会心率溢出"] = Math.max(critOverflow, num(adjusted["会心率溢出"]));
        adjusted["会意率溢出"] = Math.max(intentOverflow, num(adjusted["会意率溢出"]));
        return adjusted;
    }

    function calculatePanel(options) {
        if (!runtime.available) return null;
        const raw = buildDiyRaw(options);
        writeF64(diyPtr, raw);
        wasm.yysls_calc_diy(diyPtr, panelPtr);
        const panel = panelFromArray(readF64(panelPtr, wasm.yysls_panel_len()));
        const withPurplePenalty = applyPurpleBaseAttackPenalty(panel, options.equippedItems);
        return markPanelDamageBonusState(
            applyRateOverflow(applyClassPanelRules(withPurplePenalty, options.className), options),
            {
                commonEffective: true,
                genericWeaponEffective: true,
                weaponSpecificEffective: false,
                qishuEffective: true,
                dingyinEffective: true
            }
        );
    }

    function addBonus(bonuses, type, rawValue) {
        if (!type || rawValue === undefined || rawValue === null) return;
        const value = Number(rawValue);
        if (!Number.isFinite(value) || value === 0) return;
        bonuses[type] = (bonuses[type] || 0) + value;
    }

    function effectiveDamageBonus(value) {
        const number = Number(value) || 0;
        return number ? number / damageBonusResistance : 0;
    }

    function effectivePenetration(value) {
        const number = Number(value) || 0;
        return number ? number / damageBonusResistance : 0;
    }

    function displayDamageBonus(value, alreadyEffective) {
        const number = Number(value) || 0;
        return alreadyEffective ? number : effectiveDamageBonus(number);
    }

    function dingyinBonusValue(type, value) {
        return type === "外功穿透" ? effectivePenetration(value) : value;
    }

    function xinfaOuterPenBonus(xinfa) {
        const seen = new Set();
        return (Array.isArray(xinfa) ? xinfa : []).reduce((total, name) => {
            const key = String(name || "").trim();
            if (!key || seen.has(key)) return total;
            seen.add(key);
            return total + (xinfaOuterPenBonuses[key] || 0);
        }, 0);
    }

    function applyBonusModifier(bonuses, modifier) {
        if (!modifier || !modifier.type) return;
        const value = Number(modifier.value);
        if (!Number.isFinite(value) || value === 0) return;
        const delta = modifier.operation === "remove" ? -value : value;
        bonuses[modifier.type] = Math.max(0, (Number(bonuses[modifier.type]) || 0) + delta);
    }

    function collectBonuses(options) {
        const bonuses = {};
        Object.values(options.equippedItems || {}).forEach(equip => {
            if (!equip) return;
            addBonus(bonuses, equip.mainStat && equip.mainStat.type, equipStatValue(equip, equip.mainStat));
            (equip.subStats || []).forEach(stat => addBonus(bonuses, stat.type, equipStatValue(equip, stat)));
            if (!options.loanDingyin && equip.dingyinStat) {
                addBonus(bonuses, equip.dingyinStat.type, dingyinBonusValue(equip.dingyinStat.type, equip.dingyinStat.value));
            }
        });
        if (options.loanDingyin) {
            const loan = options.loanDingyinValue || [];
            bonuses["外功穿透"] = effectivePenetration(loan[0]);
            bonuses["属攻穿透"] = Number(loan[1]) || 0;
            bonuses["指定武学技能增伤"] = Number(loan[2]) || 0;
        }
        modifierList(options.modifiers).forEach(modifier => applyBonusModifier(bonuses, modifier));
        return bonuses;
    }

    function normalizePanelAliases(panel, className) {
        const adjusted = { ...(panel || {}) };
        const skillLabel = classSkillLabels[className];
        if (skillLabel && adjusted["指定武学技能增伤"] === undefined && adjusted[skillLabel] !== undefined) {
            adjusted["指定武学技能增伤"] = adjusted[skillLabel];
        }
        return adjusted;
    }

    function applyPanelBonuses(panel, bonuses, element, options = {}) {
        const adjusted = { ...panel };
        const hasExplicitBonuses = !!options.hasExplicitBonuses;
        const damageState = options.damageState || {};
        const panelOuterPen = Number(adjusted["外功穿透"]) || 0;
        const bonusOuterPen = Number(bonuses["外功穿透"]) || 0;
        adjusted["外功穿透"] = bonusOuterPen
            ? Math.max(0, panelOuterPen - diyAssumedOuterPen(), xinfaOuterPenBonus(options.xinfa)) + bonusOuterPen
            : panelOuterPen;
        const bonusElementPen = Number(bonuses["属攻穿透"]) || 0;
        const panelElementPen = Number(adjusted["属攻穿透"]) || 0;
        adjusted["属攻穿透"] = bonusElementPen || panelElementPen;
        adjusted["无相穿透"] = Number(bonuses["无相穿透"]) || Number(adjusted["无相穿透"]) || 0;
        ["对首领单位增伤", "对玩家单位增效", "全武学增效"].forEach(statName => {
            if (adjusted[statName] !== undefined) {
                adjusted[statName] = displayDamageBonus(adjusted[statName], damageState.commonEffective);
            }
        });
        if (adjusted["指定武学增效"] !== undefined) {
            adjusted["指定武学增效"] = displayDamageBonus(adjusted["指定武学增效"], damageState.genericWeaponEffective);
        }
        if (hasExplicitBonuses) {
            adjusted["指定武学技能增伤"] = effectiveDamageBonus(bonuses["指定武学技能增伤"]);
        } else if (adjusted["指定武学技能增伤"] !== undefined) {
            adjusted["指定武学技能增伤"] = displayDamageBonus(adjusted["指定武学技能增伤"], damageState.dingyinEffective);
        }
        const elementPenField = element ? `${element}穿透` : "";
        if (elementPenField) {
            const currentElementPen = Number(adjusted[elementPenField]) || 0;
            const genericElementPen = bonusElementPen || (currentElementPen ? 0 : panelElementPen);
            adjusted[elementPenField] = currentElementPen + genericElementPen;
        }
        Object.values(weaponStatLabels).forEach(statName => {
            const bonusValue = Number(bonuses[statName]) || 0;
            adjusted[statName] = bonusValue
                ? effectiveDamageBonus(bonusValue)
                : displayDamageBonus(adjusted[statName], damageState.weaponSpecificEffective);
        });
        if (hasExplicitBonuses) {
            adjusted["单体类奇术增伤"] = effectiveDamageBonus(bonuses["单体类奇术增伤"]);
            adjusted["群体类奇术增伤"] = effectiveDamageBonus(bonuses["群体类奇术增伤"]);
        } else {
            adjusted["单体类奇术增伤"] = displayDamageBonus(adjusted["单体类奇术增伤"], damageState.qishuEffective);
            adjusted["群体类奇术增伤"] = displayDamageBonus(adjusted["群体类奇术增伤"], damageState.qishuEffective);
        }
        return adjusted;
    }

    function fillClassXinfa(raw, indexMap, className, xinfa) {
        const selected = new Set((xinfa || []).map(name => String(name || "").trim()).filter(Boolean));
        const used = new Set();
        const entries = META.classXinfaInputs && META.classXinfaInputs[className] || [];
        entries.forEach(entry => {
            if (entry.mode === "toggle") {
                setRawString(raw, indexMap, entry.field, selected.has(entry.label) ? "√" : "×");
            } else if (entry.mode === "level_toggle") {
                setRawString(raw, indexMap, entry.field, selected.has(entry.label) ? (entry.default || "六重") : "不带");
            } else if (entry.mode === "dropdown") {
                const slotIndex = entry.field === "third_xinfa" ? 2 : entry.field === "fourth_xinfa" ? 3 : -1;
                const slotPicked = slotIndex >= 0 ? String((xinfa || [])[slotIndex] || "").trim() : "";
                const picked = slotPicked && (entry.candidates || []).includes(slotPicked) ? slotPicked : (xinfa || []).map(name => String(name || "").trim()).find(name => {
                    return name && !used.has(name) && (entry.candidates || []).includes(name);
                }) || "N/a";
                used.add(picked);
                setRawString(raw, indexMap, entry.field, picked);
            } else {
                setRawString(raw, indexMap, entry.field, entry.default || "");
            }
        });
    }

    function buildClassRaw(panel, options, className) {
        const raw = classRawFromDefaults(className);
        const classIndex = classIndexFor(className);
        const pct = value => (Number(value) || 0) / 100;
        const damagePct = (value, alreadyEffective = false) => pct(alreadyEffective ? value : effectiveDamageBonus(value));
        const damageState = options.damageBonusState || {};
        const rateForClass = actualField => panel[actualField];
        fillClassXinfa(raw, classIndex, className, options.xinfa || panel["心法"] || []);
        const setField = META.classSetFields && META.classSetFields[className] || "g5";
        setRawString(raw, classIndex, setField, options.setName || panel["套装"] || "");
        if (classIndex.has("g1")) setRawString(raw, classIndex, "g1", options.armory || panel["武库"] || "");
        setRaw(raw, classIndex, "b5", panel["最小外功攻击"]);
        setRaw(raw, classIndex, "c5", panel["最大外功攻击"]);
        setRaw(raw, classIndex, "d5", panel["外功穿透"]);
        setRaw(raw, classIndex, "e5", pct(panel["外功伤害加成"]));
        setRaw(raw, classIndex, "b7", panel["最小鸣金攻击"]);
        setRaw(raw, classIndex, "c7", panel["最大鸣金攻击"]);
        setRaw(raw, classIndex, "d7", panel["鸣金穿透"]);
        setRaw(raw, classIndex, "e7", pct(panel["鸣金伤害加成"]));
        setRaw(raw, classIndex, "b9", panel["最小裂石攻击"]);
        setRaw(raw, classIndex, "c9", panel["最大裂石攻击"]);
        setRaw(raw, classIndex, "d9", panel["裂石穿透"]);
        setRaw(raw, classIndex, "e9", pct(panel["裂石伤害加成"]));
        setRaw(raw, classIndex, "b11", panel["最小牵丝攻击"]);
        setRaw(raw, classIndex, "c11", panel["最大牵丝攻击"]);
        setRaw(raw, classIndex, "d11", panel["牵丝穿透"]);
        setRaw(raw, classIndex, "e11", pct(panel["牵丝伤害加成"]));
        setRaw(raw, classIndex, "b13", panel["最小破竹攻击"]);
        setRaw(raw, classIndex, "c13", panel["最大破竹攻击"]);
        setRaw(raw, classIndex, "d13", panel["破竹穿透"]);
        setRaw(raw, classIndex, "e13", pct(panel["破竹伤害加成"]));
        setRaw(raw, classIndex, "b15", panel["最小无相攻击"]);
        setRaw(raw, classIndex, "c15", panel["最大无相攻击"]);
        if (panel["无相穿透"] !== undefined) setRaw(raw, classIndex, "d15", panel["无相穿透"]);
        if (panel["固伤加成"] !== undefined) setRaw(raw, classIndex, "e15", pct(panel["固伤加成"]));
        setRaw(raw, classIndex, "c16", pct(rateForClass("实际精准率", "_白字精准率", "精准率")));
        setRaw(raw, classIndex, "c17", pct(rateForClass("实际会心率", "_白字会心率", "会心率")));
        setRaw(raw, classIndex, "c18", pct(rateForClass("实际会意率", "_白字会意率", "会意率")));
        setRaw(raw, classIndex, "c19", pct(panel["直接会心率"]));
        setRaw(raw, classIndex, "c20", pct(panel["直接会意率"]));
        setRaw(raw, classIndex, "e16", pct(panel["会心伤害加成"]));
        setRaw(raw, classIndex, "e17", pct(panel["会意伤害加成"]));
        setRaw(raw, classIndex, "e18", damagePct(panel["对首领单位增伤"], damageState.commonEffective));
        const classValueFields = META.classValueFields && META.classValueFields[className] || {};
        const hasWeaponBonus = Object.values(weaponStatLabels).some(statName => Number(panel[statName]) !== 0);
        Object.entries(weaponStatLabels).forEach(([label, statName]) => {
            const value = hasWeaponBonus ? panel[statName] : panel[statName] || panel["指定武学增效"];
            const alreadyEffective = hasWeaponBonus ? damageState.weaponSpecificEffective : damageState.genericWeaponEffective;
            if (classValueFields[label]) setRaw(raw, classIndex, classValueFields[label], damagePct(value, alreadyEffective));
        });
        if (classValueFields["全武器增伤"]) setRaw(raw, classIndex, classValueFields["全武器增伤"], damagePct(panel["全武学增效"], damageState.commonEffective));
        const bossBonusField = classValueFields["首领增"] || classValueFields["首领增伤"] || classValueFields["对首领单位增伤"];
        if (bossBonusField) setRaw(raw, classIndex, bossBonusField, damagePct(panel["对首领单位增伤"], damageState.commonEffective));
        if (classValueFields["单体奇术"]) setRaw(raw, classIndex, classValueFields["单体奇术"], damagePct(panel["单体类奇术增伤"], damageState.qishuEffective));
        if (classValueFields["群体奇术"]) setRaw(raw, classIndex, classValueFields["群体奇术"], damagePct(panel["群体类奇术增伤"], damageState.qishuEffective));
        if (panel["指定武学技能增伤"] !== undefined) {
            (META.classSkillDingyinFields && META.classSkillDingyinFields[className] || []).forEach(field => {
                setRaw(raw, classIndex, field, damagePct(panel["指定武学技能增伤"], damageState.dingyinEffective));
            });
        }
        Object.entries(options.classInputOverrides || {}).forEach(([field, value]) => {
            if (!classIndex.has(field)) return;
            const number = Number(value);
            if (Number.isFinite(number)) setRaw(raw, classIndex, field, number);
        });
        return raw;
    }

    function calculateFromPanel(panel, options = {}) {
        if (!runtime.available || !panel) return null;
        const originalClassName = options.className || panel["当前流派"] || panel.currentClass;
        const className = originalClassName;
        const flowName = resolveFlowName(className, options);
        const flowId = META.flowIds && META.flowIds[flowName];
        if (flowId === undefined) return null;
        const sourceDamageState = panelDamageBonusState(panel);
        const hasExplicitBonuses = Object.prototype.hasOwnProperty.call(options, "bonuses");
        const panelDamageBonusesAlreadyEffective = !!options.panelDamageBonusesAlreadyEffective;
        const inputDamageBonusState = {
            commonEffective: !!sourceDamageState.commonEffective || panelDamageBonusesAlreadyEffective,
            genericWeaponEffective: !!sourceDamageState.genericWeaponEffective || panelDamageBonusesAlreadyEffective,
            weaponSpecificEffective: !!sourceDamageState.weaponSpecificEffective || panelDamageBonusesAlreadyEffective,
            qishuEffective: !!sourceDamageState.qishuEffective || panelDamageBonusesAlreadyEffective,
            dingyinEffective: !!sourceDamageState.dingyinEffective || panelDamageBonusesAlreadyEffective
        };
        const outputDamageBonusState = {
            commonEffective: true,
            genericWeaponEffective: true,
            weaponSpecificEffective: true,
            qishuEffective: true,
            dingyinEffective: true
        };
        const element = META.classElements && (META.classElements[flowName] || META.classElements[className]) || "";
        const normalizedPanel = applyClassPanelRules(normalizePanelAliases(panel, originalClassName || className), className);
        const adjustedPanel = applyPanelBonuses(normalizedPanel, options.bonuses || {}, element, {
            hasExplicitBonuses,
            damageState: inputDamageBonusState,
            xinfa: options.xinfa || panel["心法"] || []
        });
        const cappedPanel = applyRateOverflow(adjustedPanel, { ...options, className: originalClassName, originalClassName });
        const raw = buildClassRaw(cappedPanel, {
            ...options,
            damageBonusState: outputDamageBonusState
        }, flowName);
        markPanelDamageBonusState(cappedPanel, outputDamageBonusState);
        writeF64(classPtr, raw);
        let totalDamage = 0;
        let dps = 0;
        let graduationRatio = null;
        let rdps = 0;
        let rdpsGraduationRatio = null;
        if (typeof wasm.yysls_calc_class_outputs === "function") {
            wasm.yysls_calc_class_outputs(flowId, classPtr, classOutputPtr);
            const outputs = readF64(classOutputPtr, classOutputLen);
            totalDamage = outputs[0] || 0;
            dps = outputs[1] || 0;
            graduationRatio = Number.isFinite(outputs[2]) ? outputs[2] : null;
            rdps = outputs[3] || 0;
            rdpsGraduationRatio = Number.isFinite(outputs[4]) && outputs[4] > 0 ? outputs[4] : null;
        } else {
            totalDamage = wasm.yysls_calc_class(flowId, classPtr);
        }
        const rotation = window.ClassConfig && window.ClassConfig.ROTATIONS && (window.ClassConfig.ROTATIONS[flowName] || window.ClassConfig.ROTATIONS[className]) || {};
        const generatedRotation = META.classRotationStats && (META.classRotationStats[flowName] || META.classRotationStats[className]) || {};
        const useTime = Number(generatedRotation.useTime) || rotation.useTime || 1;
        if (!dps) dps = totalDamage / useTime;
        const fallbackBaseline = typeof window.getBaseLineByClass === "function"
            ? window.getBaseLineByClass(className, options.xinfa || panel["心法"] || [], flowName)
            : rotation.baseline || totalDamage;
        const baselineTotal = Number(generatedRotation.baselineTotal || generatedRotation.baseline) || fallbackBaseline;
        const baselineDps = Number(generatedRotation.baselineDps || generatedRotation.dps) || (baselineTotal / useTime);
        const graduationRate = graduationRatio !== null ? graduationRatio * 100 : (baselineDps ? dps / baselineDps * 100 : null);
        const rdpsGraduationRate = rdpsGraduationRatio !== null ? rdpsGraduationRatio * 100 : null;
        const effectiveBaseline = graduationRatio ? dps / graduationRatio : baselineDps;
        return {
            source: "wasm",
            className,
            flowName,
            panel: cappedPanel,
            totalDamage,
            dps,
            rdps,
            useTime,
            baseline: effectiveBaseline,
            baselineTotal,
            graduationRate,
            rdpsGraduationRate,
            meta: { ...rotation, ...generatedRotation }
        };
    }

    function calculate(options) {
        try {
            if (!runtime.available) return null;
            const panel = calculatePanel(options);
            if (!panel) return null;
            const bonuses = collectBonuses(options);
            return calculateFromPanel(panel, { ...options, bonuses });
        } catch (error) {
            console.warn("Rust/WASM 计算失败：", error);
            return null;
        }
    }

    function exportClassInputData(options) {
        try {
            if (!runtime.available) return null;
            const result = calculate(options);
            if (!result || !result.panel) return null;
            const flowName = result.flowName || resolveFlowName(options.className, options);
            const outputDamageBonusState = {
                commonEffective: true,
                genericWeaponEffective: true,
                weaponSpecificEffective: true,
                qishuEffective: true,
                dingyinEffective: true
            };
            const raw = buildClassRaw(result.panel, {
                ...options,
                damageBonusState: outputDamageBonusState
            }, flowName);
            const fields = classFieldsFor(flowName);
            const kinds = classKindsFor(flowName);
            const cells = classCellsFor(flowName);
            const values = Array.from(raw).map((value, index) => kinds[index] === "str" ? stringById(value) : value);
            const generatedRotation = META.classRotationStats && (META.classRotationStats[flowName] || META.classRotationStats[options.className]) || {};
            const workbookName = generatedRotation.version ? `${generatedRotation.version}.xlsx` : "";
            return {
                className: options.className || result.className,
                flowName,
                workbookName,
                fields,
                kinds,
                cells,
                values,
                panel: result.panel,
                meta: { ...result.meta, ...generatedRotation }
            };
        } catch (error) {
            console.warn("Excel 表格导出输入生成失败：", error);
            return null;
        }
    }

    const runtime = {
        available: false,
        ready: init().catch(error => {
            console.error("Rust/WASM 计算模块加载失败：", error);
            return null;
        }),
        calculate,
        calculatePanel,
        calculateFromPanel(panel, options = {}) {
            try {
                return calculateFromPanel(panel, options);
            } catch (error) {
                console.warn("Rust/WASM 毕业率计算失败：", error);
                return null;
            }
        },
        exportClassInputData,
        clearCache() {}
    };

    window.YYSLSExcelRuntime = runtime;
}());
