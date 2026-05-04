(async function () {
  const compareRows = Array.from({ length: 25 }, (_, index) => ({
    labelCell: `L${index + 2}`,
    currentA: `M${index + 2}`,
    currentB: `N${index + 2}`,
    compareA: `O${index + 2}`,
    compareB: `P${index + 2}`
  }));

  const echoCells = [
    ["C2", "主属性"],
    ["F7", "目标"],
    ["B5", "最小外功"],
    ["C5", "最大外功"],
    ["D5", "外功穿透"],
    ["B13", "最小破竹"],
    ["C13", "最大破竹"],
    ["D13", "破竹穿透"],
    ["C16", "精准率"],
    ["C17", "会心率"],
    ["C18", "会意率"],
    ["E18", "首领增伤"]
  ];

  const calculators = {
    yuan: {
      key: "yuan",
      name: "破竹鸢",
      badge: "破竹鸢原 Excel 公式驱动",
      title: "破竹鸢毕业率计算器",
      description: "切换到破竹鸢模式后，页面会直接加载破竹鸢 4.3 工作簿，并按它的原始公式链实时计算。",
      dataUrl: "/tools/yysls-graduation/workbook-yuan.json",
      suiteOptions: ["无", "撼天", "飞隼", "时雨"],
      inputGroups: [
        {
          title: "战斗环境",
          compact: true,
          fields: [
            { cell: "C2", labelCell: "B2", type: "select", options: ["外功", "鸣金", "裂石", "牵丝", "破竹", "无相"] },
            { cell: "F7", labelCell: "F6", type: "select", optionsFromTargetSheet: true }
          ]
        },
        {
          title: "心法",
          checks: true,
          fields: [
            { cell: "H3", labelCell: "H2", type: "check" },
            { cell: "I3", labelCell: "I2", type: "check" },
            { cell: "J3", labelCell: "J2", type: "check" }
          ]
        },
        {
          title: "吃药",
          checks: true,
          fields: [
            { cell: "I5", labelCell: "I4", type: "check" },
            { cell: "F19", labelCell: "F18", type: "check" },
            { cell: "G19", labelCell: "G18", type: "check" },
            { cell: "F21", labelCell: "F20", type: "check" }
          ]
        },
        {
          title: "外功与目标",
          fields: [
            { cell: "B5", labelCell: "B4", type: "number", step: "0.1" },
            { cell: "C5", labelCell: "C4", type: "number", step: "0.1" },
            { cell: "D5", labelCell: "D4", type: "number", step: "0.1" },
            { cell: "G5", labelCell: "G4", type: "select", optionsRef: "suiteOptions" },
            { cell: "H5", labelCell: "H4", type: "select", options: ["无", "火", "毒"] },
            { cell: "E7", labelCell: "E6", type: "number", step: "0.001" },
            { cell: "E9", labelCell: "E8", type: "number", step: "0.001" },
            { cell: "E11", labelCell: "E10", type: "number", step: "0.001" }
          ]
        },
        {
          title: "破竹与无相",
          fields: [
            { cell: "B13", labelCell: "B12", type: "number", step: "0.1" },
            { cell: "C13", labelCell: "C12", type: "number", step: "0.1" },
            { cell: "D13", labelCell: "D12", type: "number", step: "0.1" },
            { cell: "E13", labelCell: "E12", type: "number", step: "0.001" },
            { cell: "B15", labelCell: "B14", type: "number", step: "0.1" },
            { cell: "C15", labelCell: "C14", type: "number", step: "0.1" },
            { cell: "E15", labelCell: "E14", type: "number", step: "0.001" },
            { cell: "G15", labelCell: "G14", type: "number", step: "0.01" }
          ]
        },
        {
          title: "双暴与增伤",
          fields: [
            { cell: "G3", labelCell: "G2", type: "number", step: "0.001" },
            { cell: "C16", labelCell: "B16", type: "number", step: "0.0001" },
            { cell: "C17", labelCell: "B17", type: "number", step: "0.0001" },
            { cell: "C18", labelCell: "B18", type: "number", step: "0.0001" },
            { cell: "E18", labelCell: "D18", type: "number", step: "0.001" },
            { cell: "G21", labelCell: "G20", type: "number", step: "1" }
          ]
        },
        {
          title: "武器与奇术增伤",
          fields: [
            { cell: "C22", labelCell: "B22", type: "number", step: "0.001" },
            { cell: "C23", labelCell: "B23", type: "number", step: "0.001" },
            { cell: "E23", labelCell: "D23", type: "number", step: "0.001" },
            { cell: "C24", labelCell: "B24", type: "number", step: "0.001" },
            { cell: "C25", labelCell: "B25", type: "number", step: "0.001" },
            { cell: "C26", labelCell: "B26", type: "number", step: "0.001" }
          ]
        }
      ]
    },
    chen: {
      key: "chen",
      name: "破竹尘",
      badge: "破竹尘原 Excel 公式驱动",
      title: "破竹尘毕业率计算器",
      description: "切换到破竹尘模式后，页面会改用破竹尘 4.5 工作簿，表单和结果都会按它自己的 Excel 数据来计算。",
      dataUrl: "/tools/yysls-graduation/workbook-chen.json",
      suiteOptions: ["无", "连星", "撼天", "飞隼", "时雨"],
      inputGroups: [
        {
          title: "战斗环境",
          compact: true,
          fields: [
            { cell: "C2", labelCell: "B2", type: "select", options: ["外功", "鸣金", "裂石", "牵丝", "破竹", "无相"] },
            { cell: "F7", labelCell: "F6", type: "select", optionsFromTargetSheet: true }
          ]
        },
        {
          title: "心法",
          checks: true,
          fields: [
            { cell: "H3", labelCell: "H2", type: "check" },
            { cell: "I3", labelCell: "I2", type: "check" },
            { cell: "J3", labelCell: "J2", type: "check" }
          ]
        },
        {
          title: "吃药",
          checks: true,
          fields: [
            { cell: "I5", labelCell: "I4", type: "check" },
            { cell: "F19", labelCell: "F18", type: "check" },
            { cell: "G19", labelCell: "G18", type: "check" },
            { cell: "F21", labelCell: "F20", type: "check" }
          ]
        },
        {
          title: "外功与目标",
          fields: [
            { cell: "B5", labelCell: "B4", type: "number", step: "0.1" },
            { cell: "C5", labelCell: "C4", type: "number", step: "0.1" },
            { cell: "D5", labelCell: "D4", type: "number", step: "0.1" },
            { cell: "G5", labelCell: "G4", type: "select", optionsRef: "suiteOptions" },
            { cell: "H5", labelCell: "H4", type: "select", options: ["无", "火", "毒"] },
            { cell: "E7", labelCell: "E6", type: "number", step: "0.001" },
            { cell: "E9", labelCell: "E8", type: "number", step: "0.001" },
            { cell: "E11", labelCell: "E10", type: "number", step: "0.001" }
          ]
        },
        {
          title: "破竹与无相",
          fields: [
            { cell: "B13", labelCell: "B12", type: "number", step: "0.1" },
            { cell: "C13", labelCell: "C12", type: "number", step: "0.1" },
            { cell: "D13", labelCell: "D12", type: "number", step: "0.1" },
            { cell: "E13", labelCell: "E12", type: "number", step: "0.001" },
            { cell: "B15", labelCell: "B14", type: "number", step: "0.1" },
            { cell: "E15", labelCell: "E14", type: "number", step: "0.001" }
          ]
        },
        {
          title: "双暴与增伤",
          fields: [
            { cell: "G3", labelCell: "G2", type: "number", step: "0.001" },
            { cell: "C16", labelCell: "B16", type: "number", step: "0.0001" },
            { cell: "C17", labelCell: "B17", type: "number", step: "0.0001" },
            { cell: "C18", labelCell: "B18", type: "number", step: "0.0001" },
            { cell: "E18", labelCell: "D18", type: "number", step: "0.001" },
            { cell: "I19", labelCell: "H19", type: "number", step: "0.001" },
            { cell: "I20", labelCell: "H20", type: "number", step: "0.001" },
            { cell: "G21", labelCell: "G20", type: "number", step: "1" }
          ]
        },
        {
          title: "武器与奇术增伤",
          fields: [
            { cell: "C22", labelCell: "B22", type: "number", step: "0.001" },
            { cell: "C23", labelCell: "B23", type: "number", step: "0.001" },
            { cell: "E23", labelCell: "D23", type: "number", step: "0.001" },
            { cell: "C24", labelCell: "B24", type: "number", step: "0.001" },
            { cell: "C25", labelCell: "B25", type: "number", step: "0.001" },
            { cell: "C26", labelCell: "B26", type: "number", step: "0.001" }
          ]
        }
      ]
    }
  };

  class WorkbookEngine {
    constructor(workbook, inputsState) {
      this.workbook = workbook;
      this.inputsState = inputsState;
      this.sheets = workbook.sheets;
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

    resetInputs() {
      Object.keys(this.inputsState).forEach((key) => delete this.inputsState[key]);
      this.cache.clear();
      this.rangeCache.clear();
      this.columnRangeCache.clear();
      this.vlookupIndexCache = new WeakMap();
    }

    currentValue(key) {
      if (Object.prototype.hasOwnProperty.call(this.inputsState, key)) return this.inputsState[key];
      return Object.prototype.hasOwnProperty.call(this.defaultInputs, key) ? this.defaultInputs[key] : 0;
    }

    inputValue(cell) {
      return this.currentValue(this.workbookKey(cell));
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

    targetOptions() {
      return Object.entries(this.sheets["目标属性"].cells)
        .filter(([coord, payload]) => coord.startsWith("A") && coord !== "A1" && Object.prototype.hasOwnProperty.call(payload, "v"))
        .map(([, payload]) => payload.v);
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
    currentKey: "yuan",
    inputsByCalculator: {
      yuan: {},
      chen: {}
    },
    engines: {}
  };

  async function loadWorkbook(key) {
    if (state.engines[key]) return state.engines[key];
    const config = calculators[key];
    const workbook = await fetch(config.dataUrl).then((response) => response.json());
    const engine = new WorkbookEngine(workbook, state.inputsByCalculator[key]);
    state.engines[key] = engine;
    return engine;
  }

  function currentConfig() {
    return calculators[state.currentKey];
  }

  async function currentEngine() {
    return loadWorkbook(state.currentKey);
  }

  function boolToMark(value) {
    return value ? "√" : "×";
  }

  function markToBool(value) {
    return value === "√";
  }

  function formatValue(value, decimals = 4) {
    if (typeof value === "number") {
      const abs = Math.abs(value);
      if (abs >= 1000) return value.toFixed(2);
      if (abs >= 1) return value.toFixed(Math.min(decimals, 3));
      return value.toFixed(decimals);
    }
    return String(value);
  }

  function labelText(engine, field) {
    if (field.label) return field.label;
    if (!field.labelCell) return field.cell;
    const value = engine.getCell("期望", field.labelCell);
    return value || field.cell;
  }

  function selectOptions(config, engine, field) {
    if (field.optionsFromTargetSheet) return engine.targetOptions();
    if (field.optionsRef) return config[field.optionsRef] || [];
    return field.options || [];
  }

  function updateHero(config) {
    document.title = `${config.title} - 我的博客`;
    document.getElementById("heroBadge").textContent = config.badge;
    document.getElementById("heroTitle").textContent = config.title;
    document.getElementById("heroDescription").textContent = config.description;
    document.getElementById("calculatorHeading").textContent = `${config.name}主输入区`;
    document.getElementById("calculatorSubtle").textContent = `当前模式：${config.name}。这里对应的是它自己工作簿里的可编辑主输入格。`;
    document.getElementById("mainSheetStatus").textContent = `当前读取：${config.name} 的期望页输出格`;
    document.getElementById("graduationNote").textContent = `这里读取的是 ${config.name} 工作簿里的 期望!C40。`;
  }

  async function mountForm() {
    const config = currentConfig();
    const engine = await currentEngine();
    const mount = document.getElementById("formMount");
    mount.innerHTML = "";

    config.inputGroups.forEach((group) => {
      const section = document.createElement("div");
      section.className = "section";
      const title = document.createElement("h3");
      title.textContent = group.title;
      section.appendChild(title);

      if (group.checks) {
        const checks = document.createElement("div");
        checks.className = "checks";

        group.fields.forEach((field) => {
          const label = document.createElement("label");
          label.className = "toggle";
          const input = document.createElement("input");
          input.type = "checkbox";
          input.checked = markToBool(engine.inputValue(field.cell));
          input.addEventListener("change", () => {
            engine.setInput(field.cell, boolToMark(input.checked));
            renderOutputs();
          });
          label.appendChild(input);
          label.appendChild(document.createTextNode(labelText(engine, field)));
          checks.appendChild(label);
        });

        section.appendChild(checks);
      } else {
        const fields = document.createElement("div");
        fields.className = group.compact ? "fields compact" : "fields";

        group.fields.forEach((field) => {
          const label = document.createElement("label");
          label.className = "field";
          const caption = document.createElement("span");
          caption.textContent = `${labelText(engine, field)} (${field.cell})`;
          label.appendChild(caption);

          let input;
          if (field.type === "select") {
            input = document.createElement("select");
            selectOptions(config, engine, field).forEach((optionValue) => {
              const option = document.createElement("option");
              option.value = optionValue;
              option.textContent = optionValue;
              input.appendChild(option);
            });
            input.value = engine.inputValue(field.cell);
          } else {
            input = document.createElement("input");
            input.type = field.type;
            if (field.step) input.step = field.step;
            input.value = engine.inputValue(field.cell);
          }

          input.addEventListener("input", () => {
            engine.setInput(field.cell, field.type === "number" ? Number(input.value || 0) : input.value);
            renderOutputs();
          });

          label.appendChild(input);
          fields.appendChild(label);
        });

        section.appendChild(fields);
      }

      mount.appendChild(section);
    });

    const compareSection = document.createElement("div");
    compareSection.className = "section";
    compareSection.innerHTML = `
      <h3>隐藏对比区</h3>
      <p class="subtle" style="margin-bottom:14px;">
        这里对应原工作簿里用于“当前装备 / 对比装备”计算的隐藏输入块（L2:P26）。
        切换计算器后，这一块也会自动切到对应工作簿。
      </p>
    `;

    const compareWrap = document.createElement("div");
    compareWrap.style.display = "grid";
    compareWrap.style.gap = "10px";

    const compareHead = document.createElement("div");
    compareHead.className = "kv-item";
    compareHead.innerHTML = `
      <span>属性</span>
      <span style="display:grid;grid-template-columns:repeat(4,minmax(68px,88px));gap:8px;justify-items:center;">
        <b>当前A</b><b>当前B</b><b>对比A</b><b>对比B</b>
      </span>
    `;
    compareWrap.appendChild(compareHead);

    compareRows.forEach((row) => {
      const line = document.createElement("div");
      line.className = "kv-item";

      const left = document.createElement("span");
      left.textContent = engine.getCell("期望", row.labelCell) || row.labelCell;
      line.appendChild(left);

      const right = document.createElement("span");
      right.style.display = "grid";
      right.style.gridTemplateColumns = "repeat(4,minmax(68px,88px))";
      right.style.gap = "8px";

      [row.currentA, row.currentB, row.compareA, row.compareB].forEach((cell) => {
        const input = document.createElement("input");
        input.type = "number";
        input.step = "0.01";
        input.value = engine.inputValue(cell) || "";
        input.style.padding = "8px 10px";
        input.addEventListener("input", () => {
          engine.setInput(cell, input.value === "" ? 0 : Number(input.value));
          renderOutputs();
        });
        right.appendChild(input);
      });

      line.appendChild(right);
      compareWrap.appendChild(line);
    });

    compareSection.appendChild(compareWrap);
    mount.appendChild(compareSection);
  }

  async function renderEcho() {
    const engine = await currentEngine();
    const mount = document.getElementById("echoMount");
    mount.innerHTML = "";

    echoCells.forEach(([cell, label]) => {
      const item = document.createElement("div");
      item.className = "kv-item";
      item.innerHTML = `<span>${label}</span><span>${formatValue(engine.getCell("期望", cell))}</span>`;
      mount.appendChild(item);
    });
  }

  async function renderOutputs() {
    const config = currentConfig();
    const engine = await currentEngine();
    updateHero(config);

    const graduation = engine.getCell("期望", "C40");
    const totalDamage = engine.getCell("期望", "C30");
    const dps = engine.getCell("期望", "C35");
    const compareDelta = engine.getCell("期望", "Q2");
    const target = engine.getCell("期望", "F7");
    const fightTime = engine.getCell("期望", "C28");

    document.getElementById("graduationRate").textContent = `${(engine.toNumber(graduation) * 100).toFixed(2)}%`;
    document.getElementById("targetName").textContent = `目标：${target}`;
    document.getElementById("totalDamage").textContent = formatValue(totalDamage, 2);
    document.getElementById("dpsValue").textContent = formatValue(dps, 2);
    document.getElementById("fightTimeResult").textContent = formatValue(fightTime, 1);
    document.getElementById("compareDelta").textContent = `${(engine.toNumber(compareDelta) * 100).toFixed(2)}%`;
    document.getElementById("engineNote").textContent =
      `公式引擎当前载入：${config.name}。网页里的每次填写，都会回写到这个工作簿对应的输入格，再读取同一套公式的输出结果。`;

    await renderEcho();
  }

  async function switchCalculator(key) {
    state.currentKey = key;
    await mountForm();
    await renderOutputs();
  }

  function mountPicker() {
    const picker = document.getElementById("calculatorPicker");
    Object.values(calculators).forEach((config) => {
      const option = document.createElement("option");
      option.value = config.key;
      option.textContent = config.name;
      picker.appendChild(option);
    });
    picker.value = state.currentKey;
    picker.addEventListener("change", async () => {
      await switchCalculator(picker.value);
    });
  }

  document.getElementById("resetDefaults").addEventListener("click", async () => {
    const engine = await currentEngine();
    engine.resetInputs();
    await mountForm();
    await renderOutputs();
  });

  mountPicker();
  await switchCalculator(state.currentKey);
})();
