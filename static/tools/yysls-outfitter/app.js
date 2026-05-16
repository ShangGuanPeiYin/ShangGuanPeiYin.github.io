(function () {
  const STORAGE_KEY = "yysls_armory_import_data_v2";
  const ACCOUNT_KEY = "yysls_armory_selected_account_v2";
  const EXPORT_KEY = "yysls_outfitter_export_v1";

  const classOrder = [
    "鸣金·虹",
    "鸣金·影",
    "裂石·威",
    "裂石·钧",
    "牵丝·玉",
    "牵丝·霖",
    "牵丝·翊",
    "破竹·风",
    "破竹·尘",
    "破竹·鸢"
  ];

  const slotOrder = ["武器1", "武器2", "环", "佩", "冠胄", "胸甲", "胫甲", "腕甲"];
  const normalSlotOrder = ["环", "佩", "冠胄", "胸甲", "胫甲", "腕甲"];
  const equipmentSlotOrder = ["武器", "环", "佩", "冠胄", "胸甲", "胫甲", "腕甲"];

  const weaponTypeMap = {
    "1": "剑",
    "2": "枪",
    "3": "伞",
    "4": "扇",
    "5": "绳标",
    "6": "双刀",
    "7": "陌刀",
    "8": "横刀",
    "9": "拳甲",
    "10": "舞绫鼓"
  };

  const canonicalWeaponDisplay = {
    剑: "剑",
    枪: "枪",
    伞: "伞",
    扇: "扇",
    绳标: "绳镖",
    双刀: "双刀",
    陌刀: "陌刀",
    横刀: "唐横刀",
    拳甲: "拳套",
    舞绫鼓: "舞绫鼓"
  };

  const classWeaponRules = {
    "鸣金·虹": ["剑", "枪"],
    "鸣金·影": ["剑", "枪"],
    "裂石·威": ["陌刀", "枪"],
    "裂石·钧": ["横刀", "陌刀"],
    "牵丝·玉": ["伞", "扇"],
    "牵丝·霖": ["伞", "扇"],
    "牵丝·翊": ["舞绫鼓", "扇"],
    "破竹·风": ["双刀", "绳标"],
    "破竹·尘": ["伞", "绳标"],
    "破竹·鸢": ["拳甲", "绳标"]
  };

  const weaponBonusStats = [
    "剑武学增效",
    "枪武学增效",
    "伞武学增效",
    "扇武学增效",
    "绳标武学增效",
    "双刀武学增效",
    "陌刀武学增效",
    "横刀武学增效",
    "拳甲武学增效",
    "舞绫鼓武学增效"
  ];
  const percentStats = new Set([
    "精准率",
    "会心率",
    "会意率",
    "全武学增效",
    "对首领单位增伤",
    "指定武学技能增伤",
    ...weaponBonusStats
  ]);

  const state = {
    rawData: null,
    accounts: [],
    selectedAccount: "",
    selectedClass: classOrder[0],
    selectedSchemeId: "",
    draftScheme: null,
    slotFilter: "全部",
    activeSlot: "武器1",
    searchText: "",
    searchMode: "atLeast",
    searchCriteria: [],
    searchResults: [],
    searchResultPage: 0
  };

  const nodes = {
    messageBox: document.getElementById("messageBox"),
    accountSelect: document.getElementById("accountSelect"),
    classSelect: document.getElementById("classSelect"),
    schemeSelect: document.getElementById("schemeSelect"),
    schemeNameInput: document.getElementById("schemeNameInput"),
    searchInput: document.getElementById("searchInput"),
    newSchemeButton: document.getElementById("newSchemeButton"),
    saveSchemeButton: document.getElementById("saveSchemeButton"),
    deleteSchemeButton: document.getElementById("deleteSchemeButton"),
    slotFilterBar: document.getElementById("slotFilterBar"),
    equipmentList: document.getElementById("equipmentList"),
    slotsGrid: document.getElementById("slotsGrid"),
    classRuleHint: document.getElementById("classRuleHint"),
    clearBuildButton: document.getElementById("clearBuildButton"),
    searchModeRow: document.getElementById("searchModeRow"),
    criteriaList: document.getElementById("criteriaList"),
    addCriteriaButton: document.getElementById("addCriteriaButton"),
    runSearchButton: document.getElementById("runSearchButton"),
    searchResultMeta: document.getElementById("searchResultMeta"),
    resultList: document.getElementById("resultList"),
    allStatSummary: document.getElementById("allStatSummary"),
    schemeMeta: document.getElementById("schemeMeta"),
    copySummaryButton: document.getElementById("copySummaryButton"),
    exportBridgeButton: document.getElementById("exportBridgeButton")
  };

  function createSearchCriterion() {
    return {
      id: generateId(),
      type: nextAvailableSearchType("会心率"),
      count: 1
    };
  }

  function uniqueSearchTypes() {
    return [...new Set(state.searchCriteria.map((criterion) => String(criterion.type || "").trim()).filter(Boolean))];
  }

  function nextAvailableSearchType(preferred, excludeId) {
    const options = countableStatOptions();
    const used = new Set(
      state.searchCriteria
        .filter((criterion) => String(criterion.id) !== String(excludeId))
        .map((criterion) => String(criterion.type || "").trim())
        .filter(Boolean)
    );
    if (preferred && options.includes(preferred) && !used.has(preferred)) return preferred;
    return options.find((option) => !used.has(option)) || options[0] || "会心率";
  }

  function normalizeSearchCriteria() {
    const seen = new Set();
    state.searchCriteria.forEach((criterion) => {
      const current = String(criterion.type || "").trim();
      if (current && !seen.has(current)) {
        seen.add(current);
        return;
      }
      criterion.type = nextAvailableSearchType(current, criterion.id);
      if (criterion.type) seen.add(criterion.type);
    });
  }

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

  function detectAccounts(data) {
    const fromList = Array.isArray(data?.game_account_list) ? data.game_account_list.filter(Boolean) : [];
    const fromKeys = Object.keys(data || {})
      .filter((key) => key.startsWith("game_equip_data_"))
      .map((key) => key.replace("game_equip_data_", ""))
      .filter(Boolean);
    return [...new Set([...fromList, ...fromKeys])];
  }

  function parseSavedData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const data = JSON.parse(saved);
    data.game_account_list = detectAccounts(data);
    return data;
  }

  function currentEquipments() {
    if (!state.rawData || !state.selectedAccount) return [];
    return Array.isArray(state.rawData[`game_equip_data_${state.selectedAccount}`])
      ? state.rawData[`game_equip_data_${state.selectedAccount}`]
      : [];
  }

  function countableStatOptions() {
    const values = new Set();
    currentEquipments().forEach((item) => {
      [item.mainStat, ...(item.subStats || [])].forEach((stat) => {
        const normalized = normalizeStat(stat);
        if (normalized.type) values.add(normalized.type);
      });
    });
    return [...values].sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  }

  function emptySlots() {
    return slotOrder.reduce((acc, slot) => {
      acc[slot] = "";
      return acc;
    }, {});
  }

  function generateId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `scheme-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function createDraftScheme() {
    return {
      id: "",
      name: "",
      className: state.selectedClass,
      slots: emptySlots(),
      createdAt: "",
      updatedAt: ""
    };
  }

  function ensureOutfitterStore(account) {
    const key = `game_outfitter_data_${account}`;
    if (!state.rawData[key] || typeof state.rawData[key] !== "object") {
      state.rawData[key] = { schemes: [], selectedSchemeId: "" };
    }
    if (!Array.isArray(state.rawData[key].schemes)) state.rawData[key].schemes = [];
    if (typeof state.rawData[key].selectedSchemeId !== "string") state.rawData[key].selectedSchemeId = "";
    return state.rawData[key];
  }

  function outfitterStore() {
    if (!state.rawData || !state.selectedAccount) return { schemes: [], selectedSchemeId: "" };
    return ensureOutfitterStore(state.selectedAccount);
  }

  function saveRawData() {
    if (!state.rawData) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.rawData));
    localStorage.setItem(ACCOUNT_KEY, state.selectedAccount);
  }

  function selectOptions(values, selectedValue) {
    return values
      .map((value) => {
        const selected = String(value) === String(selectedValue) ? " selected" : "";
        return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(value)}</option>`;
      })
      .join("");
  }

  function formatTime(value) {
    if (!value) return "未保存";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "未保存";
    return date.toLocaleString("zh-CN", { hour12: false });
  }

  function statValueText(name, value) {
    const formatted = Number(value || 0).toFixed(percentStats.has(name) ? 1 : 1).replace(/\.0$/, "");
    return percentStats.has(name) ? `${formatted}%` : formatted;
  }

  function normalizeStat(stat) {
    return {
      type: stat && stat.type ? String(stat.type).trim() : "",
      value: stat && typeof stat.value !== "undefined" ? Number(stat.value || 0) : 0
    };
  }

  function weaponTypeName(item) {
    if (!item || item.slotName !== "武器") return "";
    return weaponTypeMap[String(item.weaponTypeId || "")] || "";
  }

  function weaponTypeDisplayName(rawName) {
    return canonicalWeaponDisplay[rawName] || rawName || "未标注武器";
  }

  function currentClassRule() {
    return classWeaponRules[state.selectedClass] || [];
  }

  function currentClassRuleLabel() {
    const names = currentClassRule().map((name) => weaponTypeDisplayName(name));
    return names.length ? `${state.selectedClass} 只能使用 ${names.join(" + ")}` : "当前流派还没有配置武器规则。";
  }

  function countedStatMapForItem(item) {
    const map = {};
    if (!item) return map;
    [item.mainStat, ...(item.subStats || [])].forEach((stat) => {
      const normalized = normalizeStat(stat);
      if (!normalized.type) return;
      map[normalized.type] = (map[normalized.type] || 0) + 1;
    });
    return map;
  }

  function totalStatMapForItem(item) {
    const map = {};
    if (!item) return map;
    [item.mainStat, ...(item.subStats || [])].forEach((stat) => {
      const normalized = normalizeStat(stat);
      if (!normalized.type) return;
      map[normalized.type] = (map[normalized.type] || 0) + normalized.value;
    });
    return map;
  }

  function slotDisplayLabel(slot) {
    if (slot === "武器1") {
      return weaponTypeDisplayName(currentClassRule()[0]) || "武器1";
    }
    if (slot === "武器2") {
      return weaponTypeDisplayName(currentClassRule()[1]) || "武器2";
    }
    return slot;
  }

  function equipmentById(id) {
    return currentEquipments().find((item) => String(item.id) === String(id)) || null;
  }

  function slotToEquipmentSlot(slot) {
    return slot.startsWith("武器") ? "武器" : slot;
  }

  function itemMatchesSlot(item, slot) {
    if (!item) return false;
    if (slot.startsWith("武器")) {
      if (item.slotName !== "武器") return false;
      const rawName = weaponTypeName(item);
      const targetWeapon = slot === "武器1" ? currentClassRule()[0] : currentClassRule()[1];
      return rawName === targetWeapon;
    }
    return item.slotName === slot;
  }

  function equippedIdsSet() {
    return new Set(Object.values(state.draftScheme?.slots || {}).filter(Boolean).map(String));
  }

  function activeTargetSlotForItem(item) {
    if (!item) return "";
    if (item.slotName === "武器") {
      const rawName = weaponTypeName(item);
      if (rawName && rawName === currentClassRule()[0]) return "武器1";
      if (rawName && rawName === currentClassRule()[1]) return "武器2";
      if (state.activeSlot === "武器1" || state.activeSlot === "武器2") return state.activeSlot;
      return "";
    }
    return item.slotName;
  }

  function clearInvalidWeapons() {
    if (!state.draftScheme) return;
    const seenTypes = new Set();
    ["武器1", "武器2"].forEach((slot) => {
      const item = equipmentById(state.draftScheme.slots[slot]);
      if (!itemMatchesSlot(item, slot)) {
        state.draftScheme.slots[slot] = "";
        return;
      }
      const rawName = weaponTypeName(item);
      if (seenTypes.has(rawName)) {
        state.draftScheme.slots[slot] = "";
        return;
      }
      seenTypes.add(rawName);
    });
  }

  function renderAccountOptions() {
    if (!state.accounts.length) {
      nodes.accountSelect.innerHTML = '<option value="">暂无角色</option>';
      nodes.accountSelect.disabled = true;
      return;
    }
    nodes.accountSelect.disabled = false;
    nodes.accountSelect.innerHTML = selectOptions(state.accounts, state.selectedAccount);
  }

  function renderClassOptions() {
    nodes.classSelect.innerHTML = selectOptions(classOrder, state.selectedClass);
  }

  function renderSchemeOptions() {
    const store = outfitterStore();
    const options = ['<option value="">未保存方案</option>'].concat(
      store.schemes.map((scheme) => {
        const selected = String(scheme.id) === String(state.selectedSchemeId) ? " selected" : "";
        return `<option value="${escapeHtml(scheme.id)}"${selected}>${escapeHtml(scheme.name || "未命名方案")}</option>`;
      })
    );
    nodes.schemeSelect.innerHTML = options.join("");
    nodes.schemeSelect.value = state.selectedSchemeId || "";
  }

  function renderSearchMode() {
    const modes = [
      { id: "atLeast", label: "至少满足" },
      { id: "exact", label: "刚好等于" }
    ];
    nodes.searchModeRow.innerHTML = modes
      .map((mode) => `
        <button class="${state.searchMode === mode.id ? "active" : "secondary"}" type="button" data-search-mode="${escapeHtml(mode.id)}">
          ${escapeHtml(mode.label)}
        </button>
      `)
      .join("");
    nodes.searchModeRow.querySelectorAll("[data-search-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        state.searchMode = button.getAttribute("data-search-mode") || "atLeast";
        renderSearchMode();
      });
    });
  }

  function renderCriteriaList() {
    const options = countableStatOptions();
    normalizeSearchCriteria();
    nodes.criteriaList.innerHTML = state.searchCriteria
      .map((criterion) => {
        const usedByOthers = new Set(
          state.searchCriteria
            .filter((item) => String(item.id) !== String(criterion.id))
            .map((item) => String(item.type || "").trim())
            .filter(Boolean)
        );
        const optionHtml = (options.length ? options : ["会心率"])
          .map((option) => {
            const selected = option === criterion.type ? " selected" : "";
            const disabled = usedByOthers.has(option) ? " disabled" : "";
            return `<option value="${escapeHtml(option)}"${selected}${disabled}>${escapeHtml(option)}</option>`;
          })
          .join("");
        return `
        <div class="criteria-row" data-criteria-id="${escapeHtml(criterion.id)}">
          <label class="field">
            <span>词条</span>
            <select data-criteria-field="type">
              ${optionHtml}
            </select>
          </label>
          <label class="field">
            <span>条数</span>
            <input data-criteria-field="count" type="number" min="1" step="1" value="${escapeHtml(criterion.count)}" />
          </label>
          <button class="danger" type="button" data-remove-criteria="${escapeHtml(criterion.id)}">删除</button>
        </div>
      `;
      })
      .join("");

    state.searchCriteria.forEach((criterion) => {
      const row = nodes.criteriaList.querySelector(`[data-criteria-id="${CSS.escape(String(criterion.id))}"]`);
      if (!row) return;
      const select = row.querySelector('[data-criteria-field="type"]');
      if (select) select.value = options.includes(criterion.type) ? criterion.type : options[0] || "会心率";
      criterion.type = select ? select.value : criterion.type;
    });

    nodes.criteriaList.querySelectorAll("[data-remove-criteria]").forEach((button) => {
      button.addEventListener("click", () => {
        state.searchCriteria = state.searchCriteria.filter((criterion) => String(criterion.id) !== String(button.getAttribute("data-remove-criteria")));
        if (!state.searchCriteria.length) state.searchCriteria = [createSearchCriterion()];
        renderCriteriaList();
      });
    });

    nodes.criteriaList.querySelectorAll("[data-criteria-id]").forEach((row) => {
      const id = row.getAttribute("data-criteria-id");
      const criterion = state.searchCriteria.find((item) => String(item.id) === String(id));
      if (!criterion) return;
      const select = row.querySelector('[data-criteria-field="type"]');
      const input = row.querySelector('[data-criteria-field="count"]');
      if (select) {
        select.addEventListener("change", () => {
          criterion.type = nextAvailableSearchType(select.value, criterion.id);
          renderCriteriaList();
        });
      }
      if (input) {
        input.addEventListener("input", () => {
          criterion.count = Math.max(1, Number(input.value || 1));
        });
      }
    });

    nodes.addCriteriaButton.disabled = !state.selectedAccount || uniqueSearchTypes().length >= countableStatOptions().length;
  }

  function renderSearchResults() {
    if (!state.searchResults.length) {
      nodes.resultList.innerHTML = '<div class="empty-block">还没有搜索结果。输入目标条件后开始搜索。</div>';
      return;
    }

    const page = Math.max(0, Math.min(state.searchResultPage, state.searchResults.length - 1));
    const result = state.searchResults[page];
    const slotLines = slotOrder
      .map((slot) => {
        const item = equipmentById(result.slots[slot]);
        const slotLabel = slotDisplayLabel(slot);
        return `<span>${escapeHtml(slotLabel)}：${escapeHtml(item?.name || "未命名装备")}</span>`;
      })
      .join("");
    const statList = result.summary
      .map((entry) => `
        <div class="result-stat-item">
          <div class="result-stat-name">${escapeHtml(entry.type)} · ${escapeHtml(String(entry.count))}条</div>
          <div class="result-stat-value">${escapeHtml(statValueText(entry.type, entry.total))}</div>
        </div>
      `)
      .join("");

    const prevDisabled = page <= 0 ? "disabled" : "";
    const nextDisabled = page >= state.searchResults.length - 1 ? "disabled" : "";

    nodes.resultList.innerHTML = `
      <div class="result-pager">
        <button class="secondary" type="button" data-prev-result ${prevDisabled}>← 上一套</button>
        <span>方案 ${page + 1} / ${state.searchResults.length}</span>
        <button class="secondary" type="button" data-next-result ${nextDisabled}>下一套 →</button>
      </div>
      <article class="result-card">
        <div class="result-card-body">
          <div class="result-slots">${slotLines}</div>
          <div class="result-stat-list">${statList}</div>
        </div>
        <div class="result-actions">
          <button class="secondary" type="button" data-load-result="${escapeHtml(String(page))}">载入当前搭配</button>
        </div>
      </article>
    `;

    nodes.resultList.querySelectorAll("[data-load-result]").forEach((button) => {
      button.addEventListener("click", () => {
        const result = state.searchResults[Number(button.getAttribute("data-load-result"))];
        if (!result || !state.draftScheme) return;
        state.draftScheme.slots = { ...emptySlots(), ...result.slots };
        state.activeSlot = "武器1";
        state.slotFilter = "全部";
        renderAll();
        setMessage(`已载入搜索结果方案 ${Number(button.getAttribute("data-load-result")) + 1}。`, "info");
      });
    });

    const prevButton = nodes.resultList.querySelector("[data-prev-result]");
    const nextButton = nodes.resultList.querySelector("[data-next-result]");

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        if (state.searchResultPage > 0) {
          state.searchResultPage -= 1;
          renderSearchResults();
        }
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        if (state.searchResultPage < state.searchResults.length - 1) {
          state.searchResultPage += 1;
          renderSearchResults();
        }
      });
    }
  }

  function renderSlotFilters() {
    const labels = ["全部", ...slotOrder];
    nodes.slotFilterBar.innerHTML = labels
      .map((label) => {
        const active = label === state.slotFilter ? "active" : "";
        const text = label === "全部" ? label : slotDisplayLabel(label);
        return `<button class="capsule ${active}" type="button" data-slot-filter="${escapeHtml(label)}">${escapeHtml(text)}</button>`;
      })
      .join("");

    nodes.slotFilterBar.querySelectorAll("[data-slot-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        state.slotFilter = button.getAttribute("data-slot-filter") || "全部";
        if (state.slotFilter !== "全部") {
          state.activeSlot = state.slotFilter;
        }
        renderSlotFilters();
        renderEquipmentList();
        renderSlots();
      });
    });
  }

  function aggregateStats() {
    const total = {};
    const count = {};
    slotOrder.forEach((slot) => {
      const item = equipmentById(state.draftScheme.slots[slot]);
      if (!item) return;
      [item.mainStat, item.dingyinStat, ...(item.subStats || [])].forEach((stat) => {
        const normalized = normalizeStat(stat);
        if (!normalized.type) return;
        total[normalized.type] = (total[normalized.type] || 0) + normalized.value;
        count[normalized.type] = (count[normalized.type] || 0) + 1;
      });
    });
    return { total, count };
  }

  function buildSearchPools() {
    return {
      武器1: currentEquipments().filter((item) => itemMatchesSlot(item, "武器1")),
      武器2: currentEquipments().filter((item) => itemMatchesSlot(item, "武器2")),
      环: currentEquipments().filter((item) => item.slotName === "环"),
      佩: currentEquipments().filter((item) => item.slotName === "佩"),
      冠胄: currentEquipments().filter((item) => item.slotName === "冠胄"),
      胸甲: currentEquipments().filter((item) => item.slotName === "胸甲"),
      胫甲: currentEquipments().filter((item) => item.slotName === "胫甲"),
      腕甲: currentEquipments().filter((item) => item.slotName === "腕甲")
    };
  }

  function runOutfitSearch() {
    const criteria = state.searchCriteria
      .map((criterion) => ({
        type: String(criterion.type || "").trim(),
        count: Math.max(1, Number(criterion.count || 1))
      }))
      .filter((criterion) => criterion.type);

    if (!criteria.length) {
      setMessage("先至少设置一条目标词条条件。", "warn");
      return;
    }

    const pools = buildSearchPools();
    const missingSlot = slotOrder.find((slot) => !pools[slot] || !pools[slot].length);
    if (missingSlot) {
      nodes.searchResultMeta.textContent = "";
      state.searchResults = [];
      state.searchResultPage = 0;
      renderSearchResults();
      setMessage(`${slotDisplayLabel(missingSlot)} 当前没有可用装备，无法完成穷举搜索。`, "warn");
      return;
    }

    const slotCandidates = slotOrder.map((slot) => {
      const list = pools[slot]
        .map((item) => ({
          item,
          slot,
          id: String(item.id),
          counts: countedStatMapForItem(item),
          totals: totalStatMapForItem(item),
          score: criteria.reduce((sum, criterion) => sum + (countedStatMapForItem(item)[criterion.type] || 0), 0)
        }))
        .sort((a, b) => b.score - a.score || String(a.item.name || "").localeCompare(String(b.item.name || ""), "zh-Hans-CN"));
      return list;
    });

    const suffixMax = Array.from({ length: slotCandidates.length + 1 }, () => ({}));
    for (let index = slotCandidates.length - 1; index >= 0; index -= 1) {
      const current = {};
      criteria.forEach((criterion) => {
        const maxHere = Math.max(...slotCandidates[index].map((candidate) => candidate.counts[criterion.type] || 0));
        current[criterion.type] = maxHere + (suffixMax[index + 1][criterion.type] || 0);
      });
      suffixMax[index] = current;
    }

    const results = [];
    const currentCounts = {};
    const currentTotals = {};
    const chosenSlots = {};

    function canPrune(index) {
      return criteria.some((criterion) => {
        const current = currentCounts[criterion.type] || 0;
        const maxPossible = current + (suffixMax[index][criterion.type] || 0);
        if (state.searchMode === "exact") {
          if (current > criterion.count) return true;
          if (maxPossible < criterion.count) return true;
          return false;
        }
        return maxPossible < criterion.count;
      });
    }

    function matchesResult() {
      return criteria.every((criterion) => {
        const current = currentCounts[criterion.type] || 0;
        return state.searchMode === "exact" ? current === criterion.count : current >= criterion.count;
      });
    }

    function dfs(index) {
      if (results.length >= 15) return;
      if (canPrune(index)) return;

      if (index >= slotOrder.length) {
        if (!matchesResult()) return;
        results.push({
          slots: { ...chosenSlots },
          criteria: criteria.map((criterion) => ({
            type: criterion.type,
            target: criterion.count,
            actual: currentCounts[criterion.type] || 0
          })),
          summary: Object.keys(currentCounts)
            .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"))
            .map((type) => ({ type, count: currentCounts[type], total: currentTotals[type] || 0 }))
        });
        return;
      }

      const slot = slotOrder[index];
      slotCandidates[index].forEach((candidate) => {
        if (results.length >= 15) return;
        chosenSlots[slot] = candidate.id;
        const touched = [];
        Object.keys(candidate.counts).forEach((type) => {
          const amount = candidate.counts[type];
          if (!amount) return;
          touched.push([type, currentCounts[type] || 0, currentTotals[type] || 0]);
          currentCounts[type] = (currentCounts[type] || 0) + amount;
          currentTotals[type] = (currentTotals[type] || 0) + (candidate.totals[type] || 0);
        });
        dfs(index + 1);
        touched.forEach(([type, previousCount, previousTotal]) => {
          if (previousCount) {
            currentCounts[type] = previousCount;
            currentTotals[type] = previousTotal;
          } else {
            delete currentCounts[type];
            delete currentTotals[type];
          }
        });
        delete chosenSlots[slot];
      });
    }

    dfs(0);
    state.searchResults = results;
    state.searchResultPage = 0;
    nodes.searchResultMeta.textContent = results.length
      ? `已找到 ${results.length} 套符合条件的方案，当前最多展示 15 套。`
      : "没有找到符合当前条件的穿搭方案。";
    renderSearchResults();
    setMessage(results.length ? `搜索完成，找到 ${results.length} 套方案。` : "搜索完成，但没有符合条件的方案。", results.length ? "info" : "warn");
  }

  function allStatRowsHtml(totals, counts) {
    const names = Object.keys(totals).sort((a, b) => {
      const aWeapon = weaponBonusStats.includes(a);
      const bWeapon = weaponBonusStats.includes(b);
      if (aWeapon !== bWeapon) return aWeapon ? 1 : -1;
      return a.localeCompare(b, "zh-Hans-CN");
    });

    const rows = names
      .map((name) => `
        <div class="stat-row">
          <span>${escapeHtml(name)} · ${escapeHtml(String(counts[name] || 0))}条</span>
          <strong>${escapeHtml(statValueText(name, totals[name]))}</strong>
        </div>
      `)
      .join("");
    return rows || '<div class="empty-block">当前整套装备还没有可汇总的词条。</div>';
  }

  function renderSummary() {
    const aggregates = aggregateStats();
    const totals = aggregates.total;
    const counts = aggregates.count;
    nodes.allStatSummary.innerHTML = allStatRowsHtml(totals, counts);
    nodes.classRuleHint.textContent = currentClassRuleLabel();

    const equippedCount = Object.values(state.draftScheme.slots).filter(Boolean).length;
    const schemeName = state.draftScheme.name || "未命名方案";
    nodes.schemeMeta.innerHTML = `
      <span>当前方案：${escapeHtml(schemeName)}</span>
      <span>当前流派：${escapeHtml(state.selectedClass)}</span>
      <span>已上阵：${equippedCount} / ${slotOrder.length}</span>
      <span>最近保存：${escapeHtml(formatTime(state.draftScheme.updatedAt))}</span>
    `;
  }

  function candidateEquipments() {
    const search = state.searchText.trim().toLowerCase();
    return currentEquipments()
      .filter((item) => {
        if (state.slotFilter !== "全部") {
          if (!itemMatchesSlot(item, state.slotFilter)) return false;
        } else if (item.slotName === "武器") {
          const rawName = weaponTypeName(item);
          if (!currentClassRule().includes(rawName)) return false;
        }

        if (!search) return true;
        const text = [
          item.name,
          item.slotName,
          weaponTypeDisplayName(weaponTypeName(item)),
          item.mainStat?.type,
          item.dingyinStat?.type,
          ...(item.subStats || []).map((stat) => stat?.type || "")
        ]
          .join(" ")
          .toLowerCase();
        return text.includes(search);
      })
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "zh-Hans-CN"));
  }

  function equipItem(id) {
    const item = equipmentById(id);
    if (!item || !state.draftScheme) return;

    const targetSlot = activeTargetSlotForItem(item);
    if (!targetSlot || !itemMatchesSlot(item, targetSlot)) {
      setMessage("这件装备和当前目标槽位不匹配。", "warn");
      return;
    }

    Object.keys(state.draftScheme.slots).forEach((slot) => {
      if (String(state.draftScheme.slots[slot]) === String(item.id)) {
        state.draftScheme.slots[slot] = "";
      }
    });

    if (item.slotName === "武器") {
      const otherSlot = targetSlot === "武器1" ? "武器2" : "武器1";
      const otherItem = equipmentById(state.draftScheme.slots[otherSlot]);
      const nextWeaponName = weaponTypeName(item);
      const otherWeaponName = weaponTypeName(otherItem);
      if (otherItem && nextWeaponName && nextWeaponName === otherWeaponName) {
        state.draftScheme.slots[otherSlot] = "";
      }
    }

    state.draftScheme.slots[targetSlot] = String(item.id);
    state.activeSlot = targetSlot;
    renderEquipmentList();
    renderSlots();
    renderSummary();
    setMessage(`已把 ${item.name || "未命名装备"} 放入 ${targetSlot}。`, "info");
  }

  function removeSlotItem(slot) {
    if (!state.draftScheme) return;
    state.draftScheme.slots[slot] = "";
    renderEquipmentList();
    renderSlots();
    renderSummary();
  }

  function renderEquipmentCard(item) {
    const targetSlot = activeTargetSlotForItem(item);
    const occupied = equippedIdsSet().has(String(item.id));
    const rawWeaponName = weaponTypeName(item);
    const weaponPill =
      item.slotName === "武器" ? `<span class="pill">${escapeHtml(weaponTypeDisplayName(rawWeaponName))}</span>` : "";
    return `
      <article class="equipment-card">
        <div class="equipment-card-top">
          <div>
            <strong>${escapeHtml(item.name || "未命名装备")}</strong>
            <div class="pill-row">
              <span class="pill">${escapeHtml(item.slotName || "未知部位")}</span>
              ${weaponPill}
              ${item.isChengyin ? '<span class="pill gold">承音</span>' : ""}
              ${item.isPurple ? '<span class="pill">紫装</span>' : ""}
            </div>
          </div>
        </div>
        <div class="mini-list">
          <div class="mini-row">
            <span>主词条</span>
            <strong>${escapeHtml(statLine(item.mainStat))}</strong>
          </div>
          <div class="mini-row">
            <span>定音词条</span>
            <strong>${escapeHtml(statLine(item.dingyinStat))}</strong>
          </div>
        </div>
        <div class="card-actions">
          <button class="primary" type="button" data-equip-id="${escapeHtml(item.id)}" ${targetSlot ? "" : "disabled"}>
            放入${escapeHtml(targetSlot ? slotDisplayLabel(targetSlot) : "当前槽位")}
          </button>
          ${occupied ? '<span class="pill">已上阵</span>' : ""}
        </div>
      </article>
    `;
  }

  function renderEquipmentList() {
    if (!state.selectedAccount) {
      nodes.equipmentList.innerHTML = '<div class="empty-block">先在装备库里准备角色数据，再回来搭配装备。</div>';
      return;
    }
    const items = candidateEquipments();
    if (!items.length) {
      nodes.equipmentList.innerHTML = '<div class="empty-block">当前筛选条件下没有可用装备。</div>';
      return;
    }
    nodes.equipmentList.innerHTML = items.map(renderEquipmentCard).join("");
    nodes.equipmentList.querySelectorAll("[data-equip-id]").forEach((button) => {
      button.addEventListener("click", () => {
        equipItem(button.getAttribute("data-equip-id"));
      });
    });
  }

  function renderSlotCard(slot) {
    const item = equipmentById(state.draftScheme.slots[slot]);
    const active = state.activeSlot === slot ? "active" : "";
    const empty = item ? "" : "empty";
    const ruleText = slot.startsWith("武器")
      ? weaponTypeDisplayName(slot === "武器1" ? currentClassRule()[0] : currentClassRule()[1])
      : slot;
    const slotTitle = slotDisplayLabel(slot);
    const slotMetaText = slot.startsWith("武器") ? "" : ruleText;

    if (!item) {
      return `
        <article class="slot-card ${active} ${empty}" data-slot-card="${escapeHtml(slot)}">
          <div class="slot-head">
            <div>
              <strong>${escapeHtml(slotTitle)}</strong>
              ${slotMetaText ? `<div class="slot-type">${escapeHtml(slotMetaText)}</div>` : ""}
            </div>
          </div>
          <div class="slot-empty">当前槽位还没有装备。点击这张卡片后，再从左侧选择候选装备。</div>
          <div class="slot-actions">
            <button class="secondary" type="button" data-focus-slot="${escapeHtml(slot)}">设为当前槽位</button>
          </div>
        </article>
      `;
    }

    const weaponText = item.slotName === "武器" ? weaponTypeDisplayName(weaponTypeName(item)) : item.slotName;
    return `
      <article class="slot-card ${active}" data-slot-card="${escapeHtml(slot)}">
        <div class="slot-head">
          <div>
            <strong>${escapeHtml(slotTitle)}</strong>
            ${slot.startsWith("武器") ? "" : `<div class="slot-type">${escapeHtml(weaponText)}</div>`}
          </div>
        </div>
        <div class="mini-list">
          <div><strong>${escapeHtml(item.name || "未命名装备")}</strong></div>
          <div class="mini-row">
            <span>主词条</span>
            <strong>${escapeHtml(statLine(item.mainStat))}</strong>
          </div>
          <div class="mini-row">
            <span>定音词条</span>
            <strong>${escapeHtml(statLine(item.dingyinStat))}</strong>
          </div>
        </div>
        <div class="slot-actions">
          <button class="secondary" type="button" data-focus-slot="${escapeHtml(slot)}">替换</button>
          <button class="danger" type="button" data-remove-slot="${escapeHtml(slot)}">移除</button>
        </div>
      </article>
    `;
  }

  function renderSlots() {
    nodes.slotsGrid.innerHTML = slotOrder.map(renderSlotCard).join("");
    nodes.slotsGrid.querySelectorAll("[data-focus-slot]").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeSlot = button.getAttribute("data-focus-slot") || "武器1";
        state.slotFilter = state.activeSlot;
        renderSlotFilters();
        renderEquipmentList();
        renderSlots();
      });
    });
    nodes.slotsGrid.querySelectorAll("[data-remove-slot]").forEach((button) => {
      button.addEventListener("click", () => {
        removeSlotItem(button.getAttribute("data-remove-slot"));
      });
    });
    nodes.slotsGrid.querySelectorAll("[data-slot-card]").forEach((card) => {
      card.addEventListener("click", (event) => {
        if (event.target.closest("button")) return;
        state.activeSlot = card.getAttribute("data-slot-card") || "武器1";
        state.slotFilter = state.activeSlot;
        renderSlotFilters();
        renderEquipmentList();
        renderSlots();
      });
    });
  }

  function statLine(stat) {
    const normalized = normalizeStat(stat);
    if (!normalized.type) return "未设置";
    return `${normalized.type} ${statValueText(normalized.type, normalized.value)}`;
  }

  function loadSchemeIntoDraft(scheme) {
    state.draftScheme = {
      id: scheme?.id || "",
      name: scheme?.name || "",
      className: scheme?.className || state.selectedClass,
      slots: { ...emptySlots(), ...(scheme?.slots || {}) },
      createdAt: scheme?.createdAt || "",
      updatedAt: scheme?.updatedAt || ""
    };
    state.selectedClass = state.draftScheme.className || state.selectedClass;
    clearInvalidWeapons();
    nodes.schemeNameInput.value = state.draftScheme.name || "";
  }

  function loadCurrentScheme() {
    const store = outfitterStore();
    const target = store.schemes.find((scheme) => String(scheme.id) === String(store.selectedSchemeId));
    state.selectedSchemeId = target ? target.id : "";
    loadSchemeIntoDraft(target || createDraftScheme());
  }

  function saveCurrentScheme() {
    if (!state.selectedAccount) {
      setMessage("先选择一个角色，再保存搭配方案。", "warn");
      return;
    }
    const store = outfitterStore();
    const now = new Date().toISOString();
    const schemeName = nodes.schemeNameInput.value.trim() || `${state.selectedClass}方案`;
    const nextScheme = {
      ...state.draftScheme,
      id: state.draftScheme.id || generateId(),
      name: schemeName,
      className: state.selectedClass,
      slots: { ...emptySlots(), ...state.draftScheme.slots },
      createdAt: state.draftScheme.createdAt || now,
      updatedAt: now
    };

    const index = store.schemes.findIndex((scheme) => String(scheme.id) === String(nextScheme.id));
    if (index >= 0) {
      store.schemes[index] = nextScheme;
    } else {
      store.schemes.unshift(nextScheme);
    }
    store.selectedSchemeId = nextScheme.id;
    state.selectedSchemeId = nextScheme.id;
    loadSchemeIntoDraft(nextScheme);
    saveRawData();
    renderAll();
    setMessage(`已保存方案「${schemeName}」。`, "info");
  }

  function deleteCurrentScheme() {
    if (!state.selectedAccount || !state.selectedSchemeId) {
      setMessage("当前没有已保存方案可删除。", "warn");
      return;
    }
    const store = outfitterStore();
    const target = store.schemes.find((scheme) => String(scheme.id) === String(state.selectedSchemeId));
    if (!target) return;
    if (!window.confirm(`确定删除方案「${target.name || "未命名方案"}」吗？`)) return;
    store.schemes = store.schemes.filter((scheme) => String(scheme.id) !== String(target.id));
    store.selectedSchemeId = "";
    state.selectedSchemeId = "";
    loadSchemeIntoDraft(createDraftScheme());
    saveRawData();
    renderAll();
    setMessage(`已删除方案「${target.name || "未命名方案"}」。`, "info");
  }

  function startNewScheme() {
    state.selectedSchemeId = "";
    outfitterStore().selectedSchemeId = "";
    state.searchResults = [];
    nodes.searchResultMeta.textContent = "";
    loadSchemeIntoDraft(createDraftScheme());
    renderAll();
    setMessage("已切换到新的未保存方案。", "info");
  }

  function handleAccountChange() {
    state.selectedAccount = nodes.accountSelect.value || "";
    localStorage.setItem(ACCOUNT_KEY, state.selectedAccount);
    state.slotFilter = "全部";
    state.activeSlot = "武器1";
    state.searchResults = [];
    nodes.searchResultMeta.textContent = "";
    loadCurrentScheme();
    renderAll();
  }

  function handleClassChange() {
    state.selectedClass = nodes.classSelect.value || classOrder[0];
    if (state.draftScheme) {
      state.draftScheme.className = state.selectedClass;
      clearInvalidWeapons();
    }
    state.searchResults = [];
    nodes.searchResultMeta.textContent = "";
    renderAll();
    setMessage(currentClassRuleLabel(), "info");
  }

  function copySummary() {
    const aggregates = aggregateStats();
    const payload = {
      account: state.selectedAccount,
      className: state.selectedClass,
      schemeName: state.draftScheme.name || "未命名方案",
      slots: state.draftScheme.slots,
      totals: aggregates.total,
      counts: aggregates.count
    };
    const text = JSON.stringify(payload, null, 2);
    navigator.clipboard.writeText(text)
      .then(() => setMessage("当前方案汇总已复制到剪贴板。", "info"))
      .catch(() => setMessage("复制失败，请检查浏览器权限。", "warn"));
  }

  function exportToGraduationBridge() {
    const payload = {
      account: state.selectedAccount,
      className: state.selectedClass,
      schemeName: state.draftScheme.name || "未命名方案",
      slots: state.draftScheme.slots,
      aggregates: aggregateStats(),
      exportedAt: new Date().toISOString()
    };
    localStorage.setItem(EXPORT_KEY, JSON.stringify(payload));
    setMessage("当前搭配已写入本地毕业率缓存，后续可以继续接入计算器页面。", "info");
  }

  function renderAll() {
    renderAccountOptions();
    renderClassOptions();
    renderSchemeOptions();
    nodes.schemeNameInput.value = state.draftScheme?.name || "";
    nodes.deleteSchemeButton.disabled = !state.selectedSchemeId;
    nodes.saveSchemeButton.disabled = !state.selectedAccount;
    nodes.newSchemeButton.disabled = !state.selectedAccount;
    nodes.clearBuildButton.disabled = !state.selectedAccount;
    nodes.copySummaryButton.disabled = !state.selectedAccount;
    nodes.exportBridgeButton.disabled = !state.selectedAccount;
    nodes.runSearchButton.disabled = !state.selectedAccount;
    nodes.addCriteriaButton.disabled = !state.selectedAccount || uniqueSearchTypes().length >= countableStatOptions().length;
    renderSearchMode();
    renderCriteriaList();
    renderSearchResults();
    renderSlotFilters();
    renderEquipmentList();
    renderSlots();
    renderSummary();
  }

  function init() {
    try {
      state.rawData = parseSavedData();
    } catch (error) {
      setMessage(`读取本地装备库失败：${error.message}`, "warn");
      return;
    }

    if (!state.rawData) {
      state.rawData = null;
      state.accounts = [];
      state.selectedAccount = "";
      state.draftScheme = createDraftScheme();
      state.searchCriteria = [{ id: generateId(), type: nextAvailableSearchType("会心率"), count: 1 }];
      state.searchResults = [];
      state.searchResultPage = 0;
      renderAll();
      setMessage("当前浏览器里还没有装备库数据，请先去装备管理器录入或导入装备。", "warn");
      return;
    }

    state.accounts = detectAccounts(state.rawData);
    const lastAccount = localStorage.getItem(ACCOUNT_KEY) || state.rawData.last_selected_account || "";
    state.selectedAccount = state.accounts.includes(lastAccount) ? lastAccount : state.accounts[0] || "";
    state.draftScheme = createDraftScheme();
    state.searchCriteria = [
      { id: generateId(), type: nextAvailableSearchType("会心率"), count: 1 },
      { id: generateId(), type: nextAvailableSearchType("精准率"), count: 1 }
    ];
    state.searchResults = [];
    loadCurrentScheme();
    renderAll();
    setMessage("已读取本地装备库，可以开始按流派进行双武器搭配。", "info");
  }

  nodes.accountSelect.addEventListener("change", handleAccountChange);
  nodes.classSelect.addEventListener("change", handleClassChange);
  nodes.schemeSelect.addEventListener("change", () => {
    const nextId = nodes.schemeSelect.value || "";
    state.selectedSchemeId = nextId;
    outfitterStore().selectedSchemeId = nextId;
    const target = outfitterStore().schemes.find((scheme) => String(scheme.id) === String(nextId));
    loadSchemeIntoDraft(target || createDraftScheme());
    renderAll();
  });
  nodes.schemeNameInput.addEventListener("input", () => {
    if (!state.draftScheme) return;
    state.draftScheme.name = nodes.schemeNameInput.value;
  });
  nodes.searchInput.addEventListener("input", () => {
    state.searchText = nodes.searchInput.value;
    renderEquipmentList();
  });
  nodes.newSchemeButton.addEventListener("click", startNewScheme);
  nodes.saveSchemeButton.addEventListener("click", saveCurrentScheme);
  nodes.deleteSchemeButton.addEventListener("click", deleteCurrentScheme);
  nodes.addCriteriaButton.addEventListener("click", () => {
    state.searchCriteria.push(createSearchCriterion());
    renderCriteriaList();
  });
  nodes.runSearchButton.addEventListener("click", runOutfitSearch);
  nodes.clearBuildButton.addEventListener("click", () => {
    if (!state.draftScheme) return;
    state.draftScheme.slots = emptySlots();
    renderAll();
    setMessage("当前搭配已清空。", "info");
  });
  nodes.copySummaryButton.addEventListener("click", copySummary);
  nodes.exportBridgeButton.addEventListener("click", exportToGraduationBridge);

  init();
})();
