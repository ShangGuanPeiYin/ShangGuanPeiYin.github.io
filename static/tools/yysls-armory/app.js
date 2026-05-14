(function () {
  const STORAGE_KEY = "yysls_armory_import_data_v2";
  const ACCOUNT_KEY = "yysls_armory_selected_account_v2";

  const slotOrder = ["武器", "环", "佩", "冠胄", "胸甲", "胫甲", "腕甲"];
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

  const state = {
    rawData: null,
    accounts: [],
    selectedAccount: "",
    selectedSlot: "全部",
    selectedClass: "全部",
    searchText: ""
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
    equipmentGrid: document.getElementById("equipmentGrid")
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
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) setImportStatus("", "info");
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

    const classes = (item.availableClasses || [])
      .map((name) => `<span class="pill teal">${escapeHtml(name)}</span>`)
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
              <span class="pill">ID ${escapeHtml(item.id)}</span>
              ${item.isChengyin ? '<span class="pill gold">承音</span>' : ""}
              ${item.isPurple ? '<span class="pill">紫装</span>' : ""}
            </div>
          </div>
          <div class="pill-row">${classes || '<span class="pill teal">未标注流派</span>'}</div>
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
          <span class="ghost-text">部位：${escapeHtml(item.slotName || "未分类")}</span>
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
    nodes.equipmentGrid.querySelectorAll("[data-delete-id]").forEach((node) => {
      node.addEventListener("click", () => {
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

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setDataModalOpen(false);
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
