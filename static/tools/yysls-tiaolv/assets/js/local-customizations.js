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

    api.ensureLevelSelect = ensureLevelSelect;
    api.ensureJsonControls = ensureJsonControls;
    api.downloadJsonDataAsFile = downloadJsonDataAsFile;
    api.handleJsonFileImport = handleJsonFileImport;

    ensureLevelSelect();
    ensureJsonControls();
    bindJsonControls();
})();
