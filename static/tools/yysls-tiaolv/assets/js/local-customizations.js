(function () {
    "use strict";

    const api = window.TiaolvLocalCustomizations = window.TiaolvLocalCustomizations || {};

    function insertAfter(referenceNode, newNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    function ensureLevelSelect() {
        if (document.getElementById("level-select")) return;
        const weaponTypeGroup = document.getElementById("weapon-type-group");
        if (!weaponTypeGroup || !weaponTypeGroup.parentNode) return;

        const wrapper = document.createElement("div");
        wrapper.className = "form-group flex-08";
        wrapper.innerHTML = '<label>装备等级</label> <select id="level-select"><option value="105" selected="selected">105级</option><option value="100">100级</option><option value="96">96级</option></select>';
        insertAfter(weaponTypeGroup, wrapper);
    }

    function ensureJsonControls() {
        const buttonRow = document.querySelector("#export-import-modal .export-import-buttons");
        const importLabel = document.querySelector('label[for="import-file-input"]');
        const pasteButton = document.getElementById("paste-import-btn");
        if (!buttonRow) return;

        let downloadButton = document.getElementById("download-json-data-btn");
        if (!downloadButton) {
            downloadButton = document.createElement("button");
            downloadButton.id = "download-json-data-btn";
            downloadButton.type = "button";
            downloadButton.className = "secondary-btn";
            downloadButton.textContent = "下载 JSON";
            const downloadTxt = document.getElementById("download-data-btn");
            downloadTxt ? insertAfter(downloadTxt, downloadButton) : buttonRow.appendChild(downloadButton);
        }

        if (!document.getElementById("import-json-file-input")) {
            const jsonLabel = document.createElement("label");
            jsonLabel.setAttribute("for", "import-json-file-input");
            jsonLabel.className = "secondary-btn cursor-pointer inline-flex";
            jsonLabel.innerHTML = '<input type="file" id="import-json-file-input" accept=".json,application/json" class="hidden"> 上传 JSON';
            if (importLabel) insertAfter(importLabel, jsonLabel);
            else if (pasteButton) buttonRow.insertBefore(jsonLabel, pasteButton);
            else buttonRow.appendChild(jsonLabel);
        }
    }

    function buildExportEquipData() {
        if ("function" != typeof getDB) return [];
        return getDB().map(function (equip) {
            const item = {
                slotId: equip.slotId,
                weaponTypeId: equip.weaponTypeId || null,
                name: equip.name,
                isChengyin: equip.isChengyin || false,
                isPurple: equip.isPurple || false,
                level: equip.level || 105,
                availableClasses: "function" == typeof normalizeAvailableClassesForEquip ? normalizeAvailableClassesForEquip(equip) : equip.availableClasses || [],
                mainStat: {
                    type: equip.mainStat.type,
                    value: equip.mainStat.value
                },
                subStats: (equip.subStats || []).map(function (stat) {
                    return {
                        type: stat.type,
                        value: stat.value
                    };
                })
            };
            if (equip.dingyinStat) {
                item.dingyinStat = {
                    type: equip.dingyinStat.type,
                    value: equip.dingyinStat.value
                };
            }
            var zhuanlv = getZhuanlvForEquip(equip.id);
            if (zhuanlv) item.zhuanlv = zhuanlv;
            return item;
        });
    }

    function buildJsonPayload() {
        if ("undefined" == typeof AppState || !AppState.currentAccount) {
            alert("请先选择角色");
            return null;
        }
        return {
            version: "1.2",
            format: "plain-json",
            accountName: AppState.currentAccount,
            exportedAt: (new Date()).toISOString(),
            equipData: buildExportEquipData()
        };
    }

    function isValidJsonPayload(payload) {
        return payload && "object" == typeof payload && !!payload.accountName && Array.isArray(payload.equipData);
    }

    function downloadJsonDataAsFile() {
        const payload = buildJsonPayload();
        if (!payload) return;
        const text = JSON.stringify(payload, null, 2);
        const blob = new Blob([text], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${AppState.currentAccount}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // JSON 导入时从 payload 中提取的 zhuanlv 记录，按 "name|slotId" 索引
    // null 表示本次是常规文件导入（或尚未发生 JSON 导入）
    var _pendingZhuanlvFromJson = null;

    function handleJsonFileImport(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (loadEvent) {
            try {
                const payload = JSON.parse(loadEvent.target.result);
                if (!isValidJsonPayload(payload)) {
                    alert("JSON 数据格式错误，请确认包含 accountName 和 equipData");
                    return;
                }
                if ("function" != typeof encryptData || "function" != typeof showImportWarning) {
                    alert("页面尚未初始化完成，请稍后再试");
                    return;
                }
                const encoded = encryptData(payload);
                if (!encoded) {
                    alert("JSON 数据转换失败，请重试");
                    return;
                }
                // 提取 zhuanlv 数据，按 "name|slotId" 暂存，等确认导入后按名称写回
                _pendingZhuanlvFromJson = {};
                (payload.equipData || []).forEach(function(item) {
                    if (item.zhuanlv) {
                        var key = (item.name || "") + "|" + (item.slotId || "");
                        _pendingZhuanlvFromJson[key] = item.zhuanlv;
                    }
                });
                const textarea = document.getElementById("export-import-textarea");
                textarea.value = encoded;
                showImportWarning();
            } catch (error) {
                console.error("解析JSON数据失败:", error);
                alert("JSON 文件解析失败：" + error.message);
            }
        };
        reader.readAsText(file);
        event.target.value = "";
    }

    function bindJsonControls() {
        const downloadButton = document.getElementById("download-json-data-btn");
        const importInput = document.getElementById("import-json-file-input");
        if (downloadButton) downloadButton.onclick = downloadJsonDataAsFile;
        if (importInput) importInput.onchange = handleJsonFileImport;
    }

    function renderBuildStatsSummary(equippedItems, className) {
        var SLOT_KEYS = ["weapon1", "weapon2", "head", "chest", "ring", "pendant", "legs", "hands"];
        // className 由调用方（GradModal 模板）传入，回退到 AppState
        var currentClass = className || (window.AppState && window.AppState.currentClass) || "";
        var flowAttr = "";
        if (currentClass.indexOf("鸣金") === 0) flowAttr = "鸣金";
        else if (currentClass.indexOf("裂石") === 0) flowAttr = "裂石";
        else if (currentClass.indexOf("牵丝") === 0) flowAttr = "牵丝";
        else if (currentClass.indexOf("破竹") === 0) flowAttr = "破竹";

        // 攻击行：最大外攻 → 最小外攻 → 本流派大属攻 → 本流派小属攻 → 其他
        var attackOrder = ["最大外功攻击", "最小外功攻击"];
        if (flowAttr) {
            attackOrder.push("最大" + flowAttr + "攻击");
            attackOrder.push("最小" + flowAttr + "攻击");
        }
        ["鸣金", "裂石", "牵丝", "破竹"].forEach(function (attr) {
            if (attr !== flowAttr) {
                attackOrder.push("最大" + attr + "攻击");
                attackOrder.push("最小" + attr + "攻击");
            }
        });

        var CATEGORIES = [
            {
                label: "三率",
                stats: ["精准率", "会心率", "会意率"]
            },
            {
                label: "五维",
                stats: ["劲", "敏", "势"]
            },
            {
                label: "攻击",
                stats: attackOrder
            },
            {
                label: "神力",
                stats: [
                    "全武学增效", "对首领单位增伤", "对玩家单位增效",
                    "单体类奇术增伤", "群体类奇术增伤",
                    "剑武学增效", "枪武学增效", "伞武学增效", "扇武学增效",
                    "绳标武学增效", "双刀武学增效", "陌刀武学增效",
                    "横刀武学增效", "拳甲武学增效", "鼓武学增效"
                ]
            }
        ];

        var statsMap = {};
        SLOT_KEYS.forEach(function (slot) {
            var equip = equippedItems && equippedItems[slot];
            if (!equip) return;

            var ms = equip.mainStat;
            if (ms && ms.type && ms.type !== "生存类词条") {
                if (!statsMap[ms.type]) statsMap[ms.type] = { count: 0, total: 0, isPercent: !!ms.isPercent };
                statsMap[ms.type].count += 1;
                statsMap[ms.type].total += (ms.value || 0);
            }

            (equip.subStats || []).forEach(function (ss) {
                if (!ss || !ss.type) return;
                if (!statsMap[ss.type]) statsMap[ss.type] = { count: 0, total: 0, isPercent: !!ss.isPercent };
                statsMap[ss.type].count += 1;
                statsMap[ss.type].total += (ss.value || 0);
            });
            // dingyinStat intentionally not counted
        });

        var ATTACK_ABBR = {
            "最大外功攻击": "大外", "最小外功攻击": "小外",
            "最大鸣金攻击": "大鸣金", "最小鸣金攻击": "小鸣金",
            "最大裂石攻击": "大裂石", "最小裂石攻击": "小裂石",
            "最大牵丝攻击": "大牵丝", "最小牵丝攻击": "小牵丝",
            "最大破竹攻击": "大破竹", "最小破竹攻击": "小破竹"
        };

        function renderChip(type) {
            var s = statsMap[type];
            if (!s || s.count === 0) return "";
            var label = ATTACK_ABBR[type] || type;
            var totalStr = s.isPercent
                ? (Math.round(s.total * 10) / 10) + "%"
                : (Math.round(s.total * 10) / 10) + "";
            return "<span style=\"display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:4px;font-size:0.78rem;white-space:nowrap;\">"
                + "<span style=\"color:var(--text-main);\">" + label + "</span>"
                + "<span style=\"color:var(--gold);font-weight:700;\">×" + s.count + "</span>"
                + "<span style=\"color:var(--text-sub);\">+" + totalStr + "</span>"
                + "</span>";
        }

        var rows = "";
        CATEGORIES.forEach(function (cat) {
            var chips = cat.stats.map(renderChip).join("");
            if (!chips) return;
            rows += "<div style=\"display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px;\">" + chips + "</div>";
        });

        if (!rows) return "";

        return "<div style=\"margin-top:12px;padding:10px 12px;background:rgba(0,0,0,0.2);border-radius:6px;border:1px solid var(--border);\">"
            + "<div style=\"font-size:0.8rem;color:var(--text-sub);margin-bottom:8px;\">词条汇总（主+副，不含定音）</div>"
            + rows
            + "</div>";
    }

    window.cancelBestBuildSearch = function () {
        if (window.GradModal && window.GradModal.state) {
            window.GradModal.state.bestBuildCancelled = true;
            var btn = document.getElementById("best-build-cancel-btn");
            if (btn) { btn.disabled = true; btn.textContent = "正在取消..."; }
        }
    };

    var _bestBuildObserver = new MutationObserver(function () {
        var progressText = document.getElementById("best-build-progress-text");
        if (progressText && !document.getElementById("best-build-cancel-btn")) {
            var btn = document.createElement("button");
            btn.id = "best-build-cancel-btn";
            btn.textContent = "取消搜索";
            btn.onclick = window.cancelBestBuildSearch;
            btn.style.cssText = "margin-top:12px;padding:6px 20px;background:transparent;border:1px solid var(--border);color:var(--text-sub);border-radius:6px;cursor:pointer;font-size:0.85rem;display:block;margin-left:auto;margin-right:auto;";
            progressText.parentNode.insertBefore(btn, progressText.nextSibling);
        }
    });
    _bestBuildObserver.observe(document.body, { childList: true, subtree: true });

    // ─────────────────────────────────────────
    // 转律状态模块
    // ─────────────────────────────────────────

    var _pendingZhuanlv = null;   // 新装备保存时暂存的转律状态
    var _currentEditEquipId = null; // 当前弹窗正在编辑的装备 ID（0 = 新建）

    function getZhuanlvStorageKey() {
        try {
            return (typeof AppState !== "undefined" && AppState.currentAccount)
                ? "zhuanlv_status_" + AppState.currentAccount
                : null;
        } catch (e) { return null; }
    }

    function loadZhuanlvMap() {
        var k = getZhuanlvStorageKey();
        if (!k) return {};
        try {
            var raw = localStorage.getItem(k);
            var parsed = raw ? JSON.parse(raw) : {};
            return (parsed && typeof parsed === "object") ? parsed : {};
        } catch (e) { return {}; }
    }

    function saveZhuanlvMap(map) {
        var k = getZhuanlvStorageKey();
        if (!k) return;
        try { localStorage.setItem(k, JSON.stringify(map || {})); } catch (e) {}
    }

    function getZhuanlvForEquip(equipId) {
        if (!equipId) return null;
        return loadZhuanlvMap()[String(equipId)] || null;
    }

    function setZhuanlvForEquip(equipId, status) {
        if (!equipId) return;
        var map = loadZhuanlvMap();
        if (status === null || status === undefined) {
            delete map[String(equipId)];
        } else {
            map[String(equipId)] = status;
        }
        saveZhuanlvMap(map);
    }

    // 从表单 sub-stat-select 读取可用的词条类型选项
    function getSubStatOptions() {
        var sel = document.querySelector(".sub-stat-select");
        if (!sel) return [];
        var opts = [];
        for (var i = 0; i < sel.options.length; i++) {
            var o = sel.options[i];
            if (o.value) opts.push({ value: o.value, text: o.text });
        }
        return opts;
    }

    // 读取表单中第 idx 条副词条当前选中的词条类型名
    function getSubStatLabelAt(idx) {
        var rows = document.querySelectorAll("#sub-stats-container .stat-row");
        var row = rows[idx];
        if (!row) return "";
        var sel = row.querySelector(".sub-stat-select");
        return (sel && sel.value) ? sel.value : "";
    }

    // 刷新「选定副词条」下拉的选项文字
    function updateSubStatIndexLabels() {
        var sel = document.getElementById("zhuanlv-substat-index");
        if (!sel) return;
        var rows = document.querySelectorAll("#sub-stats-container .stat-row");
        for (var i = 0; i < sel.options.length; i++) {
            var label = getSubStatLabelAt(i);
            sel.options[i].text = "第" + (i + 1) + "条" + (label ? "（" + label + "）" : "");
        }
    }

    // 构建单个目标词条下拉行
    function buildTargetRow(value, canDelete) {
        var opts = getSubStatOptions();
        var optHtml = '<option value="">请选择词条</option>';
        opts.forEach(function(o) {
            optHtml += '<option value="' + o.value + '"' + (o.value === value ? ' selected' : '') + '>' + o.text + '</option>';
        });

        var row = document.createElement("div");
        row.className = "zhuanlv-target-row";
        row.style.cssText = "display:flex;align-items:center;gap:6px;margin-bottom:4px;";
        row.innerHTML = '<select class="stat-select zhuanlv-target-select" style="flex:1;">' + optHtml + '</select>'
            + '<button type="button" class="zhuanlv-target-remove remove-btn" style="'
            + (canDelete ? '' : 'visibility:hidden;')
            + '">✕</button>';

        row.querySelector(".zhuanlv-target-remove").addEventListener("click", function() {
            row.parentNode.removeChild(row);
            refreshTargetDeleteButtons();
            updateAddTargetBtnVisibility();
        });
        return row;
    }

    function refreshTargetDeleteButtons() {
        var rows = document.querySelectorAll("#zhuanlv-targets-container .zhuanlv-target-row");
        rows.forEach(function(r, i) {
            var btn = r.querySelector(".zhuanlv-target-remove");
            if (btn) btn.style.visibility = (rows.length > 1) ? "visible" : "hidden";
        });
    }

    function updateAddTargetBtnVisibility() {
        var btn = document.getElementById("zhuanlv-add-target-btn");
        if (!btn) return;
        var count = document.querySelectorAll("#zhuanlv-targets-container .zhuanlv-target-row").length;
        btn.style.display = count < 3 ? "inline-block" : "none";
    }

    // 向 modal 注入转律状态 section（幂等）
    function ensureZhuanlvSection() {
        if (document.getElementById("zhuanlv-section")) return;

        var section = document.createElement("div");
        section.id = "zhuanlv-section";
        section.style.cssText = "display:none;"; // 初始隐藏，等 level 确认后再显示

        section.innerHTML = [
            '<hr>',
            '<h3 style="margin-bottom:8px;">转律状态</h3>',
            '<div class="form-row" style="align-items:flex-start;flex-wrap:wrap;gap:10px;">',
            '  <div class="form-group" style="min-width:160px;">',
            '    <label>状态</label>',
            '    <select id="zhuanlv-state-select" class="stat-select">',
            '      <option value="default">锁死 / 默认</option>',
            '      <option value="none">未转律</option>',
            '      <option value="active">已转律（可继续转）</option>',
            '    </select>',
            '  </div>',
            '</div>',
            '<div id="zhuanlv-active-fields" style="display:none;margin-top:8px;">',
            '  <div class="form-row" style="margin-bottom:8px;">',
            '    <div class="form-group" style="min-width:200px;">',
            '      <label>选定副词条</label>',
            '      <select id="zhuanlv-substat-index" class="stat-select">',
            '        <option value="0">第1条</option>',
            '        <option value="1">第2条</option>',
            '        <option value="2">第3条</option>',
            '        <option value="3">第4条</option>',
            '      </select>',
            '    </div>',
            '  </div>',
            '  <div>',
            '    <label style="display:block;margin-bottom:6px;font-size:0.85rem;color:var(--text-sub);">可转目标（1-3个）</label>',
            '    <div id="zhuanlv-targets-container"></div>',
            '    <button type="button" id="zhuanlv-add-target-btn" class="secondary-btn" style="margin-top:4px;font-size:0.8rem;padding:3px 10px;">+ 添加目标</button>',
            '  </div>',
            '</div>'
        ].join("");

        // 插入到 modal-footer 之前
        var footer = document.querySelector("#equip-form .modal-footer");
        if (!footer) return;
        footer.parentNode.insertBefore(section, footer);

        // 状态切换：显隐 active fields + 立即保存
        document.getElementById("zhuanlv-state-select").addEventListener("change", function() {
            var activeFields = document.getElementById("zhuanlv-active-fields");
            activeFields.style.display = this.value === "active" ? "block" : "none";
            if (this.value === "active") {
                var container = document.getElementById("zhuanlv-targets-container");
                if (!container.querySelector(".zhuanlv-target-row")) {
                    container.appendChild(buildTargetRow("", false));
                }
                updateSubStatIndexLabels();
                updateAddTargetBtnVisibility();
            }
            autoSaveZhuanlv();
        });

        // 添加目标按钮
        document.getElementById("zhuanlv-add-target-btn").addEventListener("click", function() {
            var container = document.getElementById("zhuanlv-targets-container");
            container.appendChild(buildTargetRow("", true));
            refreshTargetDeleteButtons();
            updateAddTargetBtnVisibility();
            autoSaveZhuanlv();
        });

        // 副词条 select 变化时更新选定副词条标签
        document.getElementById("sub-stats-container").addEventListener("change", function(e) {
            if (e.target.classList.contains("sub-stat-select")) {
                updateSubStatIndexLabels();
            }
        });

        // zhuanlv-section 内任意 select 变化时立即保存
        section.addEventListener("change", function(e) {
            if (e.target.id !== "zhuanlv-state-select") { // 状态 select 已单独处理
                autoSaveZhuanlv();
            }
        });
    }

    // 读取表单中的转律状态数据
    function readZhuanlvFromForm() {
        var stateSel = document.getElementById("zhuanlv-state-select");
        if (!stateSel) return null;
        var state = stateSel.value;
        if (state === "default") return null; // 不存储
        if (state === "none") return { state: "none" };

        // active
        var subStatIndex = parseInt(document.getElementById("zhuanlv-substat-index").value) || 0;
        var targetSels = document.querySelectorAll("#zhuanlv-targets-container .zhuanlv-target-select");
        var targets = [];
        targetSels.forEach(function(s) { if (s.value) targets.push(s.value); });
        if (targets.length === 0) return null;
        return { state: "active", subStatIndex: subStatIndex, targets: targets };
    }

    // 即时保存：用户改动时调用
    function autoSaveZhuanlv() {
        if (_currentEditEquipId) {
            setZhuanlvForEquip(_currentEditEquipId, readZhuanlvFromForm());
        } else {
            _pendingZhuanlv = readZhuanlvFromForm();
        }
    }

    function saveZhuanlvFromModal(equipId) {
        var status = readZhuanlvFromForm();
        setZhuanlvForEquip(equipId, status);
        setTimeout(refreshAllZhuanlvBadges, 100);
    }

    // 从存储数据回填表单
    function populateZhuanlvSection(equipId) {
        var stateSel = document.getElementById("zhuanlv-state-select");
        if (!stateSel) return;

        var status = equipId ? getZhuanlvForEquip(equipId) : null;
        var container = document.getElementById("zhuanlv-targets-container");
        container.innerHTML = "";
        document.getElementById("zhuanlv-active-fields").style.display = "none";

        if (!status || status.state === "default") {
            stateSel.value = "default";
        } else if (status.state === "none") {
            stateSel.value = "none";
        } else if (status.state === "active") {
            stateSel.value = "active";
            document.getElementById("zhuanlv-active-fields").style.display = "block";
            var idxSel = document.getElementById("zhuanlv-substat-index");
            idxSel.value = String(status.subStatIndex || 0);
            var targets = status.targets || [];
            if (targets.length === 0) targets = [""];
            targets.forEach(function(t, i) {
                container.appendChild(buildTargetRow(t, i > 0));
            });
            refreshTargetDeleteButtons();
            updateAddTargetBtnVisibility();
            // 延迟更新 label，等副词条 select 渲染完
            setTimeout(updateSubStatIndexLabels, 50);
        }
    }

    function isCurrentEquipChengyin() {
        var cb = document.getElementById("is-chengyin");
        return !!(cb && cb.checked);
    }

    // 根据 level 和承音状态决定是否显示转律 section，同时控制转律CD按钮
    function syncZhuanlvSectionVisibility() {
        var section = document.getElementById("zhuanlv-section");
        var levelSel = document.getElementById("level-select");
        var level = levelSel ? parseInt(levelSel.value) : 105;
        var isChengyin = isCurrentEquipChengyin();
        var allow = level === 105 && !isChengyin;

        if (section) section.style.display = allow ? "block" : "none";

        // 承音装备强制隐藏转律CD按钮
        if (isChengyin) {
            var wrap = document.getElementById("equip-transmute-cd-wrap");
            if (wrap) wrap.classList.add("hidden");
        }
    }

    // app.min.js 加载完后，包装 updateEquipModalTransmuteCdVisibility
    // 使其在承音装备时始终隐藏 CD 按钮
    function patchTransmuteCdVisibility() {
        var orig = window.updateEquipModalTransmuteCdVisibility;
        if (!orig) return;
        window.updateEquipModalTransmuteCdVisibility = function() {
            orig.apply(this, arguments);
            if (isCurrentEquipChengyin()) {
                var wrap = document.getElementById("equip-transmute-cd-wrap");
                if (wrap) wrap.classList.add("hidden");
            }
        };
    }

    // ── 卡片徽标注入 ──────────────────────────────

    function buildZhuanlvTag(text, color) {
        return '<span class="zhuanlv-badge" style="'
            + 'font-size:0.72rem;border:1px solid ' + color + ';color:' + color + ';'
            + 'padding:0 5px;border-radius:3px;white-space:nowrap;">'
            + text + '</span>';
    }

    function renderZhuanlvBadgeOnCard(cardEl, status) {
        // 移除旧的注入元素
        cardEl.querySelectorAll(".zhuanlv-badge,.zhuanlv-targets-line,.zhuanlv-substat-marker")
            .forEach(function(el) { el.parentNode && el.parentNode.removeChild(el); });

        if (!status) return; // 锁死/默认，无标记

        // 找卡片 header 中的 flex 行（含 [105] 等标签的那行）
        var flexRow = cardEl.querySelector(".card-header .card-title div[style]");

        if (status.state === "none") {
            if (flexRow) flexRow.insertAdjacentHTML("beforeend", buildZhuanlvTag("未转律", "#888"));
            return;
        }

        if (status.state === "active") {
            var idx = status.subStatIndex || 0;
            if (flexRow) {
                flexRow.insertAdjacentHTML("beforeend",
                    buildZhuanlvTag("转律:第" + (idx + 1) + "条", "#f0a500"));
            }

            // 标记选定副词条行（只选含 .sub-stat 的行）
            var subStatRows = Array.prototype.filter.call(
                cardEl.querySelectorAll(".card-body .stat-line"),
                function(r) { return r.querySelector(".sub-stat"); }
            );
            var targetRow = subStatRows[idx];
            if (targetRow) {
                var subStatSpan = targetRow.querySelector(".sub-stat");
                if (subStatSpan) {
                    // 找到文字节点（如 "· 精准率"），在 "· " 之后插入箭头
                    var textNode = subStatSpan.firstChild;
                    var marker = document.createElement("span");
                    marker.className = "zhuanlv-substat-marker";
                    marker.style.cssText = "color:#f0a500;font-weight:700;margin-right:2px;";
                    marker.textContent = "►";
                    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                        // 把文字节点从 "· 精准率" 拆成 "· " 和 "精准率"，中间插箭头
                        var dotEnd = textNode.textContent.indexOf(" ") + 1 || 2;
                        var afterDot = textNode.splitText(dotEnd);
                        subStatSpan.insertBefore(marker, afterDot);
                    } else {
                        subStatSpan.insertBefore(marker, subStatSpan.firstChild);
                    }
                }
            }

            // 在卡片底部追加「可转目标」行
            if (status.targets && status.targets.length > 0) {
                var cardBody = cardEl.querySelector(".card-body");
                if (cardBody) {
                    var line = document.createElement("div");
                    line.className = "zhuanlv-targets-line";
                    line.style.cssText = "font-size:0.75rem;color:#f0a500;margin-top:5px;"
                        + "padding-top:4px;border-top:1px dashed rgba(240,165,0,0.3);";
                    line.textContent = "可转 → " + status.targets.join(" / ");
                    cardBody.appendChild(line);
                }
            }
        }
    }

    // 给没有 data-equip-id 的卡片注入 ID（通过装备名称+位置匹配）
    function injectEquipIdsOnCards() {
        if ("function" !== typeof getDB) return;
        var db = getDB();
        var cards = document.querySelectorAll("#equipment-grid .equip-card");
        cards.forEach(function(card) {
            if (card.getAttribute("data-equip-id")) return;
            var h3 = card.querySelector("h3");
            if (!h3) return;
            var name = h3.textContent.trim();
            // 找第一个同名装备（名称通常唯一）
            var equip = null;
            for (var i = 0; i < db.length; i++) {
                if (db[i].name === name) { equip = db[i]; break; }
            }
            if (equip) card.setAttribute("data-equip-id", String(equip.id));
        });
    }

    // 把卡片头部「武器 (承音)」里的 (承音) 改为绿色
    function colorChengyinOnCards() {
        document.querySelectorAll("#equipment-grid .equip-card").forEach(function(card) {
            if (card.getAttribute("data-chengyin-colored")) return;
            var slotSpan = card.querySelector(".card-header .card-title div span:first-child");
            if (!slotSpan) return;
            var text = slotSpan.textContent;
            var mark = " (承音)";
            if (text.indexOf(mark) === -1) return;
            var slotName = text.replace(mark, "");
            slotSpan.innerHTML = slotName + ' <span style="color:#4caf50;">(承音)</span>';
            card.setAttribute("data-chengyin-colored", "1");
        });
    }

    function refreshAllZhuanlvBadges() {
        injectEquipIdsOnCards();
        colorChengyinOnCards();
        var cards = document.querySelectorAll("#equipment-grid .equip-card[data-equip-id]");
        cards.forEach(function(card) {
            var id = card.getAttribute("data-equip-id");
            if (!id) return;
            var status = getZhuanlvForEquip(parseInt(id));
            renderZhuanlvBadgeOnCard(card, status);
        });
    }

    // ── MutationObserver 初始化 ───────────────────

    function initZhuanlvObservers() {
        // 监听 modal 显隐
        var modal = document.getElementById("modal");
        if (modal) {
            new MutationObserver(function(mutations) {
                mutations.forEach(function(m) {
                    if (m.attributeName === "class") {
                        var isVisible = !modal.classList.contains("hidden");
                        if (isVisible) {
                            ensureZhuanlvSection();
                            syncZhuanlvSectionVisibility();
                            var editId = document.getElementById("edit-id");
                            var id = editId ? parseInt(editId.value) : 0;
                            _currentEditEquipId = id || null;
                            populateZhuanlvSection(_currentEditEquipId);
                        } else {
                            _currentEditEquipId = null;
                        }
                    }
                });
            }).observe(modal, { attributes: true });
        }

        // 监听 level-select 和 is-chengyin 变化（用事件委托，两者都可能影响 section 显隐）
        document.addEventListener("change", function(e) {
            if (e.target && (e.target.id === "level-select" || e.target.id === "is-chengyin")) {
                syncZhuanlvSectionVisibility();
            }
        });

        // 监听 equipment-grid 子节点变化，刷新徽标
        var grid = document.getElementById("equipment-grid");
        if (grid) {
            new MutationObserver(function() {
                // 处理 _pendingZhuanlv（新装备保存后）
                if (_pendingZhuanlv !== null) {
                    var pending = _pendingZhuanlv;
                    _pendingZhuanlv = null;
                    if ("function" === typeof getDB) {
                        var db = getDB();
                        if (db.length > 0) {
                            var latest = db[db.length - 1];
                            setZhuanlvForEquip(latest.id, pending);
                        }
                    }
                }
                setTimeout(refreshAllZhuanlvBadges, 80);
            }).observe(grid, { childList: true, subtree: true });
        } else {
            // grid 可能还未渲染，延迟等待
            var _gridObserver = new MutationObserver(function() {
                var g = document.getElementById("equipment-grid");
                if (g) {
                    _gridObserver.disconnect();
                    new MutationObserver(function() {
                        if (_pendingZhuanlv !== null) {
                            var pending = _pendingZhuanlv;
                            _pendingZhuanlv = null;
                            if ("function" === typeof getDB) {
                                var db = getDB();
                                if (db.length > 0) {
                                    setZhuanlvForEquip(db[db.length - 1].id, pending);
                                }
                            }
                        }
                        setTimeout(refreshAllZhuanlvBadges, 80);
                    }).observe(g, { childList: true, subtree: true });
                }
            });
            _gridObserver.observe(document.body, { childList: true, subtree: true });
        }
    }

    // ─────────────────────────────────────────
    // 常规文件导入后清空 zhuanlv map
    // ─────────────────────────────────────────

    function initRegularImportClear() {
        var confirmBtn = document.getElementById("confirm-import-btn");
        var importModal = document.getElementById("export-import-modal");
        if (!confirmBtn || !importModal) return;

        var _importConfirmed = false;

        // 点击「确认导入」时设标记
        confirmBtn.addEventListener("click", function() {
            _importConfirmed = true;
        }, true);

        // 导入弹窗关闭时处理 zhuanlv
        new MutationObserver(function() {
            var isHidden = importModal.classList.contains("hidden");
            if (!isHidden || !_importConfirmed) return;
            _importConfirmed = false;

            if (_pendingZhuanlvFromJson === null) {
                // 常规文件导入：没有 zhuanlv 信息，全部重置为默认
                saveZhuanlvMap({});
            } else {
                // JSON 导入：按装备名称+槽位匹配新 ID，写回 zhuanlv 数据
                var pending = _pendingZhuanlvFromJson;
                _pendingZhuanlvFromJson = null;
                if ("function" === typeof getDB && Object.keys(pending).length > 0) {
                    var newMap = {};
                    getDB().forEach(function(equip) {
                        var key = (equip.name || "") + "|" + (equip.slotId || "");
                        if (pending[key]) newMap[String(equip.id)] = pending[key];
                    });
                    saveZhuanlvMap(newMap);
                } else {
                    _pendingZhuanlvFromJson = null;
                    saveZhuanlvMap({});
                }
            }
            setTimeout(refreshAllZhuanlvBadges, 150);
        }).observe(importModal, { attributes: true, attributeFilter: ["class"] });
    }

    // ─────────────────────────────────────────────

    api.ensureLevelSelect = ensureLevelSelect;
    api.ensureJsonControls = ensureJsonControls;
    api.downloadJsonDataAsFile = downloadJsonDataAsFile;
    api.handleJsonFileImport = handleJsonFileImport;
    api.renderBuildStatsSummary = renderBuildStatsSummary;
    api.loadZhuanlvMap = loadZhuanlvMap;
    api.refreshAllZhuanlvBadges = refreshAllZhuanlvBadges;

    ensureLevelSelect();
    ensureJsonControls();
    bindJsonControls();
    initZhuanlvObservers();
    window.addEventListener("load", function() {
        patchTransmuteCdVisibility();
        initRegularImportClear();
    });
})();
