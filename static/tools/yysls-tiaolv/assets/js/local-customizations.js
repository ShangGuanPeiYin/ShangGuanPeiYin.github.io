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

    api.ensureLevelSelect = ensureLevelSelect;
    api.ensureJsonControls = ensureJsonControls;
    api.downloadJsonDataAsFile = downloadJsonDataAsFile;
    api.handleJsonFileImport = handleJsonFileImport;
    api.renderBuildStatsSummary = renderBuildStatsSummary;

    ensureLevelSelect();
    ensureJsonControls();
    bindJsonControls();
})();
