(function () {
  const STORAGE_KEY = "yysls_armory_import_data_v1";
  const ACCOUNT_KEY = "yysls_armory_selected_account_v1";

  const slotFields = [
    ["weapon1", "主武器"],
    ["weapon2", "副武器"],
    ["head", "冠胄"],
    ["chest", "胸甲"],
    ["ring", "环"],
    ["pendant", "佩"],
    ["legs", "胫甲"],
    ["hands", "腕甲"]
  ];

  const state = {
    rawData: null,
    accounts: [],
    selectedAccount: "",
    selectedSlot: "全部",
    selectedClass: "全部",
    searchText: "",
    selectedSchemeKey: "",
    parsed: null
  };

  const nodes = {
    messageBox: document.getElementById("messageBox"),
    fileInput: document.getElementById("fileInput"),
    jsonInput: document.getElementById("jsonInput"),
    importButton: document.getElementById("importButton"),
    loadSavedButton: document.getElementById("loadSavedButton"),
    clearSavedButton: document.getElementById("clearSavedButton"),
    accountSelect: document.getElementById("accountSelect"),
    slotFilter: document.getElementById("slotFilter"),
    classFilter: document.getElementById("classFilter"),
    searchInput: document.getElementById("searchInput"),
    equipCount: document.getElementById("equipCount"),
    schemeCount: document.getElementById("schemeCount"),
    classCount: document.getElementById("classCount"),
    slotSummary: document.getElementById("slotSummary"),
    filteredSummary: document.getElementById("filteredSummary"),
    equipmentList: document.getElementById("equipmentList"),
    schemeList: document.getElementById("schemeList"),
    schemeDetail: document.getElementById("schemeDetail")
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function statText(stat) {
    if (!stat || !stat.type) return "无";
    const suffix = stat.isPercent ? "%" : "";
    return `${stat.type} ${stat.value}${suffix}`;
  }

  function setMessage(text, tone) {
    nodes.messageBox.textContent = text;
    nodes.messageBox.className = `notice ${tone}`;
  }

  function parseMaybeJson(text) {
    const trimmed = String(text || "").trim();
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

  function importSpongemData(data, account) {
    const equipments = Array.isArray(data[`game_equip_data_${account}`]) ? data[`game_equip_data_${account}`] : [];
    const simData = data[`game_sim_data_${account}`] || null;
    const equipmentMap = Object.fromEntries(equipments.map((item) => [item.id, item]));
    const loadouts = simData && simData.loadouts ? simData.loadouts : {};

    return {
      account,
      equipments,
      equipmentMap,
      loadouts,
      simData
    };
  }

  function flattenSchemes(parsed) {
    return Object.entries(parsed.loadouts).flatMap(([className, payload]) => {
      const schemes = payload && payload.schemes ? payload.schemes : {};
      return Object.entries(schemes).map(([schemeId, scheme]) => ({
        id: schemeId,
        key: `${className}::${schemeId}`,
        className,
        name: scheme.name || schemeId,
        bowType: scheme.bowType || "",
        setType: scheme.setType || "",
        armory: scheme.armory || parsed.simData?.currentArmory || "",
        xinfa: Array.isArray(scheme.xinfa) ? scheme.xinfa : [],
        raw: scheme
      }));
    });
  }

  function resolveScheme(parsed, className, schemeId) {
    const group = parsed.loadouts[className];
    if (!group || !group.schemes || !group.schemes[schemeId]) return null;

    const scheme = group.schemes[schemeId];
    const resolved = {
      ...scheme,
      className,
      id: schemeId,
      slots: {}
    };

    slotFields.forEach(([field, label]) => {
      const equipId = scheme[field] || null;
      resolved.slots[field] = {
        label,
        equipId,
        equipment: equipId ? parsed.equipmentMap[equipId] || null : null
      };
    });

    return resolved;
  }

  function buildFilters(parsed) {
    const slots = [...new Set(parsed.equipments.map((item) => item.slotName).filter(Boolean))];
    const classes = [...new Set(parsed.equipments.flatMap((item) => item.availableClasses || []).filter(Boolean))];

    fillSelect(nodes.slotFilter, ["全部", ...slots], state.selectedSlot);
    fillSelect(nodes.classFilter, ["全部", ...classes], state.selectedClass);
    state.selectedSlot = nodes.slotFilter.value || "全部";
    state.selectedClass = nodes.classFilter.value || "全部";
  }

  function fillSelect(node, values, selectedValue) {
    node.innerHTML = "";
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      node.appendChild(option);
    });

    if (values.includes(selectedValue)) node.value = selectedValue;
    else node.value = values[0] || "";
  }

  function currentFilteredEquipments() {
    if (!state.parsed) return [];

    return state.parsed.equipments.filter((item) => {
      const matchSlot = state.selectedSlot === "全部" || item.slotName === state.selectedSlot;
      const matchClass =
        state.selectedClass === "全部" ||
        (Array.isArray(item.availableClasses) && item.availableClasses.includes(state.selectedClass));
      const search = state.searchText.trim().toLowerCase();
      const matchSearch = !search || String(item.name || "").toLowerCase().includes(search);
      return matchSlot && matchClass && matchSearch;
    });
  }

  function renderSummary() {
    if (!state.parsed) {
      nodes.equipCount.textContent = "0";
      nodes.schemeCount.textContent = "0";
      nodes.classCount.textContent = "0";
      nodes.slotSummary.innerHTML = "";
      nodes.filteredSummary.textContent = "当前 0 件";
      return;
    }

    const schemes = flattenSchemes(state.parsed);
    const classes = [...new Set(state.parsed.equipments.flatMap((item) => item.availableClasses || []))];
    const slotCount = state.parsed.equipments.reduce((acc, item) => {
      const key = item.slotName || "未分类";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    nodes.equipCount.textContent = String(state.parsed.equipments.length);
    nodes.schemeCount.textContent = String(schemes.length);
    nodes.classCount.textContent = String(classes.length);
    nodes.filteredSummary.textContent = `当前 ${currentFilteredEquipments().length} 件`;
    nodes.slotSummary.innerHTML = Object.entries(slotCount)
      .map(([slot, count]) => `<span class="chip">${escapeHtml(slot)} ${count} 件</span>`)
      .join("");
  }

  function renderEquipmentList() {
    const equipments = currentFilteredEquipments();
    if (!equipments.length) {
      nodes.equipmentList.innerHTML = '<div class="empty">当前筛选条件下没有装备。</div>';
      return;
    }

    nodes.equipmentList.innerHTML = equipments
      .map((item) => {
        const classPills = (item.availableClasses || [])
          .map((name) => `<span class="pill teal">${escapeHtml(name)}</span>`)
          .join("");

        const flags = [
          item.isChengyin ? '<span class="pill gold">承音</span>' : "",
          item.isPurple ? '<span class="pill">紫装</span>' : "",
          item.weaponTypeId ? `<span class="pill">武器类型 ${escapeHtml(item.weaponTypeId)}</span>` : ""
        ]
          .filter(Boolean)
          .join("");

        const subStats = (item.subStats || [])
          .map(
            (stat) => `
              <div class="chip">
                <span>${escapeHtml(stat.type || "未知词条")}</span>
                <strong>${escapeHtml(stat.value)}${stat.isPercent ? "%" : ""}</strong>
              </div>
            `
          )
          .join("");

        return `
          <article class="equipment-card">
            <div class="equipment-top">
              <div class="equipment-title">
                <strong>${escapeHtml(item.name || "未命名装备")}</strong>
                <div class="pill-row">
                  <span class="pill">${escapeHtml(item.slotName || "未知部位")}</span>
                  <span class="pill">ID ${escapeHtml(item.id)}</span>
                  ${flags}
                </div>
              </div>
              <div class="pill-row">${classPills || '<span class="pill teal">未标注流派</span>'}</div>
            </div>
            <div class="scheme-grid">
              <div class="stat-block">
                <span class="label">主词条</span>
                <strong>${escapeHtml(statText(item.mainStat))}</strong>
              </div>
              <div class="stat-block">
                <span class="label">定音词条</span>
                <strong>${escapeHtml(statText(item.dingyinStat))}</strong>
              </div>
            </div>
            <div class="stat-block">
              <span class="label">副词条</span>
              <div class="substats">${subStats || '<span class="chip">无副词条</span>'}</div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderSchemeList() {
    if (!state.parsed) {
      nodes.schemeList.innerHTML = '<div class="empty">导入数据后，这里会出现配装方案。</div>';
      return;
    }

    const schemes = flattenSchemes(state.parsed);
    if (!schemes.length) {
      nodes.schemeList.innerHTML = '<div class="empty">当前账号还没有可用方案。</div>';
      return;
    }

    if (!state.selectedSchemeKey || !schemes.some((item) => item.key === state.selectedSchemeKey)) {
      state.selectedSchemeKey = schemes[0].key;
    }

    nodes.schemeList.innerHTML = schemes
      .map((scheme) => {
        const active = scheme.key === state.selectedSchemeKey ? "active" : "";
        const xinfa = scheme.xinfa.length ? scheme.xinfa.join(" / ") : "未配置心法";
        return `
          <article class="scheme-card ${active}" data-scheme-key="${escapeHtml(scheme.key)}">
            <strong>${escapeHtml(scheme.name)}</strong>
            <div class="scheme-meta">
              <div class="pill-row">
                <span class="pill teal">${escapeHtml(scheme.className)}</span>
                ${scheme.armory ? `<span class="pill">${escapeHtml(scheme.armory)}</span>` : ""}
                ${scheme.setType ? `<span class="pill gold">${escapeHtml(scheme.setType)}</span>` : ""}
              </div>
              <p class="subtle">${escapeHtml(xinfa)}</p>
            </div>
          </article>
        `;
      })
      .join("");

    nodes.schemeList.querySelectorAll("[data-scheme-key]").forEach((node) => {
      node.addEventListener("click", () => {
        state.selectedSchemeKey = node.getAttribute("data-scheme-key") || "";
        renderSchemeList();
        renderSchemeDetail();
      });
    });
  }

  function renderSchemeDetail() {
    if (!state.parsed || !state.selectedSchemeKey) {
      nodes.schemeDetail.innerHTML = '<div class="empty">选中一个配装方案后，这里会显示完整装备详情。</div>';
      return;
    }

    const [className, schemeId] = state.selectedSchemeKey.split("::");
    const scheme = resolveScheme(state.parsed, className, schemeId);
    if (!scheme) {
      nodes.schemeDetail.innerHTML = '<div class="empty">当前方案无法还原，请检查装备库是否完整。</div>';
      return;
    }

    const metaRows = [
      ["流派", scheme.className || "未标注"],
      ["方案名", scheme.name || scheme.id],
      ["武库", scheme.armory || "未标注"],
      ["套装", scheme.setType || "未标注"],
      ["弓类型", scheme.bowType || "未标注"],
      ["心法", Array.isArray(scheme.xinfa) && scheme.xinfa.length ? scheme.xinfa.join(" / ") : "未配置"],
      ["借定音", scheme.loanDingyin ? `是 (${(scheme.loanDingyinValue || []).join(", ")})` : "否"],
      ["模式", scheme.PVPMode ? "PVP" : "PVE"],
      ["赛季前期加成", scheme.earlySeasonBonus ? "开启" : "关闭"]
    ];

    const slotsHtml = slotFields
      .map(([field]) => {
        const slot = scheme.slots[field];
        if (!slot || !slot.equipment) {
          return `
            <article class="slot-card">
              <strong>${escapeHtml(slot ? slot.label : field)}</strong>
              <p class="subtle">未配置装备</p>
            </article>
          `;
        }

        const equipment = slot.equipment;
        return `
          <article class="slot-card">
            <strong>${escapeHtml(slot.label)}</strong>
            <div class="pill-row">
              <span class="pill">${escapeHtml(equipment.slotName || "未知部位")}</span>
              <span class="pill">ID ${escapeHtml(equipment.id)}</span>
              ${equipment.isChengyin ? '<span class="pill gold">承音</span>' : ""}
            </div>
            <p>${escapeHtml(equipment.name || "未命名装备")}</p>
            <p class="subtle">主词条：${escapeHtml(statText(equipment.mainStat))}</p>
            <p class="subtle">定音：${escapeHtml(statText(equipment.dingyinStat))}</p>
          </article>
        `;
      })
      .join("");

    nodes.schemeDetail.innerHTML = `
      <div class="equipment-card" style="margin-bottom:16px;">
        ${metaRows
          .map(
            ([label, value]) => `
              <div class="line">
                <span class="label">${escapeHtml(label)}</span>
                <strong>${escapeHtml(value)}</strong>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="slots-grid">${slotsHtml}</div>
    `;
  }

  function renderAccountOptions() {
    if (!state.accounts.length) {
      nodes.accountSelect.innerHTML = '<option value="">暂无账号</option>';
      return;
    }

    fillSelect(nodes.accountSelect, state.accounts, state.selectedAccount);
  }

  function refreshParsedData() {
    if (!state.rawData || !state.selectedAccount) {
      state.parsed = null;
      renderSummary();
      renderEquipmentList();
      renderSchemeList();
      renderSchemeDetail();
      return;
    }

    state.parsed = importSpongemData(state.rawData, state.selectedAccount);
    buildFilters(state.parsed);
    renderSummary();
    renderEquipmentList();
    renderSchemeList();
    renderSchemeDetail();
  }

  function saveImportedData() {
    if (!state.rawData) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.rawData));
    localStorage.setItem(ACCOUNT_KEY, state.selectedAccount);
  }

  function loadImportedPayload(data) {
    const accounts = detectAccounts(data);
    if (!accounts.length) {
      setMessage("导入成功，但没有识别到账号。请确认 JSON 中包含 game_account_list 或 game_equip_data_账号名。", "warn");
      return;
    }

    state.rawData = data;
    state.accounts = accounts;
    const lastSelected = localStorage.getItem(ACCOUNT_KEY);
    state.selectedAccount =
      (data.last_selected_account && accounts.includes(data.last_selected_account) && data.last_selected_account) ||
      (lastSelected && accounts.includes(lastSelected) && lastSelected) ||
      accounts[0];
    renderAccountOptions();
    refreshParsedData();
    saveImportedData();
    setMessage(`已导入 ${state.selectedAccount} 的数据，识别到 ${accounts.length} 个账号。`, "info");
  }

  function handleImportText(text) {
    try {
      const data = parseMaybeJson(text);
      if (!data || typeof data !== "object") throw new Error("JSON 为空或格式不正确");
      loadImportedPayload(data);
    } catch (error) {
      setMessage(`导入失败：${error.message}`, "warn");
    }
  }

  nodes.importButton.addEventListener("click", () => {
    const text = nodes.jsonInput.value.trim();
    if (!text) {
      setMessage("先粘贴 JSON，或者上传文件。", "warn");
      return;
    }
    handleImportText(text);
  });

  nodes.fileInput.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      nodes.jsonInput.value = text;
      handleImportText(text);
    } catch (error) {
      setMessage(`读取文件失败：${error.message}`, "warn");
    }
  });

  nodes.loadSavedButton.addEventListener("click", () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setMessage("当前浏览器里还没有保存过导入数据。", "warn");
      return;
    }
    nodes.jsonInput.value = saved;
    handleImportText(saved);
  });

  nodes.clearSavedButton.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACCOUNT_KEY);
    state.rawData = null;
    state.accounts = [];
    state.selectedAccount = "";
    state.selectedSlot = "全部";
    state.selectedClass = "全部";
    state.searchText = "";
    state.selectedSchemeKey = "";
    state.parsed = null;
    nodes.jsonInput.value = "";
    nodes.fileInput.value = "";
    nodes.searchInput.value = "";
    renderAccountOptions();
    fillSelect(nodes.slotFilter, ["全部"], "全部");
    fillSelect(nodes.classFilter, ["全部"], "全部");
    renderSummary();
    renderEquipmentList();
    renderSchemeList();
    renderSchemeDetail();
    setMessage("已清空当前浏览器里的装备管理缓存。", "info");
  });

  nodes.accountSelect.addEventListener("change", () => {
    state.selectedAccount = nodes.accountSelect.value;
    state.selectedSchemeKey = "";
    saveImportedData();
    refreshParsedData();
  });

  nodes.slotFilter.addEventListener("change", () => {
    state.selectedSlot = nodes.slotFilter.value;
    renderSummary();
    renderEquipmentList();
  });

  nodes.classFilter.addEventListener("change", () => {
    state.selectedClass = nodes.classFilter.value;
    renderSummary();
    renderEquipmentList();
  });

  nodes.searchInput.addEventListener("input", () => {
    state.searchText = nodes.searchInput.value;
    renderSummary();
    renderEquipmentList();
  });

  function init() {
    fillSelect(nodes.slotFilter, ["全部"], "全部");
    fillSelect(nodes.classFilter, ["全部"], "全部");
    renderAccountOptions();
    renderSummary();
    renderEquipmentList();
    renderSchemeList();
    renderSchemeDetail();

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      nodes.jsonInput.value = saved;
      try {
        loadImportedPayload(JSON.parse(saved));
      } catch (error) {
        setMessage(`发现旧缓存，但解析失败：${error.message}`, "warn");
      }
    }
  }

  init();
})();
