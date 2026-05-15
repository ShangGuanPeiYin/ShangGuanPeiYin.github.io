(function () {
  const STORAGE_KEY = "yysls_armory_import_data_v2";
  const ACCOUNT_KEY = "yysls_armory_selected_account_v2";

  const slotOrder = ["武器", "环", "佩", "冠胄", "胸甲", "胫甲", "腕甲"];
  const slotIdMap = {
    武器: "1",
    环: "3",
    佩: "4",
    冠胄: "5",
    胸甲: "6",
    胫甲: "7",
    腕甲: "8"
  };
  const weaponTypeMap = {
    "1": "剑",
    "2": "枪",
    "3": "伞",
    "4": "扇",
    "5": "绳标",
    "6": "双刀",
    "7": "陌刀",
    "8": "横刀",
    "9": "拳甲"
  };
  const defaultStatTypes = [
    "最大外功攻击",
    "最小外功攻击",
    "最小无相攻击",
    "最大无相攻击",
    "精准率",
    "会心率",
    "会意率",
    "劲",
    "敏",
    "势",
    "全武学增效",
    "对首领单位增伤",
    "对玩家单位增效",
    "外功穿透",
    "属攻穿透",
    "无相穿透",
    "指定武学技能增伤",
    "单体类奇术增伤",
    "群体类奇术增伤",
    "剑武学增效",
    "枪武学增效",
    "伞武学增效",
    "扇武学增效",
    "绳标武学增效",
    "双刀武学增效",
    "陌刀武学增效",
    "横刀武学增效",
    "拳甲武学增效"
  ];
  const percentStatTypes = new Set([
    "对首领单位增伤",
    "会心率",
    "会意率",
    "精准率",
    "全武学增效",
    "拳甲武学增效",
    "伞武学增效",
    "绳标武学增效",
    "指定武学技能增伤"
  ]);
  const flatStatTypes = new Set([
    "劲",
    "敏",
    "势",
    "属攻穿透",
    "外功穿透",
    "最大鸣金攻击",
    "最大破竹攻击",
    "最大牵丝攻击",
    "最大外功攻击",
    "最大无相攻击",
    "最小裂石攻击",
    "最小鸣金攻击",
    "最小破竹攻击",
    "最小牵丝攻击",
    "最小外功攻击"
  ]);

  const state = {
    rawData: null,
    accounts: [],
    selectedAccount: "",
    selectedSlot: "全部",
    selectedClass: "全部",
    searchText: "",
    editingEquipmentId: null
  };

  const nodes = {
    messageBox: document.getElementById("messageBox"),
    inventoryShell: document.getElementById("inventoryShell"),
    accountSelect: document.getElementById("accountSelect"),
    createAccountButton: document.getElementById("createAccountButton"),
    deleteAccountButton: document.getElementById("deleteAccountButton"),
    openDataModalButton: document.getElementById("openDataModalButton"),
    dataModal: document.getElementById("dataModal"),
    closeDataModalButton: document.getElementById("closeDataModalButton"),
    importTabButton: document.getElementById("importTabButton"),
    accountTabButton: document.getElementById("accountTabButton"),
    importBox: document.getElementById("importBox"),
    accountBox: document.getElementById("accountBox"),
    fileInput: document.getElementById("fileInput"),
    jsonInput: document.getElementById("jsonInput"),
    importStatus: document.getElementById("importStatus"),
    importButton: document.getElementById("importButton"),
    exportButton: document.getElementById("exportButton"),
    downloadButton: document.getElementById("downloadButton"),
    loadSavedButton: document.getElementById("loadSavedButton"),
    clearSavedButton: document.getElementById("clearSavedButton"),
    slotCapsules: document.getElementById("slotCapsules"),
    classFilter: document.getElementById("classFilter"),
    searchInput: document.getElementById("searchInput"),
    resetFiltersButton: document.getElementById("resetFiltersButton"),
    equipmentGrid: document.getElementById("equipmentGrid"),
    equipmentEditorModal: document.getElementById("equipmentEditorModal"),
    equipmentEditorTitle: document.getElementById("equipmentEditorTitle"),
    equipmentEditorForm: document.getElementById("equipmentEditorForm"),
    closeEquipmentEditorButton: document.getElementById("closeEquipmentEditorButton")
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setMessage(text, tone) {
    nodes.messageBox.textContent = text;
    nodes.messageBox.className = `status-banner ${tone}`;
  }

  function setImportStatus(text, tone) {
    if (!nodes.importStatus) return;
    if (!text) {
      nodes.importStatus.textContent = "";
      nodes.importStatus.className = "status-banner info hidden";
      return;
    }
    nodes.importStatus.textContent = text;
    nodes.importStatus.className = `status-banner ${tone}`;
  }

  function setDataModalOpen(open) {
    nodes.dataModal.classList.toggle("hidden", !open);
    syncBodyScroll();
    if (!open) setImportStatus("", "info");
  }

  function setEquipmentEditorOpen(open) {
    nodes.equipmentEditorModal.classList.toggle("hidden", !open);
    if (!open) state.editingEquipmentId = null;
    syncBodyScroll();
  }

  function syncBodyScroll() {
    const hasOpenModal =
      !nodes.dataModal.classList.contains("hidden") ||
      !nodes.equipmentEditorModal.classList.contains("hidden");
    document.body.style.overflow = hasOpenModal ? "hidden" : "";
  }

  function setDataTab(mode) {
    const importActive = mode === "import";
    nodes.importTabButton.classList.toggle("active", importActive);
    nodes.accountTabButton.classList.toggle("active", !importActive);
    nodes.importBox.classList.toggle("hidden", !importActive);
    nodes.accountBox.classList.toggle("hidden", importActive);
  }

  function parseMaybeJson(text) {
    const trimmed = String(text || "").replace(/\u0000/g, "").trim();
    if (!trimmed) return null;
    return JSON.parse(trimmed);
  }

  function detectAccounts(data) {
    const fromList = Array.isArray(data.game_account_list) ? data.game_account_list.filter(Boolean) : [];
    const fromKeys = Object.keys(data)
      .filter((key) => key.startsWith("game_equip_data_"))
      .map((key) => key.replace("game_equip_data_", ""))
      .filter(Boolean);
    return [...new Set([...fromList, ...fromKeys])];
  }

  function ensureDataShape(data) {
    const normalized = typeof structuredClone === "function"
      ? structuredClone(data)
      : JSON.parse(JSON.stringify(data));
    const accounts = detectAccounts(normalized);
    normalized.game_account_list = accounts;

    accounts.forEach((account) => {
      const equipKey = `game_equip_data_${account}`;
      const simKey = `game_sim_data_${account}`;
      if (!Array.isArray(normalized[equipKey])) normalized[equipKey] = [];
      if (!normalized[simKey] || typeof normalized[simKey] !== "object") {
        normalized[simKey] = {
          currentClass: "",
          currentArmory: "",
          loadouts: {}
        };
      }
    });

    return normalized;
  }

  function equipmentCountForAccount(data, account) {
    if (!data || !account) return 0;
    const list = data[`game_equip_data_${account}`];
    return Array.isArray(list) ? list.length : 0;
  }

  function pickPreferredAccount(data, accounts) {
    const savedAccount = localStorage.getItem(ACCOUNT_KEY);
    const candidates = [
      data.last_selected_account,
      savedAccount,
      ...accounts
    ].filter((account, index, list) => account && accounts.includes(account) && list.indexOf(account) === index);

    const accountWithEquipments = candidates.find((account) => equipmentCountForAccount(data, account) > 0);
    if (accountWithEquipments) return accountWithEquipments;

    return candidates[0] || accounts[0] || "";
  }

  function weaponTypeLabel(weaponTypeId) {
    if (!weaponTypeId) return "未标注武器";
    return weaponTypeMap[String(weaponTypeId)] || `武器类型 ${weaponTypeId}`;
  }

  function statText(stat) {
    if (!stat || !stat.type) return "无";
    return `${stat.type} ${stat.value}${stat.isPercent ? "%" : ""}`;
  }

  function slotIdForName(name) {
    return slotIdMap[name] || "";
  }

  function inferPercent(type) {
    const name = String(type || "").trim();
    if (!name) return false;
    if (percentStatTypes.has(name)) return true;
    if (flatStatTypes.has(name)) return false;
    return false;
  }

  function normalizeStat(stat) {
    return {
      type: stat && stat.type ? stat.type : "",
      value: stat && typeof stat.value !== "undefined" ? stat.value : 0,
      isPercent: stat && typeof stat.isPercent === "boolean" ? stat.isPercent : inferPercent(stat && stat.type)
    };
  }

  function collectStatTypes() {
    const values = new Set(defaultStatTypes);
    if (!state.rawData) return [...values];

    Object.keys(state.rawData)
      .filter((key) => key.startsWith("game_equip_data_"))
      .forEach((key) => {
        const list = state.rawData[key];
        if (!Array.isArray(list)) return;
        list.forEach((item) => {
          [item.mainStat, item.dingyinStat, ...(item.subStats || [])].forEach((stat) => {
            if (stat && stat.type) values.add(stat.type);
          });
        });
      });

    return [...values].sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  }

  function collectClassOptions() {
    const values = new Set();
    if (!state.rawData) return [];
    Object.keys(state.rawData)
      .filter((key) => key.startsWith("game_equip_data_"))
      .forEach((key) => {
        const list = state.rawData[key];
        if (!Array.isArray(list)) return;
        list.forEach((item) => {
          (item.availableClasses || []).forEach((name) => {
            if (name) values.add(name);
          });
        });
      });
    return [...values].sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  }

  function findEquipmentById(id) {
    return currentEquipments().find((item) => String(item.id) === String(id)) || null;
  }

  function selectHtmlOptions(values, selectedValue, includeEmpty) {
    const options = includeEmpty ? ['<option value="">未设置</option>'] : [];
    values.forEach((value) => {
      const selected = String(value) === String(selectedValue) ? " selected" : "";
      options.push(`<option value="${escapeHtml(value)}"${selected}>${escapeHtml(value)}</option>`);
    });
    return options.join("");
  }

  function weaponTypeOptionsHtml(selectedValue) {
    const options = ['<option value="">未设置</option>'];
    Object.entries(weaponTypeMap).forEach(([id, name]) => {
      const selected = String(id) === String(selectedValue) ? " selected" : "";
      options.push(`<option value="${escapeHtml(id)}"${selected}>${escapeHtml(name)}</option>`);
    });
    return options.join("");
  }

  function normalizeSubStats(subStats) {
    const normalized = Array.isArray(subStats) ? subStats.map((stat) => normalizeStat(stat)) : [];
    while (normalized.length < 4) normalized.push(normalizeStat(null));
    return normalized.slice(0, 4);
  }

  function renderSubstatRows(subStats) {
    const statTypes = collectStatTypes();
    const rows = normalizeSubStats(subStats)
      .map((stat, index) => {
        const normalized = normalizeStat(stat);
        return `
          <div class="substat-editor-row" data-substat-row="${index}">
            <label class="field">
              <span>副词条 ${index + 1}</span>
              <select name="subType">
                ${selectHtmlOptions(statTypes, normalized.type, true)}
              </select>
            </label>
            <label class="field">
              <span>数值</span>
              <input name="subValue" type="number" step="0.1" value="${escapeHtml(normalized.value)}" />
            </label>
            <button class="secondary editor-inline-action" type="button" data-clear-substat="${index}">清空</button>
          </div>
        `;
      })
      .join("");

    return rows;
  }

  function renderClassDropdown(selectedValues) {
    const options = collectClassOptions();
    const selectedSet = new Set(selectedValues || []);
    const summaryText = selectedSet.size ? [...selectedSet].join("、") : "选择适用流派";
    const optionHtml = options.length
      ? options
          .map((name) => `
            <label class="editor-class-option">
              <input type="checkbox" value="${escapeHtml(name)}" ${selectedSet.has(name) ? "checked" : ""} />
              <span>${escapeHtml(name)}</span>
            </label>
          `)
          .join("")
      : '<div class="subtle">当前数据里还没有可选流派。</div>';

    return `
      <details class="editor-class-dropdown" id="editorClassesDropdown">
        <summary id="editorClassesSummary">${escapeHtml(summaryText)}</summary>
        <div class="editor-class-menu">
          ${optionHtml}
          <label class="field" style="margin-top: 8px;">
            <span>新增流派</span>
            <input id="editorNewClassInput" type="text" placeholder="输入新流派后回车" />
          </label>
        </div>
      </details>
    `;
  }

  function mountEquipmentEditor(item) {
    const statTypes = collectStatTypes();
    const mainStat = normalizeStat(item.mainStat);
    const dingyinStat = normalizeStat(item.dingyinStat);

    nodes.equipmentEditorTitle.textContent = `编辑装备 · ${item.name || "未命名装备"}`;
    nodes.equipmentEditorForm.innerHTML = `
      <div class="editor-grid">
        <label class="field">
          <span>装备备注名</span>
          <input id="editorName" type="text" value="${escapeHtml(item.name || "")}" />
        </label>
        <label class="field">
          <span>部位</span>
          <select id="editorSlotName">
            ${selectHtmlOptions(slotOrder, item.slotName || "", false)}
          </select>
        </label>
      </div>

      <div class="editor-grid">
        <label class="field" id="editorWeaponTypeField">
          <span>武器类型</span>
          <select id="editorWeaponTypeId">
            ${weaponTypeOptionsHtml(item.weaponTypeId || "")}
          </select>
        </label>
        <label class="field">
          <span>适用流派</span>
          ${renderClassDropdown(item.availableClasses || [])}
        </label>
        <div class="editor-status-field">
          <span>装备状态</span>
          <div class="editor-toggle-row">
            <label class="editor-check">
              <input id="editorIsChengyin" type="checkbox" ${item.isChengyin ? "checked" : ""} />
              <span>已承音</span>
            </label>
            <label class="editor-check">
              <input id="editorIsPurple" type="checkbox" ${item.isPurple ? "checked" : ""} />
              <span>紫装</span>
            </label>
          </div>
        </div>
      </div>

      <div class="editor-grid">
        <section class="editor-stat-card">
          <h3>主词条</h3>
          <label class="field">
            <span>词条类型</span>
            <select id="editorMainType">
              ${selectHtmlOptions(statTypes, mainStat.type, false)}
            </select>
          </label>
          <div class="editor-grid">
            <label class="field">
              <span>数值</span>
              <input id="editorMainValue" type="number" step="0.1" value="${escapeHtml(mainStat.value)}" />
            </label>
          </div>
        </section>

        <section class="editor-stat-card">
          <h3>定音词条</h3>
          <label class="field">
            <span>词条类型</span>
            <select id="editorDingyinType">
              ${selectHtmlOptions(statTypes, dingyinStat.type, true)}
            </select>
          </label>
          <div class="editor-grid">
            <label class="field">
              <span>数值</span>
              <input id="editorDingyinValue" type="number" step="0.1" value="${escapeHtml(dingyinStat.value)}" />
            </label>
          </div>
        </section>
      </div>

      <section class="editor-substats">
        <div class="section-head">
        </div>
        <div id="substatEditorRows">${renderSubstatRows(item.subStats || [])}</div>
      </section>

      <div class="editor-footer">
        <button class="danger" id="deleteEquipmentButton" type="button">删除这件装备</button>
      </div>
    `;

    const weaponField = document.getElementById("editorWeaponTypeField");
    const slotSelect = document.getElementById("editorSlotName");
    const substatRows = document.getElementById("substatEditorRows");
    const classesDropdown = document.getElementById("editorClassesDropdown");
    const classesSummary = document.getElementById("editorClassesSummary");
    const newClassInput = document.getElementById("editorNewClassInput");

    function syncWeaponField() {
      weaponField.classList.toggle("hidden", slotSelect.value !== "武器");
    }

    function syncClassSummary() {
      const selected = Array.from(classesDropdown.querySelectorAll('input[type="checkbox"]:checked')).map((input) => input.value);
      classesSummary.textContent = selected.length ? selected.join("、") : "选择适用流派";
    }

    function bindSubstatRowActions() {
      substatRows.querySelectorAll("[data-clear-substat]").forEach((button) => {
        button.addEventListener("click", () => {
          const row = button.closest(".substat-editor-row");
          if (row) {
            row.querySelector('[name="subType"]').value = "";
            row.querySelector('[name="subValue"]').value = "0";
            saveEquipmentEdit(item.id, { closeAfterSave: false });
          }
        });
      });
    }

    function bindAutoSave() {
      nodes.equipmentEditorForm.querySelectorAll("input, select").forEach((control) => {
        if (control.id === "editorNewClassInput") return;
        const eventName =
          control.tagName === "SELECT" || control.type === "checkbox" ? "change" : "input";
        control.addEventListener(eventName, () => {
          saveEquipmentEdit(item.id, { closeAfterSave: false });
        });
      });
    }

    slotSelect.addEventListener("change", syncWeaponField);
    syncWeaponField();
    classesDropdown.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.addEventListener("change", syncClassSummary);
    });
    syncClassSummary();

    newClassInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      const value = newClassInput.value.trim();
      if (!value) return;

      const exists = Array.from(classesDropdown.querySelectorAll('input[type="checkbox"]')).some((input) => input.value === value);
      if (!exists) {
        const label = document.createElement("label");
        label.className = "editor-class-option";
        label.innerHTML = `
          <input type="checkbox" value="${escapeHtml(value)}" checked />
          <span>${escapeHtml(value)}</span>
        `;
        newClassInput.closest(".field").before(label);
        const checkbox = label.querySelector('input[type="checkbox"]');
        checkbox.addEventListener("change", syncClassSummary);
      } else {
        classesDropdown.querySelectorAll('input[type="checkbox"]').forEach((input) => {
          if (input.value === value) input.checked = true;
        });
      }

      newClassInput.value = "";
      syncClassSummary();
      saveEquipmentEdit(item.id, { closeAfterSave: false });
    });

    document.getElementById("deleteEquipmentButton").addEventListener("click", () => {
      if (window.confirm("确定要删除这件装备吗？此操作会直接写入当前浏览器缓存。")) {
        deleteEquipment(item.id);
        setEquipmentEditorOpen(false);
      }
    });

    bindSubstatRowActions();
    bindAutoSave();
  }

  function openEquipmentEditor(id) {
    const item = findEquipmentById(id);
    if (!item) {
      setMessage("没有找到这件装备，可能它已经被删除。", "warn");
      return;
    }
    state.editingEquipmentId = String(id);
    mountEquipmentEditor(item);
    setEquipmentEditorOpen(true);
  }

  function readEditorStat(typeId, valueId) {
    const type = document.getElementById(typeId).value;
    return {
      type,
      value: Number(document.getElementById(valueId).value || 0),
      isPercent: inferPercent(type)
    };
  }

  function saveEquipmentEdit(id, options = {}) {
    const { closeAfterSave = true } = options;
    if (!state.rawData || !state.selectedAccount) return;
    const equipKey = `game_equip_data_${state.selectedAccount}`;
    const list = currentEquipments();
    const index = list.findIndex((item) => String(item.id) === String(id));
    if (index < 0) return;

    const slotName = document.getElementById("editorSlotName").value;
    const weaponRaw = document.getElementById("editorWeaponTypeId").value;
    const weaponTypeId = slotName === "武器" ? String(weaponRaw || "") || null : null;
    const classes = Array.from(document.querySelectorAll('#editorClassesDropdown input[type="checkbox"]:checked'))
      .map((input) => input.value)
      .filter(Boolean);

    const subStats = Array.from(document.querySelectorAll("#substatEditorRows .substat-editor-row"))
      .map((row) => ({
        type: row.querySelector('[name="subType"]').value,
        value: Number(row.querySelector('[name="subValue"]').value || 0),
        isPercent: inferPercent(row.querySelector('[name="subType"]').value)
      }))
      .slice(0, 4);

    const updatedItem = {
      ...list[index],
      name: document.getElementById("editorName").value.trim() || "未命名装备",
      slotName,
      slotId: slotIdForName(slotName),
      weaponTypeId,
      isChengyin: document.getElementById("editorIsChengyin").checked,
      isPurple: document.getElementById("editorIsPurple").checked,
      availableClasses: classes,
      mainStat: readEditorStat("editorMainType", "editorMainValue"),
      dingyinStat: readEditorStat("editorDingyinType", "editorDingyinValue"),
      subStats
    };

    state.rawData[equipKey] = [...list];
    state.rawData[equipKey][index] = updatedItem;
    saveRawData();
    renderAll();
    if (closeAfterSave) setEquipmentEditorOpen(false);
  }

  function currentEquipments() {
    if (!state.rawData || !state.selectedAccount) return [];
    return Array.isArray(state.rawData[`game_equip_data_${state.selectedAccount}`])
      ? state.rawData[`game_equip_data_${state.selectedAccount}`]
      : [];
  }

  function saveRawData() {
    if (!state.rawData) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.rawData));
    localStorage.setItem(ACCOUNT_KEY, state.selectedAccount);
  }

  function fillSelect(node, values, selectedValue) {
    node.innerHTML = "";
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      node.appendChild(option);
    });
    node.value = values.includes(selectedValue) ? selectedValue : values[0] || "";
  }

  function renderAccountOptions() {
    if (!state.accounts.length) {
      nodes.accountSelect.innerHTML = '<option value="">暂无角色</option>';
      return;
    }

    fillSelect(nodes.accountSelect, state.accounts, state.selectedAccount);
  }

  function buildFilterOptions() {
    const equipments = currentEquipments();
    const classes = [...new Set(equipments.flatMap((item) => item.availableClasses || []).filter(Boolean))];

    fillSelect(nodes.classFilter, ["全部", ...classes], state.selectedClass);
    state.selectedClass = nodes.classFilter.value || "全部";
  }

  function filteredEquipments() {
    return currentEquipments().filter((item) => {
      const matchSlot = state.selectedSlot === "全部" || item.slotName === state.selectedSlot;
      const matchClass =
        state.selectedClass === "全部" ||
        (Array.isArray(item.availableClasses) && item.availableClasses.includes(state.selectedClass));
      const search = state.searchText.trim().toLowerCase();
      const matchSearch = !search || String(item.name || "").toLowerCase().includes(search);
      return matchSlot && matchClass && matchSearch;
    });
  }

  function renderSlotCapsules() {
    const equipments = currentEquipments();
    const slotCounts = equipments.reduce((acc, item) => {
      const key = item.slotName || "未分类";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const renderOrder = ["全部", ...slotOrder];
    const fallback = Object.keys(slotCounts).filter((slot) => !slotOrder.includes(slot));
    const labels = [...renderOrder, ...fallback];

    nodes.slotCapsules.innerHTML = labels
      .map((label) => {
        const isActive = label === state.selectedSlot;
        const count = label === "全部" ? equipments.length : slotCounts[label] || 0;
        return `
          <button class="capsule ${isActive ? "active" : ""}" type="button" data-slot="${escapeHtml(label)}">
            <span>${escapeHtml(label)}</span>
            <strong>${count}</strong>
          </button>
        `;
      })
      .join("");

    nodes.slotCapsules.querySelectorAll("[data-slot]").forEach((node) => {
      node.addEventListener("click", () => {
        state.selectedSlot = node.getAttribute("data-slot") || "全部";
        renderInventory();
      });
    });

  }

  function renderEmptyEquipmentCard(text) {
    nodes.equipmentGrid.innerHTML = `
      <article class="equipment-card">
        <div class="equipment-card-title">
          <strong>无</strong>
          <div class="pill-row">
            <span class="pill">当前没有装备</span>
          </div>
        </div>
        <div class="data-block">
          <span class="label">说明</span>
          <strong>${escapeHtml(text)}</strong>
        </div>
      </article>
    `;
  }

  function renderEquipmentCard(item) {
    const subStats = (item.subStats || [])
      .map(
        (stat) => `
          <div class="substat-chip">
            <span>${escapeHtml(stat.type || "未知词条")}</span>
            <strong>${escapeHtml(stat.value)}${stat.isPercent ? "%" : ""}</strong>
          </div>
        `
      )
      .join("");

    const weaponBadge =
      item.slotName === "武器" ? `<span class="pill">${escapeHtml(weaponTypeLabel(item.weaponTypeId))}</span>` : "";

    return `
      <article class="equipment-card">
        <div class="equipment-card-top">
          <div class="equipment-card-title">
            <strong>${escapeHtml(item.name || "未命名装备")}</strong>
            <div class="pill-row">
              <span class="pill">${escapeHtml(item.slotName || "未知部位")}</span>
              ${weaponBadge}
              ${item.isChengyin ? '<span class="pill gold">承音</span>' : ""}
              ${item.isPurple ? '<span class="pill">紫装</span>' : ""}
            </div>
          </div>
        </div>

        <div class="data-grid">
          <div class="data-block">
            <span class="label">主词条</span>
            <strong>${escapeHtml(statText(item.mainStat))}</strong>
          </div>
          <div class="data-block">
            <span class="label">定音词条</span>
            <strong>${escapeHtml(statText(item.dingyinStat))}</strong>
          </div>
        </div>

        <div class="data-block">
          <span class="label">副词条</span>
          <div class="substats">${subStats || '<div class="substat-chip"><span>无副词条</span><strong>-</strong></div>'}</div>
        </div>

        <div class="card-actions">
          <button class="secondary" type="button" data-edit-id="${escapeHtml(item.id)}">编辑装备</button>
          <button class="danger" type="button" data-delete-id="${escapeHtml(item.id)}">删除装备</button>
        </div>
      </article>
    `;
  }

  function deleteEquipment(id) {
    if (!state.rawData || !state.selectedAccount) return;
    const equipKey = `game_equip_data_${state.selectedAccount}`;
    const current = currentEquipments();
    state.rawData[equipKey] = current.filter((item) => String(item.id) !== String(id));
    saveRawData();
    renderAll();
    setMessage("装备已从当前角色的装备库中移除。", "info");
  }

  function renderEquipmentGrid() {
    const equipments = filteredEquipments();
    const current = currentEquipments();

    if (!current.length) {
      renderEmptyEquipmentCard("当前角色还没有装备，你可以先导入 JSON，或者新建角色后再慢慢维护。");
      return;
    }

    if (!equipments.length) {
      renderEmptyEquipmentCard("当前筛选条件下没有装备。");
      return;
    }

    nodes.equipmentGrid.innerHTML = equipments.map((item) => renderEquipmentCard(item)).join("");
    nodes.equipmentGrid.querySelectorAll("[data-edit-id]").forEach((node) => {
      node.addEventListener("click", () => {
        const equipId = node.getAttribute("data-edit-id");
        if (equipId) openEquipmentEditor(equipId);
      });
    });
    nodes.equipmentGrid.querySelectorAll("[data-delete-id]").forEach((node) => {
      node.addEventListener("click", (event) => {
        event.stopPropagation();
        const equipId = node.getAttribute("data-delete-id");
        if (!equipId) return;
        if (window.confirm("确定要删除这件装备吗？此操作会直接写入当前浏览器缓存。")) {
          deleteEquipment(equipId);
        }
      });
    });
  }

  function renderInventory() {
    buildFilterOptions();
    renderSlotCapsules();
    renderEquipmentGrid();
  }

  function renderAll() {
    renderAccountOptions();

    if (!state.accounts.length || !state.selectedAccount) {
      buildFilterOptions();
      renderSlotCapsules();
      renderEquipmentGrid();
      return;
    }

    renderInventory();
  }

  function loadImportedPayload(data) {
    const normalized = ensureDataShape(data);
    const accounts = normalized.game_account_list || [];
    if (!accounts.length) {
      setMessage("导入成功，但没有识别到角色。请确认 JSON 中包含 game_account_list 或 game_equip_data_账号名。", "warn");
      setImportStatus("导入失败：没有识别到角色。", "warn");
      return;
    }

    state.rawData = normalized;
    state.accounts = accounts;
    state.selectedAccount = pickPreferredAccount(normalized, accounts);
    state.selectedSlot = "全部";
    state.selectedClass = "全部";
    state.searchText = "";
    if (nodes.searchInput) nodes.searchInput.value = "";
    saveRawData();
    renderAll();
    setMessage(`已载入 ${state.selectedAccount} 的装备数据，共识别 ${accounts.length} 个角色。`, "info");
    setImportStatus("导入成功。", "info");
  }

  function handleImportText(text) {
    try {
      const data = parseMaybeJson(text);
      if (!data || typeof data !== "object") throw new Error("JSON 为空或格式不正确");
      loadImportedPayload(data);
    } catch (error) {
      setMessage(`导入失败：${error.message}`, "warn");
      setImportStatus(`导入失败：${error.message}`, "warn");
    }
  }

  function createAccount() {
    if (!state.rawData) {
      state.rawData = { game_account_list: [] };
    }

    const name = window.prompt("输入新角色名称");
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (state.accounts.includes(trimmed)) {
      setMessage("这个角色名已经存在了。", "warn");
      return;
    }

    state.rawData.game_account_list = [...(state.rawData.game_account_list || []), trimmed];
    state.rawData[`game_equip_data_${trimmed}`] = [];
    state.rawData[`game_sim_data_${trimmed}`] = {
      currentClass: "",
      currentArmory: "",
      loadouts: {}
    };
    state.rawData.last_selected_account = trimmed;
    state.accounts = detectAccounts(state.rawData);
    state.selectedAccount = trimmed;
    saveRawData();
    renderAll();
    setMessage(`已创建角色 ${trimmed}。当前角色为空装备库，可以继续导入或手动维护。`, "info");
  }

  function deleteAccount() {
    if (!state.selectedAccount || !state.rawData) return;
    if (!window.confirm(`确定要删除角色 ${state.selectedAccount} 吗？这会移除该角色的本地装备数据。`)) return;

    const target = state.selectedAccount;
    delete state.rawData[`game_equip_data_${target}`];
    delete state.rawData[`game_sim_data_${target}`];
    state.rawData.game_account_list = (state.rawData.game_account_list || []).filter((name) => name !== target);
    state.accounts = detectAccounts(state.rawData);
    state.selectedAccount = state.accounts[0] || "";
    state.rawData.last_selected_account = state.selectedAccount || "";
    saveRawData();
    renderAll();
    setMessage(target ? `已删除角色 ${target}。` : "已删除角色。", "info");
  }

  function exportCurrentData() {
    if (!state.rawData) {
      setMessage("当前没有可导出的数据。", "warn");
      return;
    }
    nodes.jsonInput.value = JSON.stringify(state.rawData, null, 2);
    setDataModalOpen(true);
    setDataTab("import");
    setMessage("已把当前数据展开到文本框，你可以复制或继续下载为文件。", "info");
  }

  function downloadCurrentData() {
    if (!state.rawData) {
      setMessage("当前没有可下载的数据。", "warn");
      return;
    }
    const blob = new Blob([JSON.stringify(state.rawData, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.selectedAccount || "yysls-armory"}-data.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  nodes.accountSelect.addEventListener("change", () => {
    state.selectedAccount = nodes.accountSelect.value;
    if (state.rawData) state.rawData.last_selected_account = state.selectedAccount;
    saveRawData();
    renderAll();
  });

  nodes.createAccountButton.addEventListener("click", () => {
    createAccount();
  });

  nodes.deleteAccountButton.addEventListener("click", () => {
    deleteAccount();
  });

  nodes.openDataModalButton.addEventListener("click", () => {
    setImportStatus("", "info");
    setDataModalOpen(true);
    setDataTab("import");
  });

  nodes.closeDataModalButton.addEventListener("click", () => {
    setDataModalOpen(false);
  });

  nodes.dataModal.addEventListener("click", (event) => {
    if (event.target === nodes.dataModal) setDataModalOpen(false);
  });

  nodes.closeEquipmentEditorButton.addEventListener("click", () => {
    setEquipmentEditorOpen(false);
  });

  nodes.equipmentEditorModal.addEventListener("click", (event) => {
    if (event.target === nodes.equipmentEditorModal) setEquipmentEditorOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!nodes.equipmentEditorModal.classList.contains("hidden")) setEquipmentEditorOpen(false);
    if (!nodes.dataModal.classList.contains("hidden")) setDataModalOpen(false);
  });

  nodes.importTabButton.addEventListener("click", () => {
    setDataTab("import");
  });

  nodes.accountTabButton.addEventListener("click", () => {
    setDataTab("account");
  });

  nodes.fileInput.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      nodes.jsonInput.value = text;
      setImportStatus("", "info");
      handleImportText(text);
    } catch (error) {
      setMessage(`读取文件失败：${error.message}`, "warn");
      setImportStatus(`读取文件失败：${error.message}`, "warn");
    }
  });

  nodes.importButton.addEventListener("click", () => {
    const text = nodes.jsonInput.value.trim();
    if (!text) {
      setMessage("先粘贴 JSON，或者上传文件。", "warn");
      setImportStatus("导入失败：先粘贴 JSON，或者上传文件。", "warn");
      return;
    }
    handleImportText(text);
  });

  nodes.exportButton.addEventListener("click", () => {
    exportCurrentData();
  });

  nodes.downloadButton.addEventListener("click", () => {
    downloadCurrentData();
  });

  nodes.loadSavedButton.addEventListener("click", () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setMessage("当前浏览器里还没有保存过装备数据。", "warn");
      return;
    }
    nodes.jsonInput.value = saved;
    handleImportText(saved);
  });

  nodes.clearSavedButton.addEventListener("click", () => {
    if (!window.confirm("确定要清空当前浏览器里的装备缓存吗？")) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACCOUNT_KEY);
    state.rawData = null;
    state.accounts = [];
    state.selectedAccount = "";
    state.selectedSlot = "全部";
    state.selectedClass = "全部";
    state.searchText = "";
    nodes.jsonInput.value = "";
    nodes.searchInput.value = "";
    renderAll();
    setMessage("浏览器缓存已清空。你可以重新导入 JSON，或新建一个空角色继续维护。", "info");
  });

  nodes.classFilter.addEventListener("change", () => {
    state.selectedClass = nodes.classFilter.value;
    renderInventory();
  });

  nodes.searchInput.addEventListener("input", () => {
    state.searchText = nodes.searchInput.value;
    renderInventory();
  });

  nodes.resetFiltersButton.addEventListener("click", () => {
    state.selectedSlot = "全部";
    state.selectedClass = "全部";
    state.searchText = "";
    nodes.searchInput.value = "";
    renderInventory();
  });

  async function init() {
    setDataModalOpen(false);
    setEquipmentEditorOpen(false);
    setDataTab("import");
    fillSelect(nodes.classFilter, ["全部"], "全部");
    renderAll();

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      nodes.jsonInput.value = saved;
      try {
        loadImportedPayload(parseMaybeJson(saved));
        return;
      } catch (error) {
        setMessage(`发现旧缓存，但解析失败：${error.message}`, "warn");
      }
    }

    setMessage("当前浏览器里还没有装备数据，请打开数据工具导入 JSON，或先新建一个空角色。", "info");
  }

  init();
})();
