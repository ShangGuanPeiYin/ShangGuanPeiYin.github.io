(function () {
  "use strict";

  const WORKBOOK_URL = "/tools/yysls-graduation/workbook-yuan.json?v=20260517-03";
  const SUPPORTED_CLASS = "破竹鸢";
  const PERCENT_KEYS = new Set([
    "精准率",
    "会心率",
    "会意率",
    "对首领单位增伤",
    "拳甲武学增效",
    "绳标武学增效",
    "全武学增效",
    "单体类奇术增伤",
    "群体类奇术增伤",
    "指定武学技能增伤"
  ]);
  const STAT_KEYS = [
    "劲",
    "敏",
    "势",
    "最小外功攻击",
    "最大外功攻击",
    "最小破竹攻击",
    "最大破竹攻击",
    "最小无相攻击",
    "最大无相攻击",
    "精准率",
    "会心率",
    "会意率",
    "外功穿透",
    "属攻穿透",
    "全武学增效",
    "对首领单位增伤",
    "单体类奇术增伤",
    "群体类奇术增伤",
    "指定武学技能增伤",
    "拳甲武学增效",
    "绳标武学增效"
  ];

  class WorkbookEngine {
    constructor(workbook) {
      this.workbook = workbook;
      this.sheets = workbook.sheets;
      this.inputsState = {};
      this.defaultInputs = {};
      this.formulas = {};
      this.cache = new Map();
      this.compiled = new Map();
      this.rangeCache = new Map();
      this.columnRangeCache = new Map();
      this.vlookupIndexCache = new WeakMap();
      this.dependents = new Map();
      this.staticSheets = new Set(["目标属性", "版本日志"]);

      Object.entries(this.sheets).forEach(([sheetName, sheetData]) => {
        Object.entries(sheetData.cells).forEach(([coord, payload]) => {
          const key = `${sheetName}!${coord}`;
          if (Object.prototype.hasOwnProperty.call(payload, "f")) this.formulas[key] = payload.f;
          else this.defaultInputs[key] = payload.v;
        });
      });

      this.buildDependencyGraph();
    }

    workbookKey(cell) {
      return `期望!${cell}`;
    }

    setInput(cell, value) {
      const key = this.workbookKey(cell);
      this.inputsState[key] = value;
      this.invalidateFromKey(key);
    }

    currentValue(key) {
      if (Object.prototype.hasOwnProperty.call(this.inputsState, key)) return this.inputsState[key];
      return Object.prototype.hasOwnProperty.call(this.defaultInputs, key) ? this.defaultInputs[key] : 0;
    }

    getCell(sheetName, coord) {
      const key = `${sheetName}!${coord}`;
      if (this.cache.has(key)) return this.cache.get(key);

      let value;
      if (Object.prototype.hasOwnProperty.call(this.formulas, key)) value = this.evaluateFormula(sheetName, coord, this.formulas[key]);
      else value = this.currentValue(key);

      this.cache.set(key, value);
      return value;
    }

    colToNumber(col) {
      let value = 0;
      for (const char of col) value = value * 26 + (char.charCodeAt(0) - 64);
      return value;
    }

    numberToCol(value) {
      let n = value;
      let result = "";
      while (n > 0) {
        const mod = (n - 1) % 26;
        result = String.fromCharCode(65 + mod) + result;
        n = Math.floor((n - 1) / 26);
      }
      return result;
    }

    splitRef(ref) {
      const match = /^([A-Z]+)(\d+)$/.exec(ref);
      return { col: match[1], row: Number(match[2]) };
    }

    toNumber(value) {
      if (value === null || value === undefined || value === "") return 0;
      if (typeof value === "number") return value;
      if (typeof value === "boolean") return value ? 1 : 0;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    buildRange(sheetName, startRef, endRef) {
      const cacheKey = `${sheetName}|${startRef}|${endRef}`;
      if (this.rangeCache.has(cacheKey)) return this.rangeCache.get(cacheKey);

      const start = this.splitRef(startRef);
      const end = this.splitRef(endRef);
      const rows = [];
      for (let row = start.row; row <= end.row; row += 1) {
        const cols = [];
        for (let col = this.colToNumber(start.col); col <= this.colToNumber(end.col); col += 1) {
          cols.push(this.getCell(sheetName, `${this.numberToCol(col)}${row}`));
        }
        rows.push(cols);
      }
      this.rangeCache.set(cacheKey, rows);
      return rows;
    }

    buildColumnRange(sheetName, startCol, endCol) {
      const cacheKey = `${sheetName}|${startCol}|${endCol}`;
      if (this.columnRangeCache.has(cacheKey)) return this.columnRangeCache.get(cacheKey);

      const bounds = this.sheets[sheetName].bounds;
      const rows = [];
      for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
        const cols = [];
        for (let col = this.colToNumber(startCol); col <= this.colToNumber(endCol); col += 1) {
          cols.push(this.getCell(sheetName, `${this.numberToCol(col)}${row}`));
        }
        rows.push(cols);
      }
      this.columnRangeCache.set(cacheKey, rows);
      return rows;
    }

    protectStrings(expression) {
      const strings = [];
      const protectedExpr = expression.replace(/"([^"]*)"/g, (match) => {
        const token = `__STR${strings.length}__`;
        strings.push(match);
        return token;
      });
      return { protectedExpr, strings };
    }

    restoreStrings(expression, strings) {
      return expression.replace(/__STR(\d+)__/g, (_, index) => strings[Number(index)]);
    }

    functions() {
      return {
        IF(condition, yesValue, noValue) {
          return condition ? yesValue : noValue;
        },
        VLOOKUP: (lookupValue, table, columnIndex) => {
          let index = this.vlookupIndexCache.get(table);
          if (!index) {
            index = new Map();
            for (const row of table) {
              if (!index.has(row[0])) index.set(row[0], row);
            }
            this.vlookupIndexCache.set(table, index);
          }
          const row = index.get(lookupValue);
          if (row) return row[columnIndex - 1];
          return 0;
        },
        MAX: (...values) => Math.max(...values.flat(Infinity).map((value) => this.toNumber(value))),
        MIN: (...values) => Math.min(...values.flat(Infinity).map((value) => this.toNumber(value))),
        AND: (...values) => values.every(Boolean),
        OR: (...values) => values.some(Boolean),
        SUM: (...values) => values.flat(Infinity).reduce((sum, value) => sum + this.toNumber(value), 0)
      };
    }

    compileFormula(sheetName, formula) {
      const cacheKey = `${sheetName}|${formula}`;
      if (this.compiled.has(cacheKey)) return this.compiled.get(cacheKey);

      let expr = formula.slice(1);
      const protectedData = this.protectStrings(expr);
      expr = protectedData.protectedExpr;

      expr = expr.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
      expr = expr.replace(/([A-Za-z0-9_\u4e00-\u9fa5]+)!\$?([A-Z]{1,3})\$?(\d+):\$?([A-Z]{1,3})\$?(\d+)/g, (_, s, c1, r1, c2, r2) => `__RANGE("${s}","${c1}${r1}","${c2}${r2}")`);
      expr = expr.replace(/([A-Za-z0-9_\u4e00-\u9fa5]+)!\$?([A-Z]{1,3}):\$?([A-Z]{1,3})/g, (_, s, c1, c2) => `__COLRANGE("${s}","${c1}","${c2}")`);
      expr = expr.replace(/(?<![A-Z0-9_"])\$?([A-Z]{1,3})\$?(\d+):\$?([A-Z]{1,3})\$?(\d+)/g, (_, c1, r1, c2, r2) => `__RANGE("${sheetName}","${c1}${r1}","${c2}${r2}")`);
      expr = expr.replace(/(?<![A-Z0-9_"])\$?([A-Z]{1,3}):\$?([A-Z]{1,3})(?!\d)/g, (_, c1, c2) => `__COLRANGE("${sheetName}","${c1}","${c2}")`);
      expr = expr.replace(/([A-Za-z0-9_\u4e00-\u9fa5]+)!\$?([A-Z]{1,3})\$?(\d+)/g, (_, s, c, r) => `__GET("${s}","${c}${r}")`);
      expr = expr.replace(/(?<![A-Z0-9_"])\$?([A-Z]{1,3})\$?(\d+)/g, (_, c, r) => `__GET("${sheetName}","${c}${r}")`);
      expr = expr.replace(/<>/g, "!==");
      expr = expr.replace(/(?<![<>=!])=(?!=)/g, "===");
      expr = expr.replace(/\bTRUE\b/g, "true");
      expr = expr.replace(/\bFALSE\b/g, "false");
      expr = expr.replace(/\b(IF|VLOOKUP|MAX|MIN|AND|OR|SUM)\s*\(/g, "fn.$1(");
      expr = this.restoreStrings(expr, protectedData.strings);

      const factory = new Function("__GET", "__RANGE", "__COLRANGE", "fn", `return (${expr});`);
      this.compiled.set(cacheKey, factory);
      return factory;
    }

    evaluateFormula(sheetName, coord, formula) {
      const runner = this.compileFormula(sheetName, formula);
      return runner(
        (targetSheet, targetCoord) => this.getCell(targetSheet, targetCoord),
        (targetSheet, startRef, endRef) => this.buildRange(targetSheet, startRef, endRef),
        (targetSheet, startCol, endCol) => this.buildColumnRange(targetSheet, startCol, endCol),
        this.functions()
      );
    }

    protectFormulaForDependencyScan(formula) {
      const protectedData = this.protectStrings(formula.slice(1));
      let expr = protectedData.protectedExpr;
      expr = expr.replace(/([A-Za-z0-9_\u4e00-\u9fa5]+)!\$?([A-Z]{1,3}):\$?([A-Z]{1,3})/g, "");
      expr = expr.replace(/(?<![A-Z0-9_"])\$?([A-Z]{1,3}):\$?([A-Z]{1,3})(?!\d)/g, "");
      return expr;
    }

    expandRangeDependencies(sheetName, startRef, endRef) {
      const start = this.splitRef(startRef);
      const end = this.splitRef(endRef);
      const keys = [];
      for (let row = start.row; row <= end.row; row += 1) {
        for (let col = this.colToNumber(start.col); col <= this.colToNumber(end.col); col += 1) {
          keys.push(`${sheetName}!${this.numberToCol(col)}${row}`);
        }
      }
      return keys;
    }

    extractDependencies(sheetName, formula) {
      const dependencies = new Set();
      let expr = this.protectFormulaForDependencyScan(formula);

      expr = expr.replace(/([A-Za-z0-9_\u4e00-\u9fa5]+)!\$?([A-Z]{1,3})\$?(\d+):\$?([A-Z]{1,3})\$?(\d+)/g, (_, targetSheet, c1, r1, c2, r2) => {
        this.expandRangeDependencies(targetSheet, `${c1}${r1}`, `${c2}${r2}`).forEach((key) => dependencies.add(key));
        return "";
      });

      expr = expr.replace(/(?<![A-Z0-9_"])\$?([A-Z]{1,3})\$?(\d+):\$?([A-Z]{1,3})\$?(\d+)/g, (_, c1, r1, c2, r2) => {
        this.expandRangeDependencies(sheetName, `${c1}${r1}`, `${c2}${r2}`).forEach((key) => dependencies.add(key));
        return "";
      });

      expr = expr.replace(/([A-Za-z0-9_\u4e00-\u9fa5]+)!\$?([A-Z]{1,3})\$?(\d+)/g, (_, targetSheet, col, row) => {
        dependencies.add(`${targetSheet}!${col}${row}`);
        return "";
      });

      expr.replace(/(?<![A-Z0-9_"])\$?([A-Z]{1,3})\$?(\d+)/g, (_, col, row) => {
        dependencies.add(`${sheetName}!${col}${row}`);
        return "";
      });

      return dependencies;
    }

    buildDependencyGraph() {
      Object.entries(this.formulas).forEach(([formulaKey, formula]) => {
        const sheetName = formulaKey.split("!")[0];
        const dependencies = this.extractDependencies(sheetName, formula);
        dependencies.forEach((dependencyKey) => {
          if (!this.dependents.has(dependencyKey)) this.dependents.set(dependencyKey, new Set());
          this.dependents.get(dependencyKey).add(formulaKey);
        });
      });
    }

    clearDynamicRangeCaches() {
      for (const key of [...this.rangeCache.keys()]) {
        const sheetName = key.split("|")[0];
        if (!this.staticSheets.has(sheetName)) this.rangeCache.delete(key);
      }
      for (const key of [...this.columnRangeCache.keys()]) {
        const sheetName = key.split("|")[0];
        if (!this.staticSheets.has(sheetName)) this.columnRangeCache.delete(key);
      }
      this.vlookupIndexCache = new WeakMap();
    }

    invalidateFromKey(changedKey) {
      this.cache.delete(changedKey);
      this.clearDynamicRangeCaches();

      const queue = [changedKey];
      const visited = new Set();

      while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current)) continue;
        visited.add(current);

        const dependents = this.dependents.get(current);
        if (!dependents) continue;

        dependents.forEach((dependentKey) => {
          this.cache.delete(dependentKey);
          queue.push(dependentKey);
        });
      }
    }
  }

  const state = {
    enginePromise: null,
    engine: null,
    panelCache: new Map(),
    rateCache: new Map()
  };

  function getNativeCalculator() {
    const api = window.YYSLSYuanNativeWorkbook;
    return api && typeof api.calculate === "function" ? api : null;
  }

  function supports(className) {
    return className === SUPPORTED_CLASS;
  }

  async function loadEngine() {
    const native = getNativeCalculator();
    if (native) return native;
    if (state.enginePromise) return state.enginePromise;
    state.enginePromise = fetch(WORKBOOK_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`加载工作簿失败：${response.status}`);
        return response.json();
      })
      .then((workbook) => {
        state.engine = new WorkbookEngine(workbook);
        setTimeout(() => {
          if (typeof window.updateStats === "function") window.updateStats();
        }, 0);
        return state.engine;
      });
    return state.enginePromise;
  }

  function getEngineSync() {
    return getNativeCalculator() || state.engine;
  }

  function asNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function rounded(value) {
    return Math.round(asNumber(value) * 1000) / 1000;
  }

  function statKey(stat) {
    if (!stat || !stat.type) return "";
    return `${stat.type}:${rounded(stat.value)}`;
  }

  function equipKey(equip) {
    if (!equip) return "null";
    return [
      equip.id || "",
      equip.slotId || "",
      equip.weaponTypeId || "",
      equip.isChengyin ? "1" : "0",
      statKey(equip.mainStat),
      statKey(equip.dingyinStat),
      (equip.subStats || []).map(statKey).join("|")
    ].join("~");
  }

  function buildPanelKey(options) {
    const equippedItems = options.equippedItems || {};
    const slotKeys = ["weapon1", "weapon2", "ring", "pendant", "head", "chest", "legs", "hands"];
    const equipPart = slotKeys.map((slotKey) => `${slotKey}:${equipKey(equippedItems[slotKey])}`).join("||");
    const dingyinPart = Array.isArray(options.loanDingyinValue) ? options.loanDingyinValue.map(rounded).join(",") : "";
    return [options.className || "", options.flowName || "", equipPart, options.loanDingyin ? "loan1" : "loan0", dingyinPart].join("##");
  }

  function buildRateKey(panel, options) {
    const stats = STAT_KEYS
      .map((key) => `${key}:${rounded(panel[key])}`)
      .join("|");
    return [
      options.className || "",
      options.setName || "",
      options.armory || "",
      (options.xinfa || []).join(","),
      stats
    ].join("##");
  }

  function statValue(stat) {
    if (!stat || !stat.type) return;
    return asNumber(stat.value);
  }

  const PANEL_FIELD_MAP = {
    "b5": "最小外功攻击",
    "c5": "最大外功攻击",
    "d5": "外功穿透",
    "b7": "最小鸣金攻击",
    "c7": "最大鸣金攻击",
    "d7": "鸣金穿透",
    "b9": "最小裂石攻击",
    "c9": "最大裂石攻击",
    "d9": "裂石穿透",
    "b11": "最小牵丝攻击",
    "c11": "最大牵丝攻击",
    "d11": "牵丝穿透",
    "b13": "最小破竹攻击",
    "c13": "最大破竹攻击",
    "d13": "破竹穿透",
    "b15": "最小无相攻击",
    "c15": "最大无相攻击",
    "d15": "无相穿透",
    "c16": "精准率",
    "c17": "会心率",
    "c18": "会意率",
    "e18": "对首领单位增伤",
    "c19": "直接会心率",
    "c20": "直接会意率",
    "e20": "外功伤害加成",
    "e21": "指定武学技能增伤",
    "c22": "拳甲武学增效",
    "e22": "剑武学增效",
    "c23": "绳标武学增效",
    "e23": "指定武学技能增伤",
    "c24": "全武学增效",
    "e24": "双刀武学增效",
    "c25": "单体类奇术增伤",
    "e25": "陌刀武学增效",
    "c26": "群体类奇术增伤"
  };

  function isPercentStatKey(key) {
    return PERCENT_KEYS.has(key) || /率|增伤|增效|加成/.test(key || "");
  }

  function getBasePanelFromMetadata(options) {
    const meta = window.YYSLS_CALC_METADATA || {};
    const flowName = options.flowName || options.className || "";
    const defaults = meta.classDefaultValues && (meta.classDefaultValues[flowName] || meta.classDefaultValues[options.className]);
    const fields = meta.classFields || [];
    const panel = {};
    if (!Array.isArray(defaults) || !fields.length) return panel;

    fields.forEach((field, index) => {
      const mappedKey = PANEL_FIELD_MAP[String(field || "").toLowerCase()];
      if (!mappedKey) return;
      let value = asNumber(defaults[index]);
      if (!Number.isFinite(value)) return;
      if (isPercentStatKey(mappedKey) && Math.abs(value) <= 1.5) value *= 100;
      panel[mappedKey] = value;
    });

    if (panel["精准率"] && !panel["实际精准率"]) panel["实际精准率"] = panel["精准率"];
    if (panel["会心率"] && !panel["实际会心率"]) panel["实际会心率"] = panel["会心率"];
    if (panel["会意率"] && !panel["实际会意率"]) panel["实际会意率"] = panel["会意率"];
    return panel;
  }

  function applyStat(panel, stat) {
    if (!stat || !stat.type) return;
    const value = statValue(stat);
    if (!value) return;
    panel[stat.type] = asNumber(panel[stat.type]) + value;
  }

  function buildPanelFromEquips(options) {
    const cacheKey = buildPanelKey(options);
    if (state.panelCache.has(cacheKey)) {
      return { ...state.panelCache.get(cacheKey) };
    }
    const equippedItems = options.equippedItems || {};
    const panel = getBasePanelFromMetadata(options);

    STAT_KEYS.forEach((key) => {
      panel[key] = asNumber(panel[key]);
    });

    Object.values(equippedItems).forEach((equip) => {
      if (!equip) return;
      applyStat(panel, equip.mainStat);
      (equip.subStats || []).forEach((stat) => applyStat(panel, stat));
      applyStat(panel, equip.dingyinStat);
    });

    if (options.loanDingyin && Array.isArray(options.loanDingyinValue)) {
      const [outerPen, skillDamage] = options.loanDingyinValue;
      panel["外功穿透"] += asNumber(outerPen);
      panel["指定武学技能增伤"] += asNumber(skillDamage);
    }

    panel["实际精准率"] = asNumber(panel["实际精准率"]) || panel["精准率"];
    panel["实际会心率"] = asNumber(panel["实际会心率"]) || panel["会心率"];
    panel["实际会意率"] = asNumber(panel["实际会意率"]) || panel["会意率"];
    state.panelCache.set(cacheKey, { ...panel });
    return panel;
  }

  function mark(enabled) {
    return enabled ? "√" : "×";
  }

  function percentInput(panel, key) {
    return asNumber(panel[key]) / 100;
  }

  function buildInputOverrides(panel, options) {
    const xinfa = options.xinfa || [];
    const armory = options.armory || "破竹";
    const target = options.target || "笃山衔蝉";
    return {
      "期望!C2": armory,
      "期望!F7": target,
      "期望!G5": options.setName || "撼天",
      "期望!H3": mark(xinfa.includes("断石之构")),
      "期望!I3": mark(xinfa.includes("三穷致知")),
      "期望!J3": mark(xinfa.includes("易水歌")),
      "期望!B5": asNumber(panel["最小外功攻击"]),
      "期望!C5": asNumber(panel["最大外功攻击"]),
      "期望!D5": asNumber(panel["外功穿透"]),
      "期望!B13": asNumber(panel["最小破竹攻击"]),
      "期望!C13": asNumber(panel["最大破竹攻击"]),
      "期望!B15": asNumber(panel["最小无相攻击"]),
      "期望!C15": asNumber(panel["最大无相攻击"]),
      "期望!C16": percentInput(panel, "实际精准率") || percentInput(panel, "精准率"),
      "期望!C17": percentInput(panel, "实际会心率") || percentInput(panel, "会心率"),
      "期望!C18": percentInput(panel, "实际会意率") || percentInput(panel, "会意率"),
      "期望!E18": percentInput(panel, "对首领单位增伤"),
      "期望!C22": percentInput(panel, "拳甲武学增效"),
      "期望!C23": percentInput(panel, "绳标武学增效"),
      "期望!E23": percentInput(panel, "指定武学技能增伤"),
      "期望!C24": percentInput(panel, "全武学增效"),
      "期望!C25": percentInput(panel, "单体类奇术增伤"),
      "期望!C26": percentInput(panel, "群体类奇术增伤")
    };
  }

  function calculateWithEngine(engine, panel, options) {
    const cacheKey = buildRateKey(panel, options);
    if (state.rateCache.has(cacheKey)) {
      return { ...state.rateCache.get(cacheKey), workbookOutputs: { ...state.rateCache.get(cacheKey).workbookOutputs } };
    }
    const inputs = buildInputOverrides(panel, options);
    let totalDamage = 0;
    let dps = 0;
    let graduationRaw = 0;

    if (engine && typeof engine.calculate === "function" && !engine.getCell) {
      const nativeResult = engine.calculate(inputs) || {};
      totalDamage = asNumber(nativeResult.totalDamage);
      dps = asNumber(nativeResult.dps);
      graduationRaw = asNumber(nativeResult.graduationRateRaw);
    } else {
      Object.entries(inputs).forEach(([key, value]) => {
        const [, cell] = key.split("!");
        engine.setInput(cell, value);
      });
      totalDamage = asNumber(engine.getCell("期望", "C30"));
      dps = asNumber(engine.getCell("期望", "C35"));
      graduationRaw = asNumber(engine.getCell("期望", "C40"));
    }

    const result = {
      totalDamage,
      dps,
      graduationRate: graduationRaw * 100,
      workbookOutputs: {
        totalDamage,
        dps,
        graduationRate: graduationRaw
      }
    };
    state.rateCache.set(cacheKey, result);
    return { ...result, workbookOutputs: { ...result.workbookOutputs } };
  }

  async function calculateFromPanel(panel, options) {
    const engine = await loadEngine();
    return calculateWithEngine(engine, panel, options);
  }

  function calculateFromPanelSync(panel, options) {
    const engine = getEngineSync();
    if (!engine) return null;
    return calculateWithEngine(engine, panel, options);
  }

  loadEngine().catch((error) => {
    console.warn("破竹鸢毕业率工作簿加载失败：", error);
  });

  window.YYSLSGraduationFallback = {
    supports,
    loadEngine,
    getEngineSync,
    buildPanelFromEquips,
    calculateFromPanel,
    calculateFromPanelSync,
    clearCache() {
      state.panelCache.clear();
      state.rateCache.clear();
    },
    percentKeys: Array.from(PERCENT_KEYS)
  };
})();
