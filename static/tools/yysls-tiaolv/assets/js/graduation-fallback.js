(function () {
  "use strict";

  const WORKBOOK_URL = "/tools/yysls-graduation/workbook-yuan.json?v=20260517-02";
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
    engine: null
  };

  function supports(className) {
    return className === SUPPORTED_CLASS;
  }

  async function loadEngine() {
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
    return state.engine;
  }

  function asNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function statValue(stat) {
    if (!stat || !stat.type) return;
    return asNumber(stat.value);
  }

  function applyStat(panel, stat) {
    if (!stat || !stat.type) return;
    const value = statValue(stat);
    if (!value) return;
    panel[stat.type] = asNumber(panel[stat.type]) + value;
  }

  function buildPanelFromEquips(options) {
    const equippedItems = options.equippedItems || {};
    const panel = {};

    STAT_KEYS.forEach((key) => {
      panel[key] = 0;
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

    panel["实际精准率"] = panel["精准率"];
    panel["实际会心率"] = panel["会心率"];
    panel["实际会意率"] = panel["会意率"];
    return panel;
  }

  function mark(enabled) {
    return enabled ? "√" : "×";
  }

  function percentInput(panel, key) {
    return asNumber(panel[key]) / 100;
  }

  function inputOrCurrent(engine, cell, value) {
    return value === undefined || value === null || value === "" ? engine.getCell("期望", cell) : value;
  }

  function applyPanelToEngine(engine, panel, options) {
    const xinfa = options.xinfa || [];
    const armory = options.armory || "破竹";
    const target = options.target || "笃山衔蝉";

    engine.setInput("C2", inputOrCurrent(engine, "C2", armory));
    engine.setInput("F7", inputOrCurrent(engine, "F7", target));
    engine.setInput("G5", inputOrCurrent(engine, "G5", options.setName || "撼天"));
    engine.setInput("H3", mark(xinfa.includes("断石之构")));
    engine.setInput("I3", mark(xinfa.includes("三穷致知")));
    engine.setInput("J3", mark(xinfa.includes("易水歌")));

    engine.setInput("B5", asNumber(panel["最小外功攻击"]));
    engine.setInput("C5", asNumber(panel["最大外功攻击"]));
    engine.setInput("D5", asNumber(panel["外功穿透"]));
    engine.setInput("B13", asNumber(panel["最小破竹攻击"]));
    engine.setInput("C13", asNumber(panel["最大破竹攻击"]));
    engine.setInput("B15", asNumber(panel["最小无相攻击"]));
    engine.setInput("C15", asNumber(panel["最大无相攻击"]));
    engine.setInput("C16", percentInput(panel, "实际精准率") || percentInput(panel, "精准率"));
    engine.setInput("C17", percentInput(panel, "实际会心率") || percentInput(panel, "会心率"));
    engine.setInput("C18", percentInput(panel, "实际会意率") || percentInput(panel, "会意率"));
    engine.setInput("E18", percentInput(panel, "对首领单位增伤"));
    engine.setInput("C22", percentInput(panel, "拳甲武学增效"));
    engine.setInput("C23", percentInput(panel, "绳标武学增效"));
    engine.setInput("E23", percentInput(panel, "指定武学技能增伤"));
    engine.setInput("C24", percentInput(panel, "全武学增效"));
    engine.setInput("C25", percentInput(panel, "单体类奇术增伤"));
    engine.setInput("C26", percentInput(panel, "群体类奇术增伤"));
  }

  function calculateWithEngine(engine, panel, options) {
    applyPanelToEngine(engine, panel, options);
    const totalDamage = asNumber(engine.getCell("期望", "C30"));
    const dps = asNumber(engine.getCell("期望", "C35"));
    const graduationRaw = asNumber(engine.getCell("期望", "C40"));

    return {
      totalDamage,
      dps,
      graduationRate: graduationRaw * 100,
      workbookOutputs: {
        totalDamage,
        dps,
        graduationRate: graduationRaw
      }
    };
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
    percentKeys: Array.from(PERCENT_KEYS)
  };
})();
