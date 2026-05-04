(async function () {
  const inputGroups = [
    {
      title: "战斗环境",
      compact: true,
      fields: [
        { cell: "C2", label: "释放奇术时主属性", type: "select", options: ["外功", "鸣金", "裂石", "牵丝", "破竹", "无相"] },
        { cell: "F7", label: "目标", type: "select", optionsFromTargetSheet: true }
      ]
    },
    {
      title: "状态开关",
      checks: true,
      fields: [
        { cell: "H3", label: "断石之构", type: "check" },
        { cell: "I3", label: "三穷致知", type: "check" },
        { cell: "J3", label: "易水歌", type: "check" },
        { cell: "I5", label: "玉鳞脍", type: "check" },
        { cell: "F19", label: "沧海帖", type: "check" },
        { cell: "G19", label: "行藏帖", type: "check" },
        { cell: "F21", label: "相杀瘫痪", type: "check" }
      ]
    },
    {
      title: "外功与目标",
      fields: [
        { cell: "B5", label: "最小外功攻击", type: "number", step: "0.1" },
        { cell: "C5", label: "最大外功攻击", type: "number", step: "0.1" },
        { cell: "D5", label: "外功穿透", type: "number", step: "0.1" },
        { cell: "G5", label: "套装", type: "select", options: ["无", "撼天", "飞隼", "时雨"] },
        { cell: "H5", label: "天工", type: "select", options: ["无", "火", "毒"] },
        { cell: "E7", label: "鸣金伤害加成", type: "number", step: "0.001" },
        { cell: "E9", label: "裂石伤害加成", type: "number", step: "0.001" },
        { cell: "E11", label: "牵丝伤害加成", type: "number", step: "0.001" }
      ]
    },
    {
      title: "破竹与无相",
      fields: [
        { cell: "B13", label: "最小破竹攻击", type: "number", step: "0.1" },
        { cell: "C13", label: "最大破竹攻击", type: "number", step: "0.1" },
        { cell: "D13", label: "破竹穿透", type: "number", step: "0.1" },
        { cell: "E13", label: "破竹伤害加成", type: "number", step: "0.001" },
        { cell: "B15", label: "最小无相攻击", type: "number", step: "0.1" },
        { cell: "C15", label: "最大无相攻击", type: "number", step: "0.1" },
        { cell: "E15", label: "固伤加成", type: "number", step: "0.001" },
        { cell: "G15", label: "拳攻击期望", type: "number", step: "0.01" }
      ]
    },
    {
      title: "双暴与增伤",
      fields: [
        { cell: "G3", label: "蓄力增伤", type: "number", step: "0.001" },
        { cell: "C16", label: "精准率", type: "number", step: "0.0001" },
        { cell: "C17", label: "会心率", type: "number", step: "0.0001" },
        { cell: "C18", label: "会意率", type: "number", step: "0.0001" },
        { cell: "E18", label: "首领增伤", type: "number", step: "0.001" },
        { cell: "G21", label: "易伤层数", type: "number", step: "1" }
      ]
    },
    {
      title: "武器与奇术增伤",
      fields: [
        { cell: "C22", label: "拳甲增伤", type: "number", step: "0.001" },
        { cell: "C23", label: "绳标增伤", type: "number", step: "0.001" },
        { cell: "E23", label: "拳蓄力增伤", type: "number", step: "0.001" },
        { cell: "C24", label: "全武器增伤", type: "number", step: "0.001" },
        { cell: "C25", label: "单体奇术增伤", type: "number", step: "0.001" },
        { cell: "C26", label: "群体奇术增伤", type: "number", step: "0.001" }
      ]
    }
  ];

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

  const compareRows = Array.from({ length: 25 }, (_, index) => ({
    labelCell: `L${index + 2}`,
    currentA: `M${index + 2}`,
    currentB: `N${index + 2}`,
    compareA: `O${index + 2}`,
    compareB: `P${index + 2}`
  }));

  const workbook = await fetch("/tools/yysls-graduation/workbook-data.json").then((r) => r.json());
  const sheets = workbook.sheets;
  const defaultInputs = {};
  const formulas = {};
  const cache = new Map();
  const compiled = new Map();

  Object.entries(sheets).forEach(([sheetName, sheetData]) => {
    Object.entries(sheetData.cells).forEach(([coord, payload]) => {
      const key = `${sheetName}!${coord}`;
      if (Object.prototype.hasOwnProperty.call(payload, "f")) {
        formulas[key] = payload.f;
      } else {
        defaultInputs[key] = payload.v;
      }
    });
  });

  const targetOptions = Object.entries(sheets["目标属性"].cells)
    .filter(([coord, payload]) => coord.startsWith("A") && coord !== "A1" && Object.prototype.hasOwnProperty.call(payload, "v"))
    .map(([, payload]) => payload.v);

  function colToNumber(col) {
    let value = 0;
    for (const char of col) value = value * 26 + (char.charCodeAt(0) - 64);
    return value;
  }

  function numberToCol(value) {
    let n = value;
    let result = "";
    while (n > 0) {
      const mod = (n - 1) % 26;
      result = String.fromCharCode(65 + mod) + result;
      n = Math.floor((n - 1) / 26);
    }
    return result;
  }

  function splitRef(ref) {
    const match = /^([A-Z]+)(\d+)$/.exec(ref);
    return { col: match[1], row: Number(match[2]) };
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return value;
    if (typeof value === "boolean") return value ? 1 : 0;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function currentValue(key) {
    if (Object.prototype.hasOwnProperty.call(state.inputs, key)) return state.inputs[key];
    return Object.prototype.hasOwnProperty.call(defaultInputs, key) ? defaultInputs[key] : 0;
  }

  function getCell(sheetName, coord) {
    const key = `${sheetName}!${coord}`;
    if (cache.has(key)) return cache.get(key);
    let value;
    if (Object.prototype.hasOwnProperty.call(formulas, key)) {
      value = evaluateFormula(sheetName, coord, formulas[key]);
    } else {
      value = currentValue(key);
    }
    cache.set(key, value);
    return value;
  }

  function buildRange(sheetName, startRef, endRef) {
    const start = splitRef(startRef);
    const end = splitRef(endRef);
    const rows = [];
    for (let row = start.row; row <= end.row; row += 1) {
      const cols = [];
      for (let col = colToNumber(start.col); col <= colToNumber(end.col); col += 1) {
        cols.push(getCell(sheetName, `${numberToCol(col)}${row}`));
      }
      rows.push(cols);
    }
    return rows;
  }

  function buildColumnRange(sheetName, startCol, endCol) {
    const bounds = sheets[sheetName].bounds;
    const rows = [];
    for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
      const cols = [];
      for (let col = colToNumber(startCol); col <= colToNumber(endCol); col += 1) {
        cols.push(getCell(sheetName, `${numberToCol(col)}${row}`));
      }
      rows.push(cols);
    }
    return rows;
  }

  const fn = {
    IF(condition, yesValue, noValue) {
      return condition ? yesValue : noValue;
    },
    VLOOKUP(lookupValue, table, columnIndex) {
      for (const row of table) {
        if (row[0] === lookupValue) return row[columnIndex - 1];
      }
      return 0;
    },
    MAX(...values) {
      return Math.max(...values.flat(Infinity).map(toNumber));
    },
    MIN(...values) {
      return Math.min(...values.flat(Infinity).map(toNumber));
    },
    AND(...values) {
      return values.every(Boolean);
    },
    OR(...values) {
      return values.some(Boolean);
    },
    SUM(...values) {
      return values.flat(Infinity).reduce((sum, value) => sum + toNumber(value), 0);
    }
  };

  function protectStrings(expression) {
    const strings = [];
    const protectedExpr = expression.replace(/"([^"]*)"/g, (match) => {
      const token = `__STR${strings.length}__`;
      strings.push(match);
      return token;
    });
    return { protectedExpr, strings };
  }

  function restoreStrings(expression, strings) {
    return expression.replace(/__STR(\d+)__/g, (_, index) => strings[Number(index)]);
  }

  function compileFormula(sheetName, formula) {
    const cacheKey = `${sheetName}|${formula}`;
    if (compiled.has(cacheKey)) return compiled.get(cacheKey);

    let expr = formula.slice(1);
    const protectedData = protectStrings(expr);
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
    expr = restoreStrings(expr, protectedData.strings);

    const factory = new Function("__GET", "__RANGE", "__COLRANGE", "fn", `return (${expr});`);
    compiled.set(cacheKey, factory);
    return factory;
  }

  function evaluateFormula(sheetName, coord, formula) {
    const runner = compileFormula(sheetName, formula);
    return runner(getCell, buildRange, buildColumnRange, fn);
  }

  const state = { inputs: {} };

  function workbookKey(cell) {
    return `期望!${cell}`;
  }

  function inputValue(cell) {
    return currentValue(workbookKey(cell));
  }

  function boolToMark(value) {
    return value ? "√" : "×";
  }

  function markToBool(value) {
    return value === "√";
  }

  function resetState() {
    state.inputs = {};
    cache.clear();
  }

  function mountForm() {
    const mount = document.getElementById("formMount");
    mount.innerHTML = "";

    inputGroups.forEach((group) => {
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
          input.checked = markToBool(inputValue(field.cell));
          input.addEventListener("change", () => {
            state.inputs[workbookKey(field.cell)] = boolToMark(input.checked);
            cache.clear();
            renderOutputs();
          });
          label.appendChild(input);
          label.appendChild(document.createTextNode(field.label));
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
          caption.textContent = `${field.label} (${field.cell})`;
          label.appendChild(caption);

          let input;
          if (field.type === "select") {
            input = document.createElement("select");
            const options = field.optionsFromTargetSheet ? targetOptions : field.options;
            options.forEach((optionValue) => {
              const option = document.createElement("option");
              option.value = optionValue;
              option.textContent = optionValue;
              input.appendChild(option);
            });
            input.value = inputValue(field.cell);
          } else {
            input = document.createElement("input");
            input.type = field.type;
            if (field.step) input.step = field.step;
            input.value = inputValue(field.cell);
          }

          input.addEventListener("input", () => {
            state.inputs[workbookKey(field.cell)] = field.type === "number" ? Number(input.value || 0) : input.value;
            cache.clear();
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
        如果你需要复刻 Excel 的装备对比逻辑，可以直接在这里填。
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
      const labelValue = getCell("期望", row.labelCell);
      const line = document.createElement("div");
      line.className = "kv-item";

      const left = document.createElement("span");
      left.textContent = labelValue || row.labelCell;
      line.appendChild(left);

      const right = document.createElement("span");
      right.style.display = "grid";
      right.style.gridTemplateColumns = "repeat(4,minmax(68px,88px))";
      right.style.gap = "8px";

      [row.currentA, row.currentB, row.compareA, row.compareB].forEach((cell) => {
        const input = document.createElement("input");
        input.type = "number";
        input.step = "0.01";
        input.value = inputValue(cell) || "";
        input.style.padding = "8px 10px";
        input.addEventListener("input", () => {
          state.inputs[workbookKey(cell)] = input.value === "" ? 0 : Number(input.value);
          cache.clear();
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

  function formatValue(value, decimals = 4) {
    if (typeof value === "number") {
      const abs = Math.abs(value);
      if (abs >= 1000) return value.toFixed(2);
      if (abs >= 1) return value.toFixed(Math.min(decimals, 3));
      return value.toFixed(decimals);
    }
    return String(value);
  }

  function renderEcho() {
    const mount = document.getElementById("echoMount");
    mount.innerHTML = "";
    echoCells.forEach(([cell, label]) => {
      const item = document.createElement("div");
      item.className = "kv-item";
      item.innerHTML = `<span>${label}</span><span>${formatValue(getCell("期望", cell))}</span>`;
      mount.appendChild(item);
    });
  }

  function renderOutputs() {
    const graduation = getCell("期望", "C40");
    const totalDamage = getCell("期望", "C30");
    const dps = getCell("期望", "C35");
    const compareDelta = getCell("期望", "Q2");
    const target = getCell("期望", "F7");
    const fightTime = getCell("期望", "C28");

    document.getElementById("graduationRate").textContent = `${(toNumber(graduation) * 100).toFixed(2)}%`;
    document.getElementById("mainSheetStatus").textContent = "当前读取：期望页输出格";
    document.getElementById("targetName").textContent = `目标：${target}`;
    document.getElementById("totalDamage").textContent = formatValue(totalDamage, 2);
    document.getElementById("dpsValue").textContent = formatValue(dps, 2);
    document.getElementById("fightTimeResult").textContent = formatValue(fightTime, 1);
    document.getElementById("compareDelta").textContent = `${(toNumber(compareDelta) * 100).toFixed(2)}%`;
    document.getElementById("engineNote").textContent =
      "公式引擎已接管当前页面。这里只要填写的是工作簿同一批输入格，网页计算结果就会和 Excel 主计算页一致。";

    renderEcho();
  }

  document.getElementById("resetDefaults").addEventListener("click", () => {
    resetState();
    mountForm();
    renderOutputs();
  });

  mountForm();
  renderOutputs();
})();
