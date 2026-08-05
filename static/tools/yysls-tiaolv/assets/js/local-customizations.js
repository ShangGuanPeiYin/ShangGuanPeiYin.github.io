(function () {
    "use strict";

    const api = window.TiaolvLocalCustomizations = window.TiaolvLocalCustomizations || {};
    const REMOVED_TRANSMUTATION_CD_MARKER = "tiaolv_transmutation_cd_removed_v1";
    const TRANSMUTATION_LEVEL_MIGRATION_MARKER = "tiaolv_transmutation_level_110_v1";
    const TRANSMUTATION_TWO_STATE_MIGRATION_MARKER = "tiaolv_transmutation_two_state_v2";
    const TRANSMUTATION_EXPLICIT_ELIGIBILITY_MARKER = "tiaolv_transmutation_explicit_eligibility_v3";
    const TRANSMUTATION_STATUS_MODEL_VERSION = 3;

    function isTransmutableEquip(equip) {
        return !!equip && 110 === Number(equip.level) && true === equip.isTransmutable;
    }

    function normalizeZhuanlvStatus(status, equip) {
        if (!isTransmutableEquip(equip) || !status || "active" !== status.state) return null;
        var modelVersion = Number(status.modelVersion);
        if (modelVersion !== 2 && modelVersion !== TRANSMUTATION_STATUS_MODEL_VERSION) return null;
        var subStatIndex = Number(status.subStatIndex);
        if (!Number.isInteger(subStatIndex) || subStatIndex < 0
            || !Array.isArray(equip.subStats) || !equip.subStats[subStatIndex]
            || !equip.subStats[subStatIndex].type) return null;
        var excludedTargets = (TRANSMUTATION_STATUS_MODEL_VERSION === modelVersion && Array.isArray(status.excludedTargets))
            ? status.excludedTargets.filter(function(t) { return "string" === typeof t && !!t; })
            : [];
        return { state: "active", subStatIndex: subStatIndex, excludedTargets: excludedTargets, modelVersion: TRANSMUTATION_STATUS_MODEL_VERSION };
    }

    function filterZhuanlvMapForEquips(map, equips) {
        var equipById = new Map((equips || []).map(function(equip) {
            return [String(equip.id), equip];
        }));
        var result = {};
        Object.keys(map || {}).forEach(function(equipId) {
            var status = normalizeZhuanlvStatus(map[equipId], equipById.get(String(equipId)));
            if (status) result[equipId] = status;
        });
        return result;
    }

    function migrateTransmutationStatusesToTwoState() {
        try {
            if ("1" === localStorage.getItem(TRANSMUTATION_TWO_STATE_MIGRATION_MARKER)) return;
            if ("1" === localStorage.getItem(TRANSMUTATION_EXPLICIT_ELIGIBILITY_MARKER)) {
                localStorage.setItem(TRANSMUTATION_TWO_STATE_MIGRATION_MARKER, "1");
                return;
            }
            var statusKeys = [];
            for (var index = 0; index < localStorage.length; index++) {
                var key = localStorage.key(index);
                if (key && 0 === key.indexOf("zhuanlv_status_")) statusKeys.push(key);
            }
            statusKeys.forEach(function(statusKey) { localStorage.setItem(statusKey, "{}"); });
            localStorage.setItem(TRANSMUTATION_TWO_STATE_MIGRATION_MARKER, "1");
        } catch (error) {
            console.warn("迁移两状态转律数据失败：", error);
        }
    }

    function migrateTransmutationToExplicitEligibility() {
        try {
            if ("1" === localStorage.getItem(TRANSMUTATION_EXPLICIT_ELIGIBILITY_MARKER)) return;
            var equipKeys = [];
            for (var index = 0; index < localStorage.length; index++) {
                var key = localStorage.key(index);
                if (key && 0 === key.indexOf("game_equip_data_")) equipKeys.push(key);
            }
            equipKeys.forEach(function(equipKey) {
                var accountName = equipKey.slice("game_equip_data_".length);
                var statusKey = "zhuanlv_status_" + accountName;
                var statusMap = parseStoredObject(statusKey);
                var cleanStatusMap = {};
                var equips = parseStoredArray(equipKey).map(function(equip) {
                    var rawStatus = statusMap[String(equip.id)];
                    var subStatIndex = rawStatus ? Number(rawStatus.subStatIndex) : -1;
                    var validActive = 110 === Number(equip.level)
                        && rawStatus && "active" === rawStatus.state
                        && (2 === Number(rawStatus.modelVersion) || TRANSMUTATION_STATUS_MODEL_VERSION === Number(rawStatus.modelVersion))
                        && Number.isInteger(subStatIndex) && subStatIndex >= 0
                        && Array.isArray(equip.subStats) && equip.subStats[subStatIndex]
                        && !!equip.subStats[subStatIndex].type;
                    equip.isTransmutable = 110 === Number(equip.level)
                        && (true === equip.isTransmutable || validActive);
                    if (validActive) {
                        cleanStatusMap[String(equip.id)] = {
                            state: "active",
                            subStatIndex: subStatIndex,
                            excludedTargets: [],
                            modelVersion: TRANSMUTATION_STATUS_MODEL_VERSION
                        };
                    }
                    return equip;
                });
                localStorage.setItem(equipKey, JSON.stringify(equips));
                localStorage.setItem(statusKey, JSON.stringify(cleanStatusMap));
            });
            localStorage.setItem(TRANSMUTATION_EXPLICIT_ELIGIBILITY_MARKER, "1");
        } catch (error) {
            console.warn("迁移显式可转律资格失败：", error);
        }
    }

    function migrateTransmutationStatusesToLevel110() {
        try {
            if ("1" === localStorage.getItem(TRANSMUTATION_LEVEL_MIGRATION_MARKER)) return;
            var statusKeys = [];
            for (var index = 0; index < localStorage.length; index++) {
                var key = localStorage.key(index);
                if (key && 0 === key.indexOf("zhuanlv_status_")) statusKeys.push(key);
            }
            statusKeys.forEach(function(statusKey) {
                var accountName = statusKey.slice("zhuanlv_status_".length);
                var equips = parseStoredArray("game_equip_data_" + accountName);
                var cleanMap = filterZhuanlvMapForEquips(parseStoredObject(statusKey), equips);
                localStorage.setItem(statusKey, JSON.stringify(cleanMap));
            });
            localStorage.setItem(TRANSMUTATION_LEVEL_MIGRATION_MARKER, "1");
        } catch (error) {
            console.warn("迁移110级转律状态失败：", error);
        }
    }

    function purgeRemovedTransmutationCooldownData() {
        try {
            if ("1" === localStorage.getItem(REMOVED_TRANSMUTATION_CD_MARKER)) return;
            var keys = [];
            for (var index = 0; index < localStorage.length; index++) {
                var key = localStorage.key(index);
                if (key && 0 === key.indexOf("game_transmutation_cd_")) keys.push(key);
            }
            keys.forEach(function(key) { localStorage.removeItem(key); });
            localStorage.setItem(REMOVED_TRANSMUTATION_CD_MARKER, "1");
        } catch (error) {
            console.warn("清理已移除的转律提醒数据失败：", error);
        }
    }

    function insertAfter(referenceNode, newNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    function ensureLevelSelect() {
        if (document.getElementById("level-select")) return;
        const weaponTypeGroup = document.getElementById("weapon-type-group");
        if (!weaponTypeGroup || !weaponTypeGroup.parentNode) return;

        const wrapper = document.createElement("div");
        wrapper.className = "form-group flex-08";
        wrapper.innerHTML = '<label>装备等级</label> <select id="level-select"><option value="110" selected="selected">110级</option><option value="105">105级</option><option value="100">100级</option><option value="96">96级</option></select>';
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
            downloadButton.textContent = "下载完整备份";
            const downloadTxt = document.getElementById("download-data-btn");
            downloadTxt ? insertAfter(downloadTxt, downloadButton) : buttonRow.appendChild(downloadButton);
        }

        if (!document.getElementById("import-json-file-input")) {
            const jsonLabel = document.createElement("label");
            jsonLabel.setAttribute("for", "import-json-file-input");
            jsonLabel.className = "secondary-btn cursor-pointer inline-flex";
            jsonLabel.innerHTML = '<input type="file" id="import-json-file-input" accept=".json,application/json" class="hidden"> 恢复完整备份';
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
                isTransmutable: 110 === Number(equip.level) && true === equip.isTransmutable,
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
            var zhuanlv = normalizeZhuanlvStatus(getZhuanlvForEquip(equip.id), equip);
            if (zhuanlv) item.zhuanlv = zhuanlv;
            return item;
        });
    }

    var FULL_BACKUP_KIND = "yysls-tiaolv-full-backup";
    var FULL_BACKUP_SCHEMA_VERSION = 2;
    var EQUIP_SLOT_KEYS = ["weapon1", "weapon2", "head", "chest", "ring", "pendant", "legs", "hands"];
    var SCHEME_FIELDS = [
        "name", "bowType", "setType", "flowVersion", "xinfa", "earlySeasonBonus",
        "PVPMode", "loanDingyin", "loanDingyinValue", "classInputOverrides",
        "armory", "advancedSettings", "transmutationSelections"
    ];

    function isPlainObject(value) {
        return !!value && "object" == typeof value && !Array.isArray(value);
    }

    function isSafeObjectKey(key) {
        return "__proto__" !== key && "prototype" !== key && "constructor" !== key;
    }

    function cloneSafeJson(value, depth) {
        depth = depth || 0;
        if (depth > 30) throw new Error("备份数据嵌套层级过深");
        if (value === null || "string" == typeof value || "boolean" == typeof value) return value;
        if ("number" == typeof value) {
            if (!Number.isFinite(value)) throw new Error("备份中包含无效数字");
            return value;
        }
        if (Array.isArray(value)) return value.map(function(item) {
            return cloneSafeJson(item, depth + 1);
        });
        if (isPlainObject(value)) {
            var result = {};
            Object.keys(value).forEach(function(key) {
                if (!isSafeObjectKey(key)) return;
                result[key] = cloneSafeJson(value[key], depth + 1);
            });
            return result;
        }
        throw new Error("备份中包含不支持的数据类型");
    }

    function parseStoredObject(key) {
        var raw = localStorage.getItem(key);
        if (!raw) return {};
        try {
            var parsed = JSON.parse(raw);
            return isPlainObject(parsed) ? parsed : {};
        } catch (error) {
            console.warn("忽略无法解析的本地数据：", key, error);
            return {};
        }
    }

    function parseStoredArray(key) {
        var raw = localStorage.getItem(key);
        if (!raw) return [];
        try {
            var parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.warn("忽略无法解析的本地数据：", key, error);
            return [];
        }
    }

    function sanitizeStat(stat) {
        if (!isPlainObject(stat) || "string" != typeof stat.type) throw new Error("装备词条格式错误");
        var result = { type: stat.type, value: cloneSafeJson(stat.value) };
        if ("boolean" == typeof stat.isPercent) result.isPercent = stat.isPercent;
        return result;
    }

    function sanitizeEquip(equip, requireId) {
        if (!isPlainObject(equip)) throw new Error("装备数据格式错误");
        if (requireId && (null == equip.id || "" === equip.id)) throw new Error("完整备份中的装备缺少 ID");
        if ("string" != typeof equip.slotId || "string" != typeof equip.name) throw new Error("装备缺少部位或名称");
        var result = {
            id: null == equip.id ? null : cloneSafeJson(equip.id),
            slotId: equip.slotId,
            slotName: "string" == typeof equip.slotName ? equip.slotName : "",
            weaponTypeId: null == equip.weaponTypeId ? null : String(equip.weaponTypeId),
            name: equip.name,
            isChengyin: !!equip.isChengyin,
            isPurple: !!equip.isPurple,
            isTransmutable: 110 === Number(equip.level) && true === equip.isTransmutable,
            level: Number(equip.level) || 105,
            availableClasses: Array.isArray(equip.availableClasses) ? equip.availableClasses.map(String) : [],
            mainStat: sanitizeStat(equip.mainStat),
            subStats: Array.isArray(equip.subStats) ? equip.subStats.map(sanitizeStat) : []
        };
        if (equip.dingyinStat) result.dingyinStat = sanitizeStat(equip.dingyinStat);
        return result;
    }

    function buildFullExportEquipData(accountName) {
        return parseStoredArray("game_equip_data_" + accountName).map(function(equip) {
            return sanitizeEquip(equip, true);
        });
    }

    function getManualGradOwner(key, accountNames) {
        var base = "grad_manual_form_v2_";
        if (0 !== key.indexOf(base)) return null;
        var matches = accountNames.filter(function(name) {
            return 0 === key.indexOf(base + name + "_");
        }).sort(function(a, b) { return b.length - a.length; });
        return matches[0] || null;
    }

    function collectManualGradData(accountName, accountNames) {
        var prefix = "grad_manual_form_v2_" + accountName + "_";
        var result = {};
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (!key || 0 !== key.indexOf(prefix)) continue;
            if (getManualGradOwner(key, accountNames) !== accountName) continue;
            var suffix = key.slice(prefix.length);
            if (!suffix) continue;
            var raw = localStorage.getItem(key);
            try {
                result[suffix] = cloneSafeJson(JSON.parse(raw));
            } catch (error) {
                console.warn("忽略无法解析的手动面板数据：", key, error);
            }
        }
        return result;
    }

    function buildFullBackupPayload(options) {
        options = options || {};
        var accountNames = parseStoredArray("game_account_list").filter(function(name) {
            return "string" == typeof name && !!name.trim();
        });
        if (!accountNames.length) {
            if (!options.silent) alert("当前没有可备份的角色");
            return null;
        }
        return {
            kind: FULL_BACKUP_KIND,
            schemaVersion: FULL_BACKUP_SCHEMA_VERSION,
            exportedAt: (new Date()).toISOString(),
            lastSelectedAccount: localStorage.getItem("last_selected_account") || accountNames[0],
            accounts: accountNames.map(function(accountName) {
                var equipData = buildFullExportEquipData(accountName);
                return {
                    name: accountName,
                    equipData: equipData,
                    simulatorData: parseStoredObject("game_sim_data_" + accountName),
                    zhuanlvData: filterZhuanlvMapForEquips(parseStoredObject("zhuanlv_status_" + accountName), equipData),
                    manualGradData: collectManualGradData(accountName, accountNames)
                };
            })
        };
    }

    function isValidJsonPayload(payload) {
        return payload && "object" == typeof payload && !!payload.accountName && Array.isArray(payload.equipData);
    }

    function downloadJsonDataAsFile() {
        const payload = buildFullBackupPayload();
        if (!payload) return;
        const text = JSON.stringify(payload, null, 2);
        const blob = new Blob([text], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        var now = new Date();
        var stamp = now.getFullYear()
            + String(now.getMonth() + 1).padStart(2, "0")
            + String(now.getDate()).padStart(2, "0") + "-"
            + String(now.getHours()).padStart(2, "0")
            + String(now.getMinutes()).padStart(2, "0")
            + String(now.getSeconds()).padStart(2, "0");
        link.download = "调率站完整备份-" + stamp + ".json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function sanitizeScheme(scheme, validEquipIds, warningState) {
        if (!isPlainObject(scheme)) throw new Error("方案数据格式错误");
        var result = {};
        EQUIP_SLOT_KEYS.forEach(function(slotKey) {
            var equipId = scheme[slotKey];
            if (null == equipId || "" === equipId) {
                result[slotKey] = null;
            } else if (validEquipIds.has(String(equipId))) {
                result[slotKey] = cloneSafeJson(equipId);
            } else {
                result[slotKey] = null;
                warningState.missingEquipRefs++;
            }
        });
        SCHEME_FIELDS.forEach(function(field) {
            if (Object.prototype.hasOwnProperty.call(scheme, field)) {
                if ("transmutationSelections" === field) {
                    if (!isPlainObject(scheme[field])) throw new Error("方案转律选择格式错误");
                    var selections = {};
                    Object.keys(scheme[field]).forEach(function(equipId) {
                        if (!isSafeObjectKey(equipId) || !validEquipIds.has(String(equipId))) return;
                        var selection = scheme[field][equipId];
                        if (!isPlainObject(selection)
                            || !Number.isInteger(selection.subStatIndex)
                            || selection.subStatIndex < 0
                            || "string" != typeof selection.targetStat
                            || !selection.targetStat) return;
                        selections[equipId] = {
                            subStatIndex: selection.subStatIndex,
                            targetStat: selection.targetStat,
                            planned: true === selection.planned
                        };
                    });
                    result[field] = selections;
                } else result[field] = cloneSafeJson(scheme[field]);
            }
        });
        return result;
    }

    function sanitizeSimulatorData(data, validEquipIds, warningState) {
        if (!isPlainObject(data)) throw new Error("模拟器数据格式错误");
        var result = {
            currentClass: "string" == typeof data.currentClass ? data.currentClass : "",
            currentArmory: "string" == typeof data.currentArmory ? data.currentArmory : "通用",
            currentFlowVersions: isPlainObject(data.currentFlowVersions) ? cloneSafeJson(data.currentFlowVersions) : {},
            loadouts: {}
        };
        if (!isPlainObject(data.loadouts)) return result;
        Object.keys(data.loadouts).forEach(function(className) {
            if (!isSafeObjectKey(className)) throw new Error("流派名称无效");
            var classData = data.loadouts[className];
            if (!isPlainObject(classData)) throw new Error("流派方案数据格式错误");
            var cleanClassData = { schemes: {}, currentSchemeId: null };
            if (isPlainObject(classData.schemes)) {
                Object.keys(classData.schemes).forEach(function(schemeId) {
                    if (!isSafeObjectKey(schemeId)) throw new Error("方案 ID 无效");
                    cleanClassData.schemes[schemeId] = sanitizeScheme(classData.schemes[schemeId], validEquipIds, warningState);
                });
                if (null != classData.currentSchemeId && Object.prototype.hasOwnProperty.call(cleanClassData.schemes, classData.currentSchemeId)) {
                    cleanClassData.currentSchemeId = String(classData.currentSchemeId);
                } else {
                    cleanClassData.currentSchemeId = Object.keys(cleanClassData.schemes)[0] || null;
                }
            } else {
                cleanClassData.schemes["默认"] = sanitizeScheme(classData, validEquipIds, warningState);
                cleanClassData.currentSchemeId = "默认";
            }
            result.loadouts[className] = cleanClassData;
        });
        return result;
    }

    function sanitizeZhuanlvMap(map, equipData) {
        if (!isPlainObject(map)) throw new Error("装备关联数据格式错误");
        return filterZhuanlvMapForEquips(map, equipData);
    }

    function sanitizeManualGradData(data) {
        if (!isPlainObject(data)) throw new Error("手动面板数据格式错误");
        var result = {};
        Object.keys(data).forEach(function(suffix) {
            if (!suffix || !isSafeObjectKey(suffix) || suffix.indexOf("..") >= 0) throw new Error("手动面板数据键无效");
            result[suffix] = cloneSafeJson(data[suffix]);
        });
        return result;
    }

    function validateFullBackup(payload) {
        if (!isPlainObject(payload) || payload.kind !== FULL_BACKUP_KIND) throw new Error("这不是调率站完整备份文件");
        if (Number(payload.schemaVersion) !== FULL_BACKUP_SCHEMA_VERSION) {
            throw new Error("不支持的完整备份版本：" + payload.schemaVersion);
        }
        if (!Array.isArray(payload.accounts) || !payload.accounts.length) throw new Error("完整备份中没有角色数据");
        var seenNames = new Set();
        var warningState = { missingEquipRefs: 0 };
        var cleanAccounts = payload.accounts.map(function(account) {
            if (!isPlainObject(account) || "string" != typeof account.name || !account.name.trim()) throw new Error("角色名称无效");
            var name = account.name.trim();
            if (seenNames.has(name)) throw new Error("完整备份中存在重复角色：" + name);
            seenNames.add(name);
            if (!Array.isArray(account.equipData)) throw new Error("角色“" + name + "”的装备数据无效");
            var equipData = account.equipData.map(function(equip) { return sanitizeEquip(equip, true); });
            var rawZhuanlvData = isPlainObject(account.zhuanlvData) ? account.zhuanlvData : {};
            equipData.forEach(function(equip, index) {
                var sourceEquip = account.equipData[index];
                var rawStatus = rawZhuanlvData[String(equip.id)];
                if (!Object.prototype.hasOwnProperty.call(sourceEquip, "isTransmutable")
                    && 110 === Number(equip.level) && rawStatus && "active" === rawStatus.state
                    && (2 === Number(rawStatus.modelVersion) || TRANSMUTATION_STATUS_MODEL_VERSION === Number(rawStatus.modelVersion))) {
                    equip.isTransmutable = true;
                }
            });
            var validEquipIds = new Set();
            equipData.forEach(function(equip) {
                var id = String(equip.id);
                if (validEquipIds.has(id)) throw new Error("角色“" + name + "”存在重复装备 ID");
                validEquipIds.add(id);
            });
            return {
                name: name,
                equipData: equipData,
                simulatorData: sanitizeSimulatorData(account.simulatorData || {}, validEquipIds, warningState),
                zhuanlvData: sanitizeZhuanlvMap(rawZhuanlvData, equipData),
                manualGradData: sanitizeManualGradData(account.manualGradData || {})
            };
        });
        var lastSelected = "string" == typeof payload.lastSelectedAccount && seenNames.has(payload.lastSelectedAccount)
            ? payload.lastSelectedAccount : cleanAccounts[0].name;
        return { accounts: cleanAccounts, lastSelectedAccount: lastSelected, warnings: warningState };
    }

    function countSchemes(simulatorData) {
        var total = 0;
        var loadouts = simulatorData && simulatorData.loadouts || {};
        Object.keys(loadouts).forEach(function(className) {
            total += Object.keys(loadouts[className].schemes || {}).length;
        });
        return total;
    }

    function removeManualGradKeys(accountName, accountNames, setValue) {
        var prefix = "grad_manual_form_v2_" + accountName + "_";
        var keys = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key && 0 === key.indexOf(prefix) && getManualGradOwner(key, accountNames) === accountName) keys.push(key);
        }
        keys.forEach(function(key) { setValue(key, null); });
    }

    function restoreFullBackup(payload, options) {
        options = options || {};
        var validated = validateFullBackup(payload);
        var existingAccounts = parseStoredArray("game_account_list").filter(function(name) {
            return "string" == typeof name && !!name;
        });
        var existingSet = new Set(existingAccounts);
        var conflicts = validated.accounts.map(function(account) { return account.name; }).filter(function(name) {
            return existingSet.has(name);
        });
        var equipCount = validated.accounts.reduce(function(total, account) { return total + account.equipData.length; }, 0);
        var schemeCount = validated.accounts.reduce(function(total, account) {
            return total + countSchemes(account.simulatorData);
        }, 0);
        var message = "备份包含 " + validated.accounts.length + " 个角色、" + equipCount + " 件装备、" + schemeCount + " 个方案。";
        if (conflicts.length) {
            message += "\n\n以下同名角色将被完整覆盖：\n- " + conflicts.join("\n- ");
        } else {
            message += "\n\n不会覆盖现有角色。";
        }
        message += "\n\n确定恢复此完整备份吗？";
        if (!options.skipConfirm && !confirm(message)) return false;

        var mergedAccounts = existingAccounts.slice();
        validated.accounts.forEach(function(account) {
            if (!existingSet.has(account.name)) {
                existingSet.add(account.name);
                mergedAccounts.push(account.name);
            }
        });
        var previousValues = {};
        var touchedKeys = [];
        function setValue(key, value) {
            if (!Object.prototype.hasOwnProperty.call(previousValues, key)) {
                previousValues[key] = localStorage.getItem(key);
                touchedKeys.push(key);
            }
            if (null === value) localStorage.removeItem(key);
            else localStorage.setItem(key, value);
        }
        try {
            validated.accounts.forEach(function(account) {
                setValue("game_equip_data_" + account.name, JSON.stringify(account.equipData));
                setValue("game_sim_data_" + account.name, JSON.stringify(account.simulatorData));
                setValue("zhuanlv_status_" + account.name, JSON.stringify(account.zhuanlvData));
                removeManualGradKeys(account.name, mergedAccounts, setValue);
                Object.keys(account.manualGradData).forEach(function(suffix) {
                    setValue("grad_manual_form_v2_" + account.name + "_" + suffix, JSON.stringify(account.manualGradData[suffix]));
                });
            });
            setValue("game_account_list", JSON.stringify(mergedAccounts));
            setValue("last_selected_account", validated.lastSelectedAccount);
        } catch (error) {
            for (var i = touchedKeys.length - 1; i >= 0; i--) {
                var key = touchedKeys[i];
                try {
                    if (null === previousValues[key]) localStorage.removeItem(key);
                    else localStorage.setItem(key, previousValues[key]);
                } catch (rollbackError) {
                    console.error("回滚本地备份数据失败：", key, rollbackError);
                }
            }
            throw new Error("恢复写入失败，已尝试回滚：" + error.message);
        }
        var warning = validated.warnings.missingEquipRefs
            ? "\n有 " + validated.warnings.missingEquipRefs + " 个方案装备引用找不到对应装备，相关部位已留空。"
            : "";
        if ("function" == typeof options.onRestored) {
            try {
                options.onRestored(validated);
            } catch (callbackError) {
                console.error("完整备份恢复后的状态更新失败：", callbackError);
            }
        }
        alert("完整备份恢复成功！" + warning + "\n页面将刷新以加载全部数据。");
        window.location.reload();
        return true;
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
                if (payload && payload.kind === FULL_BACKUP_KIND) {
                    restoreFullBackup(payload);
                    return;
                }
                if (!isValidJsonPayload(payload)) {
                    alert("JSON 数据格式错误：既不是完整备份，也不是包含 accountName 和 equipData 的旧版装备备份");
                    return;
                }
                (payload.equipData || []).forEach(function(item) {
                    if (!Object.prototype.hasOwnProperty.call(item, "isTransmutable")
                        && 110 === Number(item.level) && item.zhuanlv && "active" === item.zhuanlv.state
                        && (2 === Number(item.zhuanlv.modelVersion) || TRANSMUTATION_STATUS_MODEL_VERSION === Number(item.zhuanlv.modelVersion))) {
                        item.isTransmutable = true;
                    }
                    item.isTransmutable = 110 === Number(item.level) && true === item.isTransmutable;
                });
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
                    var importedStatus = normalizeZhuanlvStatus(item.zhuanlv, item);
                    if (importedStatus) {
                        var key = (item.name || "") + "|" + (item.slotId || "");
                        _pendingZhuanlvFromJson[key] = importedStatus;
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

    // ─────────────────────────────────────────
    // 手动毕业率：按词条数量输入
    // ─────────────────────────────────────────

    var MANUAL_STAT_COUNT_CONFIG_KEY = "__statCountConfig";
    var MANUAL_STAT_COUNT_MAX = 40;
    var MANUAL_STAT_SLOT_KEYS = ["weapon1", "weapon2", "head", "chest", "ring", "pendant", "legs", "hands"];
    var MANUAL_STAT_SLOT_IDS = {
        weapon1: "1", weapon2: "1", head: "5", chest: "6",
        ring: "3", pendant: "4", legs: "7", hands: "8"
    };

    function getManualStatCountOptions() {
        var values = window.CommonData && CommonData.MAX_VALUES || {};
        var stats = new Set();
        (CommonData.BASE_SUB_STATS || []).forEach(function(stat) { stats.add(stat); });
        Object.values(CommonData.MAIN_STAT_RULES || {}).forEach(function(list) {
            (list || []).forEach(function(stat) { stats.add(stat); });
        });
        Object.values(CommonData.TRANSMUTATION_POOLS || {}).forEach(function(list) {
            (list || []).forEach(function(stat) { stats.add(stat); });
        });
        (CommonData.WEAPON_TYPES || []).forEach(function(weapon) {
            if (weapon && weapon.stat) stats.add(weapon.stat);
        });
        [
            "最大无相攻击", "最小无相攻击", "全武学增效",
            "单体类奇术增伤", "群体类奇术增伤",
            "对首领单位增伤", "对玩家单位增效"
        ].forEach(function(stat) { stats.add(stat); });
        return Array.from(stats).filter(function(stat) {
            return stat && "生存类词条" !== stat && "生存向" !== stat && Number(values[stat]) > 0;
        });
    }

    function getManualStatSlotModel() {
        var className = window.GradModal && GradModal.state && GradModal.state.currentClass
            || window.UIManager && UIManager.dom && UIManager.dom.classSelect && UIManager.dom.classSelect.value || "";
        var ruleClass = "裂石钧（纯唐）" === className ? "裂石钧" : className;
        var weaponRules = window.ClassConfig && ClassConfig.WEAPON_RULES && ClassConfig.WEAPON_RULES[ruleClass] || [];
        var baseSubStats = new Set(CommonData.BASE_SUB_STATS || []);
        return MANUAL_STAT_SLOT_KEYS.map(function(slotKey, index) {
            var slotId = MANUAL_STAT_SLOT_IDS[slotKey];
            var weaponTypeId = "1" === slotId ? String(weaponRules[index] || "") : "";
            var subStats = new Set(baseSubStats);
            if ("1" === slotId) {
                Array.from(subStats).forEach(function(stat) {
                    if (/^(最小|最大)(鸣金|裂石|牵丝|破竹)攻击$/.test(stat)) subStats.delete(stat);
                });
                var weapon = (CommonData.WEAPON_TYPES || []).find(function(item) {
                    return item && String(item.id) === weaponTypeId;
                });
                if (weapon && weapon.stat) subStats.add(weapon.stat);
                subStats.add("最大无相攻击");
                subStats.add("最小无相攻击");
            }
            if (["3", "4"].includes(slotId)) subStats.add("全武学增效");
            if (["5", "6"].includes(slotId)) {
                subStats.add("单体类奇术增伤");
                subStats.add("群体类奇术增伤");
            }
            if (["7", "8"].includes(slotId)) {
                subStats.add("对首领单位增伤");
                subStats.add("对玩家单位增效");
            }
            return {
                key: slotKey,
                slotId: slotId,
                weaponTypeId: weaponTypeId,
                mainStats: new Set(CommonData.MAIN_STAT_RULES[slotId] || []),
                subStats: subStats
            };
        });
    }

    function runManualStatMinCostFlow(counts, slotModel) {
        var stats = Object.keys(counts || {}).filter(function(stat) {
            return Number(counts[stat]) > 0;
        });
        var source = 0;
        var statOffset = 1;
        var mainOffset = statOffset + stats.length;
        var subOffset = mainOffset + slotModel.length;
        var sink = subOffset + slotModel.length;
        var graph = Array.from({ length: sink + 1 }, function() { return []; });
        function addEdge(from, to, capacity, cost, kind, stat, slotIndex) {
            var forward = { to: to, rev: graph[to].length, cap: capacity, original: capacity, cost: cost, kind: kind, stat: stat, slotIndex: slotIndex };
            var reverse = { to: from, rev: graph[from].length, cap: 0, original: 0, cost: -cost };
            graph[from].push(forward);
            graph[to].push(reverse);
        }
        stats.forEach(function(stat, statIndex) {
            addEdge(source, statOffset + statIndex, Number(counts[stat]) || 0, 0);
            slotModel.forEach(function(slot, slotIndex) {
                if (slot.mainStats.has(stat)) addEdge(statOffset + statIndex, mainOffset + slotIndex, 1, 1, "main", stat, slotIndex);
                if (slot.subStats.has(stat)) addEdge(statOffset + statIndex, subOffset + slotIndex, 1, 0, "sub", stat, slotIndex);
            });
        });
        slotModel.forEach(function(slot, slotIndex) {
            addEdge(mainOffset + slotIndex, sink, 1, 0);
            addEdge(subOffset + slotIndex, sink, 4, 0);
        });
        var target = stats.reduce(function(total, stat) { return total + (Number(counts[stat]) || 0); }, 0);
        var flow = 0;
        var cost = 0;
        while (flow < target) {
            var distance = Array(graph.length).fill(Infinity);
            var previousNode = Array(graph.length).fill(-1);
            var previousEdge = Array(graph.length).fill(-1);
            var inQueue = Array(graph.length).fill(false);
            var queue = [source];
            distance[source] = 0;
            inQueue[source] = true;
            while (queue.length) {
                var node = queue.shift();
                inQueue[node] = false;
                graph[node].forEach(function(edge, edgeIndex) {
                    if (edge.cap <= 0 || distance[edge.to] <= distance[node] + edge.cost) return;
                    distance[edge.to] = distance[node] + edge.cost;
                    previousNode[edge.to] = node;
                    previousEdge[edge.to] = edgeIndex;
                    if (!inQueue[edge.to]) {
                        queue.push(edge.to);
                        inQueue[edge.to] = true;
                    }
                });
            }
            if (!Number.isFinite(distance[sink])) break;
            var add = target - flow;
            for (var walk = sink; walk !== source; walk = previousNode[walk]) {
                add = Math.min(add, graph[previousNode[walk]][previousEdge[walk]].cap);
            }
            for (var cursor = sink; cursor !== source; cursor = previousNode[cursor]) {
                var edge = graph[previousNode[cursor]][previousEdge[cursor]];
                edge.cap -= add;
                graph[cursor][edge.rev].cap += add;
            }
            flow += add;
            cost += add * distance[sink];
        }
        var assignments = slotModel.map(function() { return { main: null, subs: [] }; });
        stats.forEach(function(stat, statIndex) {
            graph[statOffset + statIndex].forEach(function(edge) {
                if (!edge.kind || edge.original <= 0 || edge.cap !== 0) return;
                if ("main" === edge.kind) assignments[edge.slotIndex].main = stat;
                else assignments[edge.slotIndex].subs.push(stat);
            });
        });
        return { flow: flow, target: target, mainCount: cost, subCount: flow - cost, assignments: assignments };
    }

    function explainManualStatAllocationFailure(counts, slotModel) {
        var total = Object.values(counts || {}).reduce(function(sum, count) { return sum + (Number(count) || 0); }, 0);
        if (total > MANUAL_STAT_COUNT_MAX) return "普通词条总数最多 40 条";
        for (var stat of Object.keys(counts || {})) {
            var mainCapacity = slotModel.filter(function(slot) { return slot.mainStats.has(stat); }).length;
            var subCapacity = slotModel.filter(function(slot) { return slot.subStats.has(stat); }).length;
            if (Number(counts[stat]) > mainCapacity + subCapacity) {
                return stat + "最多 " + (mainCapacity + subCapacity) + " 条（首词条 " + mainCapacity + "、副词条 " + subCapacity + "）";
            }
        }
        var forcedMainStats = Object.keys(counts || {}).map(function(stat) {
            var subCapacity = slotModel.filter(function(slot) { return slot.subStats.has(stat); }).length;
            return {
                stat: stat,
                required: Math.max(0, Number(counts[stat]) - subCapacity),
                slots: slotModel.map(function(slot, index) {
                    return slot.mainStats.has(stat) ? index : -1;
                }).filter(function(index) { return index >= 0; })
            };
        }).filter(function(item) { return item.required > 0; });
        for (var mask = 1; mask < (1 << forcedMainStats.length); mask++) {
            var required = 0;
            var slots = new Set();
            var names = [];
            forcedMainStats.forEach(function(item, index) {
                if (!(mask & (1 << index))) return;
                required += item.required;
                names.push(item.stat);
                item.slots.forEach(function(slotIndex) { slots.add(slotIndex); });
            });
            if (required > slots.size) {
                return names.join("、") + "至少需要 " + required
                    + " 个首词条，但共同可用部位只有 " + slots.size + " 个";
            }
        }
        return "当前词条会争用相同的首词条或副词条部位，无法同时实现";
    }

    function allocateManualStatCounts(counts) {
        var slotModel = getManualStatSlotModel();
        var result = runManualStatMinCostFlow(counts || {}, slotModel);
        result.valid = result.flow === result.target && result.target <= MANUAL_STAT_COUNT_MAX;
        result.slotModel = slotModel;
        result.reason = result.valid ? "" : explainManualStatAllocationFailure(counts || {}, slotModel);
        return result;
    }

    function getManualStatCountLimit(stat, counts) {
        var base = { ...(counts || {}) };
        var oldCount = Number(base[stat]) || 0;
        var otherTotal = Object.values(base).reduce(function(total, count) { return total + (Number(count) || 0); }, 0) - oldCount;
        var max = Math.max(0, MANUAL_STAT_COUNT_MAX - otherTotal);
        for (var count = max; count >= 0; count--) {
            if (count > 0) base[stat] = count;
            else delete base[stat];
            if (allocateManualStatCounts(base).valid) return count;
        }
        return 0;
    }

    function normalizeManualStatCountConfig(config) {
        config = isPlainObject(config) ? config : {};
        var allowed = new Set(getManualStatCountOptions());
        var migrationAdjustments = [];
        function normalizeCounts(source, label) {
            var counts = {};
            var total = 0;
            if (!isPlainObject(source)) return counts;
            Object.keys(source).forEach(function(stat) {
                if (!allowed.has(stat) || total >= MANUAL_STAT_COUNT_MAX) return;
                var requested = Math.max(0, Math.floor(Number(source[stat]) || 0));
                var count = Math.min(requested, MANUAL_STAT_COUNT_MAX - total);
                while (count > 0) {
                    counts[stat] = count;
                    if (allocateManualStatCounts(counts).valid) break;
                    count--;
                }
                if (count <= 0) delete counts[stat];
                if (count < requested) migrationAdjustments.push((label ? label + "：" : "") + stat + " " + requested + "→" + count);
                if (count > 0) {
                    total += count;
                }
            });
            return counts;
        }
        var presets = [];
        var presetIds = new Set();
        if (Array.isArray(config.presets)) {
            config.presets.slice(0, 50).forEach(function(preset) {
                if (!isPlainObject(preset) || "string" != typeof preset.name || !preset.name.trim()) return;
                var id = String(preset.id || "");
                if (!id || presetIds.has(id)) return;
                presetIds.add(id);
                presets.push({
                    id: id,
                    name: preset.name.trim().slice(0, 40),
                    valueMode: "chengyin" === preset.valueMode ? "chengyin" : "max",
                    counts: normalizeCounts(preset.counts, preset.name.trim().slice(0, 40))
                });
            });
        }
        var currentPresetId = null != config.currentPresetId ? String(config.currentPresetId) : null;
        if (!presetIds.has(currentPresetId)) currentPresetId = null;
        return {
            mode: "count" === config.mode ? "count" : "panel",
            valueMode: "chengyin" === config.valueMode ? "chengyin" : "max",
            counts: normalizeCounts(config.counts, "当前组合"),
            manualPanel: isPlainObject(config.manualPanel) ? cloneSafeJson(config.manualPanel) : {},
            presets: presets,
            currentPresetId: currentPresetId,
            migrationAdjustments: migrationAdjustments
        };
    }

    function manualStatTargetValue(stat, valueMode) {
        if ("chengyin" === valueMode) {
            var chengyinValues = window.YYSLS_CALC_METADATA && window.YYSLS_CALC_METADATA.chengyinValues || {};
            var chengyinValue = Number(chengyinValues[stat]);
            if (Number.isFinite(chengyinValue) && chengyinValue > 0) return chengyinValue;
            var maxFallback = Number(CommonData.MAX_VALUES[stat]) || 0;
            return Math.round(maxFallback * .94 * 100) / 100;
        }
        return Number(CommonData.MAX_VALUES[stat]) || 0;
    }

    function readManualPanelInputs(container) {
        var result = {};
        container.querySelectorAll(".grad-manual-input").forEach(function(input) {
            var key = String(input.dataset.key || "").replace(/（%）/g, "").trim();
            var value = Number(input.value);
            result[key] = Number.isFinite(value) ? value : 0;
        });
        return result;
    }

    function writeManualPanelInputs(container, values, triggerInput) {
        container.querySelectorAll(".grad-manual-input").forEach(function(input) {
            var key = String(input.dataset.key || "").replace(/（%）/g, "").trim();
            var value = Number(values && values[key]);
            input.value = Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
            if (triggerInput) input.dispatchEvent(new Event("input", { bubbles: true }));
        });
    }

    function buildManualStatCountEquips(config, allocation) {
        allocation = allocation || allocateManualStatCounts(config.counts);
        if (!allocation.valid) throw new Error(allocation.reason || "当前词条组合无法由 8 件装备实现");
        var currentEquips = window.GradModal && GradModal.state && GradModal.state.currentEquips
            || window.AppState && AppState.equippedItems || {};
        var result = {};
        MANUAL_STAT_SLOT_KEYS.forEach(function(slotKey, slotIndex) {
            var assignment = allocation.assignments[slotIndex] || { main: null, subs: [] };
            var slot = allocation.slotModel[slotIndex];
            var currentEquip = currentEquips[slotKey];
            var mainType = assignment.main || "生存类词条";
            result[slotKey] = {
                id: "manual-stat-count-" + slotKey,
                slotId: MANUAL_STAT_SLOT_IDS[slotKey],
                weaponTypeId: slot && slot.weaponTypeId || "",
                name: "词条数量模拟装备",
                isChengyin: false,
                isPurple: false,
                mainStat: {
                    type: mainType,
                    value: assignment.main ? manualStatTargetValue(mainType, config.valueMode) : 0,
                    isPercent: CommonData.PERCENT_STATS.includes(mainType)
                },
                subStats: assignment.subs.map(function(stat) {
                    return {
                        type: stat,
                        value: manualStatTargetValue(stat, config.valueMode),
                        isPercent: CommonData.PERCENT_STATS.includes(stat)
                    };
                }),
                dingyinStat: currentEquip && currentEquip.dingyinStat
                    ? cloneSafeJson(currentEquip.dingyinStat) : null
            };
        });
        return result;
    }

    function calculateManualStatCountPanel(config, allocation) {
        if ("undefined" == typeof Calculator || "function" != typeof Calculator.calculateTotal) {
            throw new Error("毕业率计算器尚未初始化");
        }
        var className = GradModal.state.currentClass || UIManager.dom.classSelect.value;
        var bow = UIManager.dom.bowSelect ? UIManager.dom.bowSelect.value : "";
        var setName = UIManager.dom.setSelect ? UIManager.dom.setSelect.value : "";
        return Calculator.calculateTotal(
            buildManualStatCountEquips(config, allocation),
            className,
            bow,
            AppState.currentXinfaLoadout || [],
            setName,
            false,
            null,
            !!AppState.earlySeasonBonus,
            !!AppState.loanDingyin
        ) || {};
    }

    function calculateManualStatCountRate(panel) {
        var className = GradModal.state.currentClass || UIManager.dom.classSelect.value;
        var xinfa = AppState.currentXinfaLoadout || [];
        var setName = UIManager.dom.setSelect ? UIManager.dom.setSelect.value : "";
        var rotationConfig = "function" == typeof getRotationConfig
            ? getRotationConfig(className) : ClassConfig.ROTATIONS[className];
        var calculationPanel = {
            ...(panel || {}),
            "套装": setName,
            "心法": xinfa,
            "当前流派": className
        };
        var skillAliases = {
            "鸣金影": "积矩九剑·流血增伤",
            "鸣金虹": "无名剑法·蓄力技增伤",
            "破竹尘": "醉梦游春·武学技增伤",
            "破竹风": "栗子游尘·鼠鼠增伤",
            "裂石钧（纯唐）": "斩雪刀法·轻重击派生技增伤",
            "裂石钧": "十方破阵·蓄力技增伤",
            "牵丝玉": "九重春色·特殊技增伤",
            "裂石威": "嗟夫刀法·蓄力技增伤",
            "破竹鸢": "天志垂象·蓄力技增伤",
            "牵丝翊": "鼓特殊技",
            "牵丝霖": "明川药典·治疗技增疗"
        };
        var alias = skillAliases[className];
        if (alias && Number.isFinite(Number(calculationPanel[alias]))) {
            calculationPanel["指定武学技能增伤"] = Number(calculationPanel[alias]);
        }
        if (void 0 !== calculationPanel.会心率) calculationPanel.实际会心率 = calculationPanel.会心率;
        if (void 0 !== calculationPanel.会意率) calculationPanel.实际会意率 = calculationPanel.会意率;
        if (void 0 !== calculationPanel.精准率) calculationPanel.实际精准率 = calculationPanel.精准率;
        var result = Calculator.calculateGraduationRate(
            calculationPanel,
            rotationConfig && rotationConfig.skillDatabase || {},
            rotationConfig && rotationConfig.rotation || [],
            getBaseLineByClass(className, xinfa),
            true
        );
        return result && null != result.graduationRate ? result.graduationRate : "--";
    }

    function manualStatCountTotal(config) {
        return Object.values(config.counts).reduce(function(total, count) {
            return total + (Number(count) || 0);
        }, 0);
    }

    function getManualStatCountCategories() {
        var className = GradModal.state.currentClass || UIManager.dom.classSelect.value || "";
        var flowAttr = "";
        if (0 === className.indexOf("鸣金")) flowAttr = "鸣金";
        else if (0 === className.indexOf("裂石")) flowAttr = "裂石";
        else if (0 === className.indexOf("牵丝")) flowAttr = "牵丝";
        else if (0 === className.indexOf("破竹")) flowAttr = "破竹";
        var weaponStatsByClass = {
            "鸣金影": ["剑武学增效"],
            "鸣金虹": ["剑武学增效"],
            "破竹尘": ["伞武学增效"],
            "破竹风": ["双刀武学增效", "绳标武学增效"],
            "破竹鸢": ["拳甲武学增效"],
            "裂石钧": ["陌刀武学增效"],
            "裂石钧（纯唐）": ["横刀武学增效"],
            "裂石威": ["陌刀武学增效"],
            "牵丝玉": ["伞武学增效"],
            "牵丝翊": ["鼓武学增效", "扇武学增效"],
            "牵丝霖": ["扇武学增效"]
        };
        var attackStats = ["最大外功攻击", "最小外功攻击"];
        if (flowAttr) attackStats.push("最大" + flowAttr + "攻击", "最小" + flowAttr + "攻击");
        var godPowerStats = [
            ...(weaponStatsByClass[className] || []),
            "全武学增效",
            "对首领单位增伤"
        ];
        if (AppState.PVPMode) godPowerStats.push("对玩家单位增效");
        var maxValues = CommonData.MAX_VALUES || {};
        function available(stats) {
            return stats.filter(function(stat) { return Number(maxValues[stat]) > 0; });
        }
        return [
            { title: "三率", stats: available(["精准率", "会心率", "会意率"]) },
            { title: "五维", stats: available(["劲", "敏", "势"]) },
            { title: "攻击", stats: available(attackStats) },
            { title: "神力", stats: available(godPowerStats) }
        ];
    }

    function getManualRelevantWeaponStats() {
        var categories = getManualStatCountCategories();
        var godPower = categories.find(function(category) { return "神力" === category.title; });
        return new Set((godPower && godPower.stats || []).filter(function(stat) {
            return stat.indexOf("武学增效") >= 0 && "全武学增效" !== stat;
        }));
    }

    function escapeManualStatText(value) {
        return String(value || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function removeManualStatCountPanel() {
        var panel = document.getElementById("grad-manual-stat-count-final-panel");
        if (panel) panel.remove();
    }

    function positionManualStatCountPanel() {
        var panel = document.getElementById("grad-manual-stat-count-final-panel");
        var modal = window.GradModal && GradModal.dom && GradModal.dom.modal;
        if (!panel || !modal) return;
        var modalContent = modal.querySelector(".modal-content");
        if (!modalContent) {
            panel.style.top = "50%";
            panel.style.right = "20px";
            panel.style.left = "auto";
            panel.style.transform = "translateY(-50%)";
            return;
        }
        var rect = modalContent.getBoundingClientRect();
        var left = rect.right + 10;
        if (left + 332 > window.innerWidth) {
            panel.style.left = "auto";
            panel.style.right = "10px";
        } else {
            panel.style.left = left + "px";
            panel.style.right = "auto";
        }
        panel.style.top = rect.top + rect.height / 2 + "px";
        panel.style.transform = "translateY(-50%)";
    }

    function renderManualStatCountPanel(panelData) {
        if (!window.GradModal || "function" != typeof GradModal.renderPanelStats) return;
        var panel = document.getElementById("grad-manual-stat-count-final-panel");
        if (!panel) {
            panel = document.createElement("div");
            panel.id = "grad-manual-stat-count-final-panel";
            panel.className = "best-build-panel";
            panel.style.cssText = "position:fixed;width:300px;max-height:80vh;background:rgba(30,30,35,.98);border:1px solid var(--border);border-radius:8px;padding:15px;z-index:1500;overflow-y:auto;box-shadow:0 4px 20px rgba(0,0,0,.5);";
            panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:1px solid var(--border);padding-bottom:10px;">'
                + '<h3 style="margin:0;color:var(--accent);font-size:1rem;">词条数量最终面板</h3>'
                + '<button type="button" id="grad-manual-stat-count-panel-close" style="background:none;border:none;color:var(--text-sub);font-size:1.5rem;cursor:pointer;padding:0;width:24px;height:24px;">&times;</button>'
                + '</div><div id="grad-manual-stat-count-final-stats" style="color:var(--text-main);font-size:.9rem;"></div>';
            document.body.appendChild(panel);
            panel.querySelector("#grad-manual-stat-count-panel-close").addEventListener("click", removeManualStatCountPanel);
        }
        var stats = panel.querySelector("#grad-manual-stat-count-final-stats");
        var className = GradModal.state.currentClass || UIManager.dom.classSelect.value;
        var setName = UIManager.dom.setSelect ? UIManager.dom.setSelect.value : "";
        stats.innerHTML = GradModal.renderPanelStats(panelData || {}, setName, className);
        positionManualStatCountPanel();
    }

    function decoratePanelRateOverflow(html, panelData, setName, className) {
        var wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        [
            { label: "精准率", key: "精准率溢出", prefix: "" },
            {
                label: "会心率",
                key: "会心率溢出",
                prefix: ("裂石威" === className ? "陌刀" : "")
                    + ("裂石钧" === className ? "钧钧" : "")
                    + ("浣花" === setName ? "浣花" : "")
            },
            { label: "会意率", key: "会意率溢出", prefix: "" }
        ].forEach(function(item) {
            var overflow = Number(panelData && panelData[item.key]) || 0;
            if (overflow <= 0) return;
            Array.from(wrapper.children).some(function(row) {
                var spans = row.querySelectorAll("span");
                if (spans.length < 2 || spans[0].textContent.replace(/:$/, "") !== item.label) return false;
                var hint = document.createElement("span");
                hint.className = "manual-panel-overflow-hint";
                hint.style.cssText = "color:var(--text-sub);font-size:.85em;margin-left:4px;white-space:nowrap;";
                hint.textContent = "（" + item.prefix + "溢出" + overflow.toFixed(1) + "%白值）";
                spans[1].appendChild(hint);
                return true;
            });
        });
        return wrapper.innerHTML;
    }

    function initManualStatCountMode() {
        if (!window.GradModal || GradModal.__statCountModePatched) return;
        GradModal.__statCountModePatched = true;

        var originalRenderPanelStats = GradModal.renderPanelStats;
        GradModal.renderPanelStats = function(panelData, setName, className) {
            var html = originalRenderPanelStats.apply(this, arguments);
            return decoratePanelRateOverflow(html, panelData, setName, className);
        };
        var originalCloseBuildPanel = GradModal.closeBuildPanel;
        GradModal.closeBuildPanel = function() {
            removeManualStatCountPanel();
            return originalCloseBuildPanel.apply(this, arguments);
        };
        GradModal.dom.modal.addEventListener("click", function(event) {
            var tab = event.target.closest(".grad-tab");
            if (tab && "manual" !== tab.dataset.tab) removeManualStatCountPanel();
        });
        window.addEventListener("resize", positionManualStatCountPanel);

        var originalSaveManualFormData = GradModal.saveManualFormData;
        GradModal.saveManualFormData = function(data) {
            var existing = this.loadManualFormData();
            if (!Object.prototype.hasOwnProperty.call(data || {}, MANUAL_STAT_COUNT_CONFIG_KEY)
                && existing && existing[MANUAL_STAT_COUNT_CONFIG_KEY]) {
                data = { ...(data || {}), [MANUAL_STAT_COUNT_CONFIG_KEY]: existing[MANUAL_STAT_COUNT_CONFIG_KEY] };
            }
            return originalSaveManualFormData.call(this, data);
        };

        var originalRenderManualTab = GradModal.renderManualTab;
        GradModal.renderManualTab = function() {
            originalRenderManualTab.apply(this, arguments);
            var container = this.dom.tabContentManual;
            if (!container || container.querySelector("#grad-manual-stat-count-controls")) return;

            var stored = this.loadManualFormData();
            var config = normalizeManualStatCountConfig(stored[MANUAL_STAT_COUNT_CONFIG_KEY]);
            var migrationAdjustments = config.migrationAdjustments || [];
            delete config.migrationAdjustments;
            var controls = document.createElement("div");
            controls.id = "grad-manual-stat-count-controls";
            controls.style.cssText = "margin:0 6px 14px;padding:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;";
            controls.innerHTML = [
                '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:end;">',
                '  <label style="display:flex;flex-direction:column;gap:6px;color:var(--text-main);font-size:.9rem;">输入方式',
                '    <select id="grad-manual-input-mode" class="stat-select">',
                '      <option value="count">按词条数量</option>',
                '      <option value="panel">直接填写面板</option>',
                '    </select>',
                '  </label>',
                '  <label id="grad-manual-value-mode-wrap" style="display:flex;flex-direction:column;gap:6px;color:var(--text-main);font-size:.9rem;">词条数值标准',
                '    <select id="grad-manual-value-mode" class="stat-select">',
                '      <option value="max">全部按满值</option>',
                '      <option value="chengyin">全部按承音值</option>',
                '    </select>',
                '  </label>',
                '</div>',
                '<div id="grad-manual-stat-count-panel" style="margin-top:14px;">',
                '  <div id="grad-manual-stat-preset-bar" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px;padding:10px;background:rgba(0,0,0,.16);border:1px solid rgba(255,255,255,.08);border-radius:7px;">',
                '    <span style="color:var(--text-sub);font-size:.88rem;">词条组合</span>',
                '    <select id="grad-manual-stat-preset-select" class="stat-select" style="flex:1;min-width:150px;"></select>',
                '    <button id="grad-manual-stat-preset-new" type="button" class="secondary-btn">保存为新组合</button>',
                '    <button id="grad-manual-stat-preset-update" type="button" class="secondary-btn">更新组合</button>',
                '    <button id="grad-manual-stat-preset-rename" type="button" class="secondary-btn">重命名</button>',
                '    <button id="grad-manual-stat-preset-delete" type="button" class="danger-btn">删除</button>',
                '  </div>',
                '  <div id="grad-manual-stat-category-panels" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;"></div>',
                '  <details id="grad-manual-other-stats" style="margin-top:12px;padding:10px;background:rgba(0,0,0,.16);border:1px solid rgba(255,255,255,.08);border-radius:7px;">',
                '    <summary style="cursor:pointer;color:var(--text-main);font-weight:bold;">其他词条</summary>',
                '    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px;">',
                '      <select id="grad-manual-stat-select" class="stat-select" style="flex:1;min-width:180px;"></select>',
                '      <input id="grad-manual-stat-add-count" type="number" min="1" max="40" step="1" value="1" style="width:76px;padding:8px;border-radius:6px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.25);color:#fff;">',
                '      <button id="grad-manual-stat-add-btn" type="button" class="secondary-btn">添加词条</button>',
                '    </div>',
                '    <div id="grad-manual-stat-count-list" style="display:flex;flex-direction:column;gap:8px;margin-top:10px;"></div>',
                '  </details>',
                '  <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;margin-top:10px;font-size:.9rem;">',
                '    <span id="grad-manual-stat-count-message" style="color:#ff8a80;"></span>',
                '    <span style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;color:var(--text-sub);"><button id="grad-manual-stat-clear-btn" type="button" class="secondary-btn" style="padding:4px 9px;font-size:.8rem;">清空词条</button><span>首词条：<strong id="grad-manual-main-count-total" style="color:var(--gold);">0</strong>/8</span><span>副词条：<strong id="grad-manual-sub-count-total" style="color:var(--gold);">0</strong>/32</span><span>普通词条：<strong id="grad-manual-stat-count-total" style="color:var(--gold);">0</strong>/40</span></span>',
                '  </div>',
                '</div>'
            ].join("");
            container.insertBefore(controls, container.firstChild);

            var panelEditor = controls.nextElementSibling;
            var panelResultElement = panelEditor && panelEditor.querySelector("#grad-manual-result");
            var resultRow = panelResultElement && panelResultElement.parentElement;
            var countResultElement = panelResultElement && panelResultElement.cloneNode(false);
            if (countResultElement) {
                countResultElement.id = "grad-manual-stat-count-result";
                resultRow.appendChild(countResultElement);
            }
            if (resultRow) controls.appendChild(resultRow);
            var modeSelect = controls.querySelector("#grad-manual-input-mode");
            var valueModeSelect = controls.querySelector("#grad-manual-value-mode");
            var valueModeWrap = controls.querySelector("#grad-manual-value-mode-wrap");
            var countPanel = controls.querySelector("#grad-manual-stat-count-panel");
            var presetSelect = controls.querySelector("#grad-manual-stat-preset-select");
            var presetNewButton = controls.querySelector("#grad-manual-stat-preset-new");
            var presetUpdateButton = controls.querySelector("#grad-manual-stat-preset-update");
            var presetRenameButton = controls.querySelector("#grad-manual-stat-preset-rename");
            var presetDeleteButton = controls.querySelector("#grad-manual-stat-preset-delete");
            var statSelect = controls.querySelector("#grad-manual-stat-select");
            var addCountInput = controls.querySelector("#grad-manual-stat-add-count");
            var addButton = controls.querySelector("#grad-manual-stat-add-btn");
            var categoryPanels = controls.querySelector("#grad-manual-stat-category-panels");
            var list = controls.querySelector("#grad-manual-stat-count-list");
            var clearButton = controls.querySelector("#grad-manual-stat-clear-btn");
            var mainTotalElement = controls.querySelector("#grad-manual-main-count-total");
            var subTotalElement = controls.querySelector("#grad-manual-sub-count-total");
            var totalElement = controls.querySelector("#grad-manual-stat-count-total");
            var messageElement = controls.querySelector("#grad-manual-stat-count-message");
            var panelInputs = container.querySelectorAll(".grad-manual-input");

            modeSelect.value = config.mode;
            valueModeSelect.value = config.valueMode;

            function saveConfig() {
                var data = GradModal.loadManualFormData();
                data[MANUAL_STAT_COUNT_CONFIG_KEY] = cloneSafeJson(config);
                originalSaveManualFormData.call(GradModal, data);
            }

            function showMessage(text) {
                messageElement.textContent = text || "";
                if (text) setTimeout(function() {
                    if (messageElement.textContent === text) messageElement.textContent = "";
                }, 2500);
            }

            function findCurrentPreset() {
                return config.presets.find(function(preset) {
                    return preset.id === config.currentPresetId;
                }) || null;
            }

            function canonicalCounts(counts) {
                var result = {};
                Object.keys(counts || {}).sort().forEach(function(stat) {
                    if (Number(counts[stat]) > 0) result[stat] = Number(counts[stat]);
                });
                return JSON.stringify(result);
            }

            function isCurrentPresetDirty() {
                var preset = findCurrentPreset();
                return !!preset && (preset.valueMode !== config.valueMode
                    || canonicalCounts(preset.counts) !== canonicalCounts(config.counts));
            }

            function renderPresetSelect() {
                var dirty = isCurrentPresetDirty();
                presetSelect.innerHTML = '<option value="">当前组合（未保存）</option>'
                    + config.presets.map(function(preset) {
                        var label = preset.name + (dirty && preset.id === config.currentPresetId ? " *" : "");
                        return '<option value="' + escapeManualStatText(preset.id) + '">' + escapeManualStatText(label) + '</option>';
                    }).join("");
                presetSelect.value = config.currentPresetId || "";
                var hasPreset = !!findCurrentPreset();
                presetUpdateButton.disabled = !hasPreset;
                presetRenameButton.disabled = !hasPreset;
                presetDeleteButton.disabled = !hasPreset;
            }

            function applyCountPanel() {
                try {
                    var allocation = allocateManualStatCounts(config.counts);
                    if (!allocation.valid) throw new Error(allocation.reason);
                    var panel = calculateManualStatCountPanel(config, allocation);
                    // 数量模式只复用隐藏输入框展示换算值，不触发原手填模式的二次计算。
                    writeManualPanelInputs(container, panel, false);
                    renderManualStatCountPanel(panel);
                    var rate = calculateManualStatCountRate(panel);
                    if ("count" !== config.mode || !countResultElement) return;
                    if ("function" == typeof renderLabeledMetric) {
                        renderLabeledMetric(countResultElement, "Excel表格显示毕业率：", rate);
                    } else {
                        countResultElement.innerHTML = 'Excel表格显示毕业率：<strong class="metric-gold">' + escapeManualStatText(rate) + '</strong>';
                    }
                    GradModal.state.manualRate = rate;
                } catch (error) {
                    showMessage(error && error.message ? error.message : "词条换算失败");
                }
            }

            function updateStatCount(stat, requested) {
                var oldCount = config.counts[stat] || 0;
                var otherTotal = manualStatCountTotal(config) - oldCount;
                requested = Math.max(0, Math.floor(Number(requested) || 0));
                var allowed = Math.max(0, MANUAL_STAT_COUNT_MAX - otherTotal);
                var nextCount = Math.min(requested, allowed);
                var candidate = { ...config.counts };
                var rejectedReason = requested > allowed ? "普通词条总数最多 40 条" : "";
                while (nextCount >= 0) {
                    if (nextCount > 0) candidate[stat] = nextCount;
                    else delete candidate[stat];
                    var allocation = allocateManualStatCounts(candidate);
                    if (allocation.valid) break;
                    if (!rejectedReason) rejectedReason = allocation.reason;
                    nextCount--;
                }
                nextCount = Math.max(0, nextCount);
                if (nextCount < requested) {
                    showMessage((rejectedReason || stat + "受装备部位限制") + "，已调整为 " + nextCount + " 条");
                }
                if (nextCount > 0) config.counts[stat] = nextCount;
                else delete config.counts[stat];
                saveConfig();
                renderCountList();
                applyCountPanel();
            }

            function statCountRowHtml(stat, fixed) {
                var value = manualStatTargetValue(stat, config.valueMode);
                var count = config.counts[stat] || 0;
                var statLimit = getManualStatCountLimit(stat, config.counts);
                var suffix = CommonData.PERCENT_STATS.includes(stat) ? "%" : "";
                return '<div class="grad-manual-stat-count-row" data-stat="' + escapeManualStatText(stat) + '" data-fixed="' + (fixed ? "true" : "false") + '" style="display:grid;grid-template-columns:minmax(95px,1fr) 28px 48px 28px' + (fixed ? "" : " 28px") + ';gap:5px;align-items:center;padding:7px;background:rgba(0,0,0,.2);border-radius:6px;">'
                    + '<span style="color:var(--text-main);font-size:.88rem;">' + escapeManualStatText(stat) + '</span>'
                    + '<button type="button" class="grad-manual-stat-minus secondary-btn" style="padding:3px 7px;min-width:0;"' + (count <= 0 ? " disabled" : "") + '>−</button>'
                    + '<input class="grad-manual-stat-row-count" type="number" min="0" max="' + statLimit + '" step="1" value="' + count + '" style="width:100%;box-sizing:border-box;padding:5px;text-align:center;border-radius:5px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.25);color:#fff;">'
                    + '<button type="button" class="grad-manual-stat-plus secondary-btn" style="padding:3px 7px;min-width:0;"' + (count >= statLimit || manualStatCountTotal(config) >= MANUAL_STAT_COUNT_MAX ? " disabled" : "") + '>+</button>'
                    + (fixed ? "" : '<button type="button" class="grad-manual-stat-remove remove-btn" title="删除">×</button>')
                    + '<span style="grid-column:1/-1;text-align:right;color:var(--text-sub);font-size:.76rem;">' + value + suffix + ' × ' + count + ' = ' + (Math.round(value * count * 100) / 100) + suffix + (statLimit < MANUAL_STAT_COUNT_MAX ? ' · 上限 ' + statLimit : '') + '</span>'
                    + '</div>';
            }

            function renderCountList() {
                var categories = getManualStatCountCategories();
                var fixedStats = new Set();
                categories.forEach(function(category) {
                    category.stats.forEach(function(stat) { fixedStats.add(stat); });
                });
                var relevantWeaponStats = getManualRelevantWeaponStats();
                var allWeaponStats = new Set((CommonData.WEAPON_TYPES || []).map(function(weapon) {
                    return weapon && weapon.stat;
                }).filter(Boolean));
                var prunedIrrelevantWeaponStat = false;
                Object.keys(config.counts).forEach(function(stat) {
                    if (allWeaponStats.has(stat) && !relevantWeaponStats.has(stat)) {
                        delete config.counts[stat];
                        prunedIrrelevantWeaponStat = true;
                    }
                });
                if (prunedIrrelevantWeaponStat) saveConfig();
                categoryPanels.innerHTML = categories.map(function(category) {
                    var bowSelector = "神力" === category.title
                        ? '<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08);">'
                            + '<label style="display:flex;align-items:center;justify-content:space-between;gap:10px;color:var(--text-main);font-size:.88rem;">'
                            + '<span>弓箭选择</span>'
                            + '<select id="grad-manual-bow-select" class="stat-select" style="flex:1;max-width:150px;">'
                            + '<option value="precision">精准弓</option>'
                            + '<option value="crit">会心弓</option>'
                            + '<option value="intent">会意弓</option>'
                            + '</select></label></div>'
                        : "";
                    return '<section style="padding:10px;background:rgba(0,0,0,.14);border:1px solid rgba(255,255,255,.07);border-radius:7px;">'
                        + '<h4 style="margin:0 0 8px;color:var(--gold);font-size:.95rem;">' + category.title + '</h4>'
                        + '<div style="display:flex;flex-direction:column;gap:6px;">'
                        + category.stats.map(function(stat) { return statCountRowHtml(stat, true); }).join("")
                        + '</div>' + bowSelector + '</section>';
                }).join("");
                var manualBowSelect = categoryPanels.querySelector("#grad-manual-bow-select");
                if (manualBowSelect) {
                    manualBowSelect.value = UIManager.dom.bowSelect ? UIManager.dom.bowSelect.value : "precision";
                    manualBowSelect.addEventListener("change", function() {
                        if (UIManager.dom.bowSelect) {
                            UIManager.dom.bowSelect.value = this.value;
                            UIManager.dom.bowSelect.dispatchEvent(new Event("change", { bubbles: true }));
                        }
                        applyCountPanel();
                    });
                }
                var otherOptions = getManualStatCountOptions().filter(function(stat) {
                    return !fixedStats.has(stat) && (!allWeaponStats.has(stat) || relevantWeaponStats.has(stat));
                });
                statSelect.innerHTML = otherOptions.map(function(stat) {
                    return '<option value="' + escapeManualStatText(stat) + '">' + escapeManualStatText(stat) + '</option>';
                }).join("");
                var otherStats = Object.keys(config.counts).filter(function(stat) { return !fixedStats.has(stat); });
                list.innerHTML = otherStats.length
                    ? otherStats.map(function(stat) { return statCountRowHtml(stat, false); }).join("")
                    : '<div style="padding:8px;text-align:center;color:var(--text-sub);font-size:.84rem;">暂无其他词条</div>';
                var allocation = allocateManualStatCounts(config.counts);
                mainTotalElement.textContent = allocation.mainCount;
                subTotalElement.textContent = allocation.subCount;
                totalElement.textContent = allocation.target;
                renderPresetSelect();
                controls.querySelectorAll(".grad-manual-stat-count-row").forEach(function(row) {
                    var stat = row.dataset.stat;
                    row.querySelector(".grad-manual-stat-row-count").addEventListener("change", function() {
                        updateStatCount(stat, this.value);
                    });
                    row.querySelector(".grad-manual-stat-minus").addEventListener("click", function() {
                        updateStatCount(stat, (config.counts[stat] || 0) - 1);
                    });
                    row.querySelector(".grad-manual-stat-plus").addEventListener("click", function() {
                        updateStatCount(stat, (config.counts[stat] || 0) + 1);
                    });
                    var removeButton = row.querySelector(".grad-manual-stat-remove");
                    if (removeButton) removeButton.addEventListener("click", function() { updateStatCount(stat, 0); });
                });
            }

            function updateMode() {
                var countMode = "count" === config.mode;
                countPanel.style.display = countMode ? "block" : "none";
                valueModeWrap.style.display = countMode ? "flex" : "none";
                panelInputs.forEach(function(input) {
                    input.disabled = countMode;
                    input.style.opacity = countMode ? ".7" : "1";
                });
                if (panelEditor) panelEditor.style.display = countMode ? "none" : "block";
                if (panelResultElement) panelResultElement.style.display = countMode ? "none" : "block";
                if (countResultElement) countResultElement.style.display = countMode ? "block" : "none";
                if (countMode) applyCountPanel();
                else removeManualStatCountPanel();
            }

            modeSelect.addEventListener("change", function() {
                var nextMode = this.value;
                if ("count" === nextMode && "count" !== config.mode) {
                    config.manualPanel = readManualPanelInputs(container);
                }
                config.mode = nextMode;
                if ("panel" === nextMode) writeManualPanelInputs(container, config.manualPanel, true);
                saveConfig();
                updateMode();
            });
            valueModeSelect.addEventListener("change", function() {
                config.valueMode = this.value;
                saveConfig();
                renderCountList();
                applyCountPanel();
            });
            presetSelect.addEventListener("change", function() {
                var nextPresetId = this.value || null;
                if (isCurrentPresetDirty() && nextPresetId && nextPresetId !== config.currentPresetId
                    && !confirm("当前词条组合有未更新的改动，确定切换并放弃这些改动吗？")) {
                    this.value = config.currentPresetId || "";
                    return;
                }
                config.currentPresetId = nextPresetId;
                var preset = findCurrentPreset();
                if (preset) {
                    config.valueMode = preset.valueMode;
                    config.counts = cloneSafeJson(preset.counts);
                    valueModeSelect.value = config.valueMode;
                }
                saveConfig();
                renderCountList();
                applyCountPanel();
            });
            presetNewButton.addEventListener("click", function() {
                if (config.presets.length >= 50) return showMessage("每个流派最多保存 50 个词条组合");
                var suggestedName = "组合 " + (config.presets.length + 1);
                var name = prompt("请输入词条组合名称：", suggestedName);
                if (!name || !name.trim()) return;
                var id = "stat-combo-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
                config.presets.push({
                    id: id,
                    name: name.trim().slice(0, 40),
                    valueMode: config.valueMode,
                    counts: cloneSafeJson(config.counts)
                });
                config.currentPresetId = id;
                saveConfig();
                renderPresetSelect();
                showMessage("词条组合已保存");
            });
            presetUpdateButton.addEventListener("click", function() {
                var preset = findCurrentPreset();
                if (!preset) return showMessage("请先选择已保存的词条组合");
                preset.valueMode = config.valueMode;
                preset.counts = cloneSafeJson(config.counts);
                saveConfig();
                renderPresetSelect();
                showMessage("词条组合已更新");
            });
            presetRenameButton.addEventListener("click", function() {
                var preset = findCurrentPreset();
                if (!preset) return;
                var name = prompt("请输入新的词条组合名称：", preset.name);
                if (!name || !name.trim()) return;
                preset.name = name.trim().slice(0, 40);
                saveConfig();
                renderPresetSelect();
            });
            presetDeleteButton.addEventListener("click", function() {
                var preset = findCurrentPreset();
                if (!preset || !confirm("确定删除词条组合“" + preset.name + "”吗？")) return;
                config.presets = config.presets.filter(function(item) { return item.id !== preset.id; });
                config.currentPresetId = null;
                saveConfig();
                renderPresetSelect();
                showMessage("词条组合已删除");
            });
            addButton.addEventListener("click", function() {
                var stat = statSelect.value;
                var requested = Math.max(1, Math.floor(Number(addCountInput.value) || 1));
                if (!stat) return;
                updateStatCount(stat, (config.counts[stat] || 0) + requested);
            });
            clearButton.addEventListener("click", function() {
                config.counts = {};
                saveConfig();
                renderCountList();
                applyCountPanel();
            });

            if (migrationAdjustments.length) {
                saveConfig();
                showMessage("旧组合已按装备限制调整：" + migrationAdjustments.slice(0, 3).join("；")
                    + (migrationAdjustments.length > 3 ? "；另有 " + (migrationAdjustments.length - 3) + " 项" : ""));
            }
            renderCountList();
            updateMode();
        };
    }

    function collectEquipStatSummary(equippedItems, includeSurvival) {
        var SLOT_KEYS = ["weapon1", "weapon2", "head", "chest", "ring", "pendant", "legs", "hands"];
        var statsMap = {};
        var totalCount = 0;
        function addStat(stat) {
            if (!stat || !stat.type) return;
            if (!includeSurvival && (stat.type === "生存类词条" || stat.type === "生存向")) return;
            if (!statsMap[stat.type]) statsMap[stat.type] = { count: 0, total: 0, isPercent: !!stat.isPercent };
            statsMap[stat.type].count += 1;
            statsMap[stat.type].total += Number(stat.value) || 0;
            totalCount += 1;
        }
        SLOT_KEYS.forEach(function(slot) {
            var equip = equippedItems && equippedItems[slot];
            if (!equip) return;
            addStat(equip.mainStat);
            (equip.subStats || []).forEach(addStat);
            // dingyinStat intentionally not counted
        });
        return { statsMap: statsMap, totalCount: totalCount };
    }

    function getEquipStatCategories(className) {
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

        return [
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
    }

    var EQUIP_STAT_ABBR = {
            "最大外功攻击": "大外", "最小外功攻击": "小外",
            "最大鸣金攻击": "大鸣金", "最小鸣金攻击": "小鸣金",
            "最大裂石攻击": "大裂石", "最小裂石攻击": "小裂石",
            "最大牵丝攻击": "大牵丝", "最小牵丝攻击": "小牵丝",
            "最大破竹攻击": "大破竹", "最小破竹攻击": "小破竹"
        };

    function renderBuildStatsSummary(equippedItems, className) {
        var CATEGORIES = getEquipStatCategories(className);
        var statsMap = collectEquipStatSummary(equippedItems, false).statsMap;

        function renderChip(type) {
            var s = statsMap[type];
            if (!s || s.count === 0) return "";
            var label = EQUIP_STAT_ABBR[type] || type;
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

    function renderHomeStatCountSummary(equippedItems, className) {
        var container = document.getElementById("home-stat-count-summary");
        if (!container) return;
        var summary = collectEquipStatSummary(equippedItems, true);
        var statsMap = summary.statsMap;
        if (!summary.totalCount) {
            container.innerHTML = "";
            container.hidden = true;
            return;
        }
        var used = {};
        var categories = getEquipStatCategories(className).map(function(category) {
            return { label: category.label, stats: category.stats.slice() };
        });
        categories.forEach(function(category) {
            category.stats.forEach(function(type) { used[type] = true; });
        });
        var otherStats = Object.keys(statsMap).filter(function(type) { return !used[type]; })
            .sort(function(left, right) { return left.localeCompare(right, "zh-CN"); });
        if (otherStats.length) categories.push({ label: "其他", stats: otherStats });

        function renderCountChip(type) {
            var stat = statsMap[type];
            if (!stat || !stat.count) return "";
            var label = EQUIP_STAT_ABBR[type] || type;
            return '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:4px;font-size:0.78rem;white-space:nowrap;">'
                + '<span style="color:var(--text-main);">' + escapeManualStatText(label) + '</span>'
                + '<span style="color:var(--gold);font-weight:700;">×' + stat.count + '</span></span>';
        }

        var rows = categories.map(function(category) {
            var chips = category.stats.map(renderCountChip).join("");
            if (!chips) return "";
            return '<div style="display:grid;grid-template-columns:38px minmax(0,1fr);gap:6px;align-items:start;margin-bottom:6px;">'
                + '<span style="font-size:0.76rem;color:var(--text-sub);padding-top:3px;">' + escapeManualStatText(category.label) + '</span>'
                + '<div style="display:flex;flex-wrap:wrap;gap:5px;">' + chips + '</div></div>';
        }).join("");
        container.hidden = false;
        container.innerHTML = '<div style="padding:10px 12px;background:rgba(0,0,0,0.2);border:1px solid var(--border);border-radius:6px;">'
            + '<div style="font-size:0.8rem;color:var(--text-sub);margin-bottom:8px;">词条数量（主+副，不含定音）</div>'
            + rows
            + '<div style="border-top:1px solid var(--border);padding-top:7px;margin-top:3px;text-align:right;font-size:0.8rem;color:var(--text-sub);">普通词条：'
            + '<span style="color:var(--gold);font-weight:700;">' + summary.totalCount + '</span>/40</div></div>';
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
    var _restoringZhuanlvExcluded = null; // 编辑已保存装备时，用于保留 excludedTargets

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

    // 读取表单中第 idx 条副词条当前选中的词条类型名
    function getSubStatLabelAt(idx) {
        var rows = document.querySelectorAll("#sub-stats-container .stat-row");
        var row = rows[idx];
        if (!row) return "";
        var sel = row.querySelector(".sub-stat-select");
        return (sel && sel.value) ? sel.value : "";
    }

    // 只列出表单中实际存在的副词条，避免保存空槽位。
    function updateSubStatIndexLabels() {
        var sel = document.getElementById("zhuanlv-substat-index");
        if (!sel) return;
        var previous = sel.value;
        var rows = document.querySelectorAll("#sub-stats-container .stat-row");
        var options = ['<option value="">暂未指定（待转律）</option>'];
        for (var i = 0; i < rows.length; i++) {
            var label = getSubStatLabelAt(i);
            if (label) options.push('<option value="' + i + '">第' + (i + 1) + '条（' + label + '）</option>');
        }
        sel.innerHTML = options.join("");
        if (options.length && Array.prototype.some.call(sel.options, function(option) { return option.value === previous; })) {
            sel.value = previous;
        }
        sel.disabled = 1 === options.length;
        return options.length - 1;
    }

    // ── 新 UI 辅助函数 ─────────────────────────

    function injectZhuanlvStyles() {
        if (document.getElementById("zhuanlv-styles")) return;
        var style = document.createElement("style");
        style.id = "zhuanlv-styles";
        style.textContent = [
            '.zhuanlv-slot-radio {',
            '  width:18px;height:18px;border:2px solid #aaa;border-radius:3px;',
            '  background:transparent;cursor:pointer;flex-shrink:0;appearance:none;',
            '  -webkit-appearance:none;outline:none;transition:all 0.15s;',
            '  margin-right:6px;',
            '}',
            '.zhuanlv-slot-radio:hover { border-color:#fff; }',
            '.zhuanlv-slot-radio:checked {',
            '  background:#6d4a8f;border-color:#6d4a8f;',
            '}',
            '.zhuanlv-slot-radio:disabled {',
            '  border-color:#444;cursor:not-allowed;opacity:0.3;',
            '}',
            '.stat-row.has-zhuanlv-radio {',
            '  display:flex;align-items:center;',
            '}',
            '.zhuanlv-target-item {',
            '  display:inline-flex;align-items:center;gap:4px;',
            '  margin-right:14px;margin-bottom:6px;',
            '  color:#ccc;font-size:0.85rem;cursor:pointer;',
            '}',
            '.zhuanlv-target-check {',
            '  accent-color:#6d4a8f;cursor:pointer;',
            '}',
            '#zhuanlv-target-list {',
            '  margin-top:8px;padding:10px;',
            '  background:rgba(255,255,255,0.03);border-radius:6px;',
            '  border:1px solid rgba(255,255,255,0.08);',
            '}',
            '#zhuanlv-target-checkboxes {',
            '  display:flex;flex-wrap:wrap;gap:2px 0;line-height:1.9;',
            '}'
        ].join("\n");
        document.head.appendChild(style);
    }

    function clearAllZhuanlvRadios() {
        document.querySelectorAll(".zhuanlv-slot-radio").forEach(function(r) {
            r.checked = false;
        });
    }

    function injectZhuanlvSubStatRadios() {
        var rows = document.querySelectorAll("#sub-stats-container .stat-row");
        rows.forEach(function(row, index) {
            if (row.querySelector(".zhuanlv-slot-radio")) return;
            var radio = document.createElement("input");
            radio.type = "checkbox";
            radio.className = "zhuanlv-slot-radio";
            radio.setAttribute("data-index", String(index));
            radio.title = "选择第" + (index + 1) + "条副词条进行转律";
            row.insertBefore(radio, row.firstChild);
            row.classList.add("has-zhuanlv-radio");
        });
    }

    function syncZhuanlvSubStatRadios() {
        var rows = document.querySelectorAll("#sub-stats-container .stat-row");
        var selectedIndex = -1;
        rows.forEach(function(row, index) {
            var radio = row.querySelector(".zhuanlv-slot-radio");
            if (!radio) return;
            var sel = row.querySelector(".sub-stat-select");
            var hasValue = !!(sel && sel.value && "生存类词条" !== sel.value && "生存向" !== sel.value);
            radio.style.display = hasValue ? "" : "none";
            radio.disabled = !hasValue;
            if (!hasValue && radio.checked) radio.checked = false;
            if (radio.checked) selectedIndex = index;
        });
        return selectedIndex;
    }

    function onZhuanlvRadioChange(targetRadio) {
        // 浏览器已切换 checked 状态：true=选中，false=取消选中
        if (targetRadio.checked) {
            // 选中此方框 → 取消所有其他方框（radio 行为）
            document.querySelectorAll(".zhuanlv-slot-radio").forEach(function(r) {
                if (r !== targetRadio) r.checked = false;
            });
            // 确保当前方框保持选中（防御性）
            targetRadio.checked = true;
        } else {
            // 取消选中 → 回到待转律状态，清空所有
            clearAllZhuanlvRadios();
        }
        updateZhuanlvTargetList();
        autoSaveZhuanlv();
    }

    function readEquipFromForm() {
        var subStats = [];
        var selects = document.querySelectorAll("#sub-stats-container .sub-stat-select");
        var inputs = document.querySelectorAll("#sub-stats-container .stat-input");
        selects.forEach(function(sel, i) {
            if (sel.value && "生存类词条" !== sel.value && "生存向" !== sel.value) {
                subStats.push({
                    type: sel.value,
                    value: inputs[i] ? parseFloat(inputs[i].value || 0) : 0
                });
            } else if (sel.value) {
                subStats.push({ type: sel.value, value: 0 });
            }
        });
        return { subStats: subStats, level: 110, isTransmutable: true };
    }

    function updateZhuanlvTargetList() {
        var targetList = document.getElementById("zhuanlv-target-list");
        var checkboxes = document.getElementById("zhuanlv-target-checkboxes");
        if (!targetList || !checkboxes) return;

        var selectedRadio = document.querySelector(".zhuanlv-slot-radio:checked");
        if (!selectedRadio) {
            targetList.style.display = "none";
            return;
        }
        var subStatIndex = Number(selectedRadio.getAttribute("data-index"));
        if (!Number.isInteger(subStatIndex) || subStatIndex < 0) {
            targetList.style.display = "none";
            return;
        }

        // 获取当前编辑的装备
        var editId = document.getElementById("edit-id");
        var equipId = editId ? parseInt(editId.value) : 0;
        var equip = null;
        if (equipId && "function" === typeof getDB) {
            equip = getDB().find(function(e) { return String(e.id) === String(equipId); }) || null;
        }
        if (!equip) equip = readEquipFromForm();
        if (!equip || !Array.isArray(equip.subStats) || !equip.subStats[subStatIndex]) {
            targetList.style.display = "none";
            return;
        }

        // 获取流派
        var classSelect = (typeof UIManager !== "undefined" && UIManager.dom && UIManager.dom.classSelect)
            ? UIManager.dom.classSelect : null;
        var className = classSelect ? classSelect.value : "";
        if (!className) className = "鸣金虹";

        // 获取武库
        var pools = (typeof CommonData !== "undefined" && CommonData.TRANSMUTATION_POOLS)
            ? CommonData.TRANSMUTATION_POOLS : null;
        if (!pools) { targetList.style.display = "none"; return; }

        // 合并全部武库
        var allPools = Object.values(pools);
        var allTargets = [];
        var seen = {};
        allPools.forEach(function(pool) {
            (pool || []).forEach(function(stat) {
                if (!seen[stat]) { seen[stat] = true; allTargets.push(stat); }
            });
        });

        // 分析不可选原因：当前槽位自身类型 + 其他槽位已有的副词条类型
        var ownType = equip.subStats[subStatIndex] && equip.subStats[subStatIndex].type;
        var duplicateReasons = {};  // stat -> "自身" 或 "与第N条(XXX)重复"
        var otherTypes = {};
        equip.subStats.forEach(function(stat, idx) {
            if (idx !== subStatIndex && stat && stat.type) {
                otherTypes[stat.type] = true;
                duplicateReasons[stat.type] = "与第" + (idx + 1) + "条（" + stat.type + "）重复";
            }
        });
        if (ownType) {
            duplicateReasons[ownType] = "自身词条，无需转律";
        }

        allTargets.sort(function(a, b) {
            // 不可选的排到后面
            var aDisabled = !!duplicateReasons[a] ? 1 : 0;
            var bDisabled = !!duplicateReasons[b] ? 1 : 0;
            if (aDisabled !== bDisabled) return aDisabled - bDisabled;
            return a.localeCompare(b, "zh-CN");
        });

        // 读取当前的排除列表（只对可选目标有效）
        var currentExcluded = [];
        var storedExcluded = _restoringZhuanlvExcluded;
        if (!storedExcluded) {
            var rawStatus = equipId ? getZhuanlvForEquip(equipId) : null;
            var status = _pendingZhuanlv || rawStatus;
            if (status && Array.isArray(status.excludedTargets)) {
                storedExcluded = status.excludedTargets;
            }
        }
        if (storedExcluded && storedExcluded.length > 0) {
            currentExcluded = storedExcluded.filter(function(t) {
                return allTargets.indexOf(t) >= 0;
            });
        }
        var excludedSet = {};
        currentExcluded.forEach(function(t) { excludedSet[t] = true; });

        // 渲染复选框
        var html = allTargets.map(function(target) {
            var isDisabled = !!duplicateReasons[target];
            var reason = duplicateReasons[target] || "";
            if (isDisabled) {
                // 不可选：灰色，禁用，显示原因
                return '<label class="zhuanlv-target-item zhuanlv-target-disabled" title="' + reason + '" style="color:#666;cursor:not-allowed;">'
                    + '<input type="checkbox" class="zhuanlv-target-check" disabled style="accent-color:#555;cursor:not-allowed;">'
                    + ' <span style="text-decoration:line-through;">' + target + '</span>'
                    + ' <span style="font-size:0.7rem;color:#f0a500;">' + reason + '</span>'
                    + '</label>';
            }
            var checked = excludedSet[target] ? "" : " checked";
            return '<label class="zhuanlv-target-item">'
                + '<input type="checkbox" class="zhuanlv-target-check" value="' + target + '"' + checked + '>'
                + ' ' + target
                + '</label>';
        }).join("");

        checkboxes.innerHTML = html;
        targetList.style.display = allTargets.length > 0 ? "block" : "none";
        _restoringZhuanlvExcluded = null;
    }

    // 向 modal 注入转律状态 section（幂等）
    function ensureZhuanlvSection() {
        if (document.getElementById("zhuanlv-section")) return;

        injectZhuanlvStyles();

        var section = document.createElement("div");
        section.id = "zhuanlv-section";
        section.style.cssText = "display:none;";

        section.innerHTML = [
            '<hr>',
            '<h3 style="margin-bottom:8px;">转律词条</h3>',
            '<div id="zhuanlv-active-fields">',
            '  <p style="color:#888;font-size:0.82rem;margin-bottom:6px;">点击副词条左侧方框选择需要转律的词条（仅可选择一个）</p>',
            '  <div id="zhuanlv-target-list" style="display:none;">',
            '    <label style="display:block;margin-bottom:6px;color:#bbb;font-size:0.85rem;">可转目标词条（取消勾选即排除该词条）</label>',
            '    <div id="zhuanlv-target-checkboxes"></div>',
            '  </div>',
            '</div>'
        ].join("");

        var footer = document.querySelector("#equip-form .modal-footer");
        if (!footer) return;
        footer.parentNode.insertBefore(section, footer);

        // 监听副词条 select 和 radio 方框变化（都在 sub-stats-container 内）
        document.getElementById("sub-stats-container").addEventListener("change", function(e) {
            if (e.target.classList.contains("zhuanlv-slot-radio")) {
                onZhuanlvRadioChange(e.target);
                return;
            }
            if (e.target.classList.contains("sub-stat-select")) {
                syncZhuanlvSubStatRadios();
                updateZhuanlvTargetList();
                autoSaveZhuanlv();
            }
        });

        // 监听 target checkbox 变化
        section.addEventListener("change", function(e) {
            if (e.target.classList.contains("zhuanlv-target-check")) {
                autoSaveZhuanlv();
            }
        });
    }

    // 读取表单中的转律状态数据
    function readZhuanlvFromForm() {
        var transmutableCheck = document.getElementById("is-transmutable");
        if (!transmutableCheck || !transmutableCheck.checked) return null;

        var selectedRadio = document.querySelector(".zhuanlv-slot-radio:checked");
        if (!selectedRadio) return null;

        var subStatIndex = Number(selectedRadio.getAttribute("data-index"));
        if (!Number.isInteger(subStatIndex) || !getSubStatLabelAt(subStatIndex)) return null;

        // 收集排除的目标词条（跳过灰色禁用项）
        var excludedTargets = [];
        document.querySelectorAll(".zhuanlv-target-check:not(:checked):not([disabled])").forEach(function(cb) {
            if (cb.value) excludedTargets.push(cb.value);
        });

        return {
            state: "active",
            subStatIndex: subStatIndex,
            excludedTargets: excludedTargets,
            modelVersion: TRANSMUTATION_STATUS_MODEL_VERSION
        };
    }

    // 表单内只维护草稿；装备真正保存成功后再一次性提交，取消编辑不得污染存储。
    function autoSaveZhuanlv() {
        _pendingZhuanlv = readZhuanlvFromForm();
    }

    function commitZhuanlvFromModal(equipId) {
        var status = readZhuanlvFromForm();
        setZhuanlvForEquip(equipId, status);
        _pendingZhuanlv = null;
        setTimeout(refreshAllZhuanlvBadges, 100);
    }

    // 从存储数据回填表单
    function populateZhuanlvSection(equipId) {
        var transmutableCheck = document.getElementById("is-transmutable");
        if (!transmutableCheck) return;

        var equip = null;
        if (equipId && "function" === typeof getDB) {
            equip = getDB().find(function(item) { return String(item.id) === String(equipId); }) || null;
        }
        var rawStatus = equipId ? getZhuanlvForEquip(equipId) : null;
        var status = normalizeZhuanlvStatus(rawStatus, equip);
        if (rawStatus && !status) setZhuanlvForEquip(equipId, null);
        transmutableCheck.checked = !!(equip && isTransmutableEquip(equip));

        // 只有已勾选可转律时才注入 radio 并回填状态
        if (transmutableCheck.checked) {
            injectZhuanlvSubStatRadios();
            syncZhuanlvSubStatRadios();
            clearAllZhuanlvRadios();

            // 回填选中的 radio
            if (status && status.state === "active") {
                var targetRadio = document.querySelector('.zhuanlv-slot-radio[data-index="' + status.subStatIndex + '"]');
                if (targetRadio && !targetRadio.disabled) {
                    targetRadio.checked = true;
                    _restoringZhuanlvExcluded = status.excludedTargets || [];
                }
            }

            // 延迟刷新 target 列表（等 DOM 稳定）
            setTimeout(function() {
                updateZhuanlvTargetList();
                // 应用存储的排除项
                if (_restoringZhuanlvExcluded && _restoringZhuanlvExcluded.length > 0) {
                    var excludeSet = {};
                    _restoringZhuanlvExcluded.forEach(function(t) { excludeSet[t] = true; });
                    document.querySelectorAll(".zhuanlv-target-check").forEach(function(cb) {
                        if (excludeSet[cb.value]) cb.checked = false;
                    });
                    _restoringZhuanlvExcluded = null;
                }
            }, 60);
        }
    }

    // 非110级不显示"可转律"，并清除资格与指定槽位。
    function syncZhuanlvSectionVisibility() {
        var section = document.getElementById("zhuanlv-section");
        var levelSel = document.getElementById("level-select");
        var level = levelSel ? parseInt(levelSel.value) : 105;
        var wrapper = document.getElementById("transmutable-checkbox-wrapper");
        var transmutableCheck = document.getElementById("is-transmutable");
        var allowLevel = level === 110;
        var enabled = allowLevel && !!(transmutableCheck && transmutableCheck.checked);

        if (wrapper) wrapper.style.display = allowLevel ? "" : "none";
        if (section) section.style.display = enabled ? "block" : "none";
        if (!allowLevel && transmutableCheck) transmutableCheck.checked = false;

        if (allowLevel) {
            // 预注入 radio 方框（幂等）：勾选/取消勾选只做显隐与选中态切换，不再反复增删节点、触发行重排
            injectZhuanlvSubStatRadios();
            syncZhuanlvSubStatRadios();
            if (!enabled) clearAllZhuanlvRadios();
        } else {
            // 非110级：移除残留的 radio 方框
            var radios = document.querySelectorAll(".zhuanlv-slot-radio");
            radios.forEach(function(r) { r.parentNode && r.parentNode.removeChild(r); });
            document.querySelectorAll(".stat-row.has-zhuanlv-radio").forEach(function(row) {
                row.classList.remove("has-zhuanlv-radio");
            });
        }

        if (!enabled) {
            _pendingZhuanlv = null;
            _restoringZhuanlvExcluded = null;
            var targetList = document.getElementById("zhuanlv-target-list");
            if (targetList) targetList.style.display = "none";
        }
    }

    // ── 卡片徽标注入 ──────────────────────────────

    function buildZhuanlvTag(text, color) {
        return '<span class="zhuanlv-badge" style="'
            + 'font-size:0.72rem;border:1px solid ' + color + ';color:' + color + ';'
            + 'display:inline-flex;align-items:center;max-width:100%;min-width:0;'
            + 'padding:0 5px;border-radius:3px;white-space:normal;line-height:1.25;'
            + 'overflow-wrap:anywhere;word-break:break-word;">'
            + text + '</span>';
    }

    function renderZhuanlvBadgeOnCard(cardEl, status, isEligible) {
        // 移除旧的注入元素
        cardEl.querySelectorAll(".zhuanlv-badge,.zhuanlv-substat-marker")
            .forEach(function(el) { el.parentNode && el.parentNode.removeChild(el); });
        cardEl.querySelectorAll(".zhuanlv-substat-highlight")
            .forEach(function(el) {
                el.querySelectorAll(".sub-stat").forEach(function(span) {
                    span.style.fontWeight = "";
                    span.style.color = "";
                });
                el.classList.remove("zhuanlv-substat-highlight");
                el.style.background = "";
                el.style.borderRadius = "";
                el.style.paddingLeft = "";
                el.style.paddingRight = "";
                el.style.fontWeight = "";
                el.style.color = "";
            });

        if (!isEligible) return;

        // 找卡片 header 中的 flex 行（含等级标签的那行）
        var flexRow = cardEl.querySelector(".card-header .card-title div[style]");
        var cardTitle = cardEl.querySelector(".card-header .card-title");
        if (cardTitle) cardTitle.style.minWidth = "0";
        if (flexRow) {
            flexRow.style.flexWrap = "wrap";
            flexRow.style.alignItems = "center";
            flexRow.style.minWidth = "0";
            flexRow.style.maxWidth = "100%";
        }

        if (!status || status.state === "none") {
            if (flexRow) flexRow.insertAdjacentHTML("beforeend", buildZhuanlvTag("待转律", "#888"));
            return;
        }

        if (status.state === "active") {
            var idx = status.subStatIndex || 0;
            var subStatRows = Array.prototype.filter.call(
                cardEl.querySelectorAll(".card-body .stat-line"),
                function(r) { return r.querySelector(".sub-stat"); }
            );
            var targetRow = subStatRows[idx];
            if (flexRow) {
                flexRow.insertAdjacentHTML("beforeend",
                    buildZhuanlvTag("已转律：第" + (idx + 1) + "条", "#f0a500"));
            }

            // 标记选定副词条行（只选含 .sub-stat 的行）
            if (targetRow) {
                targetRow.classList.add("zhuanlv-substat-highlight");
                targetRow.style.background = "rgba(240,165,0,0.12)";
                targetRow.style.borderRadius = "4px";
                targetRow.style.paddingLeft = "4px";
                targetRow.style.paddingRight = "4px";
                targetRow.style.fontWeight = "700";
                targetRow.style.color = "#f0a500";

                var subStatSpan = targetRow.querySelector(".sub-stat");
                if (subStatSpan) {
                    subStatSpan.style.fontWeight = "700";
                    subStatSpan.style.color = "#f0a500";
                    // 找到文字节点（如 "· 精准率"），在 "· " 之后插入箭头
                    var textNode = subStatSpan.firstChild;
                    var marker = document.createElement("span");
                    marker.className = "zhuanlv-substat-marker";
                    marker.style.cssText = "color:#f0a500;font-weight:900;margin-right:3px;text-shadow:0 0 6px rgba(240,165,0,0.45);";
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
        var equipById = new Map();
        if ("function" === typeof getDB) {
            getDB().forEach(function(equip) { equipById.set(String(equip.id), equip); });
        }
        var map = loadZhuanlvMap();
        var cleanMap = filterZhuanlvMapForEquips(map, Array.from(equipById.values()));
        if (JSON.stringify(map) !== JSON.stringify(cleanMap)) saveZhuanlvMap(cleanMap);
        var cards = document.querySelectorAll("#equipment-grid .equip-card[data-equip-id]");
        cards.forEach(function(card) {
            var id = card.getAttribute("data-equip-id");
            if (!id) return;
            var equip = equipById.get(String(id));
            var eligible = isTransmutableEquip(equip);
            var status = eligible ? cleanMap[String(id)] || null : null;
            renderZhuanlvBadgeOnCard(card, status, eligible);
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
                            // 延迟到下一 tick：handleEditEquip 在 openModal() 之后才设置
                            // checkbox 等表单字段，同步执行会读取到上一次编辑的残留状态
                            var editId = document.getElementById("edit-id");
                            var id = editId ? parseInt(editId.value) : 0;
                            _currentEditEquipId = id || null;
                            setTimeout(function() {
                                syncZhuanlvSectionVisibility();
                                populateZhuanlvSection(_currentEditEquipId);
                            }, 0);
                        } else {
                            _currentEditEquipId = null;
                            _pendingZhuanlv = null;
                        }
                    }
                });
            }).observe(modal, { attributes: true });
        }

        // 监听等级和显式"可转律"资格变化。
        document.addEventListener("change", function(e) {
            if (e.target && (e.target.id === "level-select" || e.target.id === "is-transmutable")) {
                syncZhuanlvSectionVisibility();
                autoSaveZhuanlv();
            }
        });

        // 监听 equipment-grid 子节点变化，刷新徽标
        var grid = document.getElementById("equipment-grid");
        if (grid) {
            new MutationObserver(function() {
                setTimeout(refreshAllZhuanlvBadges, 80);
            }).observe(grid, { childList: true, subtree: true });
        } else {
            // grid 可能还未渲染，延迟等待
            var _gridObserver = new MutationObserver(function() {
                var g = document.getElementById("equipment-grid");
                if (g) {
                    _gridObserver.disconnect();
                    new MutationObserver(function() {
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

    // ─────────────────────────────────────────
    // 两状态转律建议：未转律比较全部副词条，已转律只分析指定槽位。
    // ─────────────────────────────────────────

    function getAdviceStatus(equip) {
        var equipId = equip && ("function" === typeof getOriginalEquipId ? getOriginalEquipId(equip) : equip.id);
        return normalizeZhuanlvStatus(getZhuanlvForEquip(equipId), equip);
    }

    function installTwoStateTransmutationAdvice() {
        if ("undefined" === typeof GradModal || !GradModal) return;

        GradModal.renderTransmutationTab = function(slotKey) {
            var container = this.dom.tabContentTransmutation;
            if (!container) return;
            this.state.transmutationAdviceToken = null;
            var currentEquip = this.state.currentEquips[slotKey];
            var equip = this.state.transmutationTarget || currentEquip;
            if (!equip) {
                container.innerHTML = '<p style="color:#888;text-align:center;margin-top:30px;">当前部位未穿戴装备，请先穿戴或选择分析装备</p>'
                    + '<div style="text-align:center;margin-top:16px;"><button class="primary-btn" id="transmute-pick-btn">选择/录入装备</button></div>'
                    + '<div id="transmute-result-area" style="margin-top:14px;"></div>';
                document.getElementById("transmute-pick-btn").addEventListener("click", function() {
                    GradModal.handlePickTransmutationEquip(slotKey, null);
                });
                return;
            }
            if (!isTransmutableEquip(equip)) {
                container.innerHTML = '<p style="color:#ff9800;text-align:center;margin-top:30px;">该装备不可转律，请选择已勾选"可转律"的110级装备</p>'
                    + '<div style="text-align:center;margin-top:16px;"><button class="primary-btn" id="transmute-pick-btn">选择可转律装备</button></div>'
                    + '<div id="transmute-result-area" style="margin-top:14px;"></div>';
                document.getElementById("transmute-pick-btn").addEventListener("click", function() {
                    GradModal.handlePickTransmutationEquip(slotKey, null);
                });
                return;
            }

            var status = getAdviceStatus(equip);
            var activeIndex = status ? status.subStatIndex : null;
            var isActive = null !== activeIndex;
            var statCards = (equip.subStats || []).map(function(stat, index) {
                var selected = isActive && index === activeIndex;
                var muted = isActive && !selected;
                return '<div class="transmute-sub-btn ' + (selected ? 'selected' : '') + '" style="' + (muted ? 'opacity:.45;' : '') + '">'
                    + '<span>第' + (index + 1) + '条：' + stat.type + '</span>'
                    + '<span style="color:#aaa;">+' + stat.value + (stat.isPercent ? '%' : '') + '</span></div>';
            }).join("");
            var explanation = isActive
                ? '该装备已转律，只分析指定的第' + (activeIndex + 1) + '条副词条；结果包含转律库全部合法词条和切回原词条。'
                : '该装备待转律，将分别分析所有副词条，比较最值得指定的槽位；每个槽位均包含保留原词条的结果。';
            container.innerHTML = '<div class="transmute-target-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">'
                + '<div style="display:flex;align-items:center;gap:10px;"><img src="' + getEquipIcon(equip) + '" style="width:44px;height:44px;border-radius:4px;border:1px solid #555;">'
                + '<div><div style="color:#fff;font-weight:700;">' + equip.name + '</div><div style="color:#9aa0a6;font-size:.85rem;">分析部位：' + this.getSlotName(slotKey) + '</div></div></div>'
                + '<button class="secondary-btn" id="transmute-pick-btn" style="padding:6px 10px;">更换分析装备</button></div></div>'
                + '<div style="color:#aaa;font-size:.9rem;line-height:1.7;">' + explanation + '</div>'
                + '<div class="transmute-subs-container">' + statCards + '</div>'
                + '<div style="display:flex;justify-content:center;margin-bottom:12px;"><button class="primary-btn" id="transmute-start-btn">'
                + (isActive ? '计算当前最佳切换' : '比较所有副词条') + '</button></div><div id="transmute-result-area"></div>';
            document.getElementById("transmute-pick-btn").addEventListener("click", function() {
                GradModal.handlePickTransmutationEquip(slotKey, equip);
            });
            document.getElementById("transmute-start-btn").addEventListener("click", function() {
                GradModal.startTransmutationCalc(slotKey);
            });
            var cached = this.state.transmutationResult;
            if (cached && cached.slotKey === slotKey && String(cached.equipId) === String(equip.id)) {
                this.renderTransmutationResult(cached);
            }
        };

        GradModal.startTransmutationCalc = function(slotKey) {
            var resultElement = document.getElementById("transmute-result-area");
            if (!resultElement) return;
            var equip = this.state.transmutationTarget || this.state.currentEquips[slotKey];
            if (!equip || !Array.isArray(equip.subStats) || !equip.subStats.length) {
                resultElement.innerHTML = '<p class="error-text">该装备没有可分析的副词条</p>';
                return;
            }
            if (!isTransmutableEquip(equip)) {
                resultElement.innerHTML = '<p class="error-text">只有已勾选"可转律"的110级装备可以计算转律建议</p>';
                return;
            }
            var className = UIManager.dom.classSelect.value;
            if (!className) {
                resultElement.innerHTML = '<p class="error-text">请先在主界面选择流派</p>';
                return;
            }
            var status = getAdviceStatus(equip);
            var isActive = !!status;
            var indexes = isActive ? [status.subStatIndex] : equip.subStats.map(function(_, index) { return index; });
            var baseEquips = Object.assign({}, this.state.currentEquips);
            baseEquips[slotKey] = equip;
            var baseRate = parseFloat(this.calcRate(baseEquips).graduationRate);
            if (!Number.isFinite(baseRate)) {
                resultElement.innerHTML = '<p class="error-text">当前方案毕业率计算失败</p>';
                return;
            }
            var calculationToken = String(equip.id) + ":" + slotKey + ":" + Date.now();
            this.state.transmutationAdviceToken = calculationToken;
            resultElement.innerHTML = '<div class="transmute-result-card transmute-result-loading"><div class="loading-spinner">正在比较转律库词条，请稍候...</div></div>';

            setTimeout(function() {
                if (GradModal.state.transmutationAdviceToken !== calculationToken) return;
                try {
                    var comparisons = indexes.map(function(subStatIndex) {
                        var originalStat = equip.subStats[subStatIndex];
                        var options = [{
                            subIndex: subStatIndex,
                            fromStat: originalStat.type,
                            toStat: originalStat.type,
                            rate: baseRate,
                            isOriginal: true
                        }];
                        GradModal.getTransmutationVariants(equip, className, subStatIndex, true).forEach(function(item) {
                            var variantEquips = Object.assign({}, baseEquips);
                            variantEquips[slotKey] = item.variant;
                            var rate = parseFloat(GradModal.calcRate(variantEquips).graduationRate);
                            if (Number.isFinite(rate)) {
                                options.push({
                                    subIndex: subStatIndex,
                                    fromStat: item.fromStat,
                                    toStat: item.toStat,
                                    rate: rate,
                                    isOriginal: false
                                });
                            }
                        });
                        options.sort(function(left, right) { return right.rate - left.rate; });
                        return {
                            subIndex: subStatIndex,
                            fromStat: originalStat.type,
                            best: options[0],
                            checkedCount: options.length
                        };
                    });
                    comparisons.sort(function(left, right) {
                        return right.best.rate - left.best.rate || left.subIndex - right.subIndex;
                    });
                    var bestComparison = comparisons[0];
                    var result = {
                        slotKey: slotKey,
                        equipId: equip.id,
                        isActive: isActive,
                        currentRate: baseRate,
                        bestRate: bestComparison.best.rate,
                        diff: bestComparison.best.rate - baseRate,
                        comparisons: comparisons,
                        best: bestComparison.best,
                        checkedCount: comparisons.reduce(function(total, item) { return total + item.checkedCount; }, 0)
                    };
                    if (GradModal.state.transmutationAdviceToken !== calculationToken) return;
                    GradModal.state.transmutationResult = result;
                    GradModal.renderTransmutationResult(result);
                } catch (error) {
                    resultElement.innerHTML = '<p class="error-text">计算过程中出现错误：' + error.message + '</p>';
                }
            }, 20);
        };

        GradModal.renderTransmutationResult = function(result) {
            var resultElement = document.getElementById("transmute-result-area");
            if (!resultElement || !result) return;
            var diff = result.diff;
            var sign = diff > 0 ? "+" : "";
            var diffClass = diff > 1e-4 ? "diff-up" : diff < -1e-4 ? "diff-down" : "diff-equal";
            var color = diff > 1e-4 ? "#4caf50" : diff < -1e-4 ? "#f44336" : "#ffc107";
            var title = diff > 1e-4
                ? (result.isActive ? "建议切换" : "建议指定该副词条")
                : (result.isActive ? "建议切回或保持原词条" : "暂不建议转律");
            var bestComparison = result.comparisons[0];
            var advice = bestComparison.best.isOriginal
                ? (result.isActive ? "当前指定槽位的最佳结果是切回或保持原词条" : "所有副词条的最佳结果均为保留原词条")
                : "第" + (bestComparison.subIndex + 1) + "条：" + bestComparison.fromStat + " → " + bestComparison.best.toStat;
            var rows = result.comparisons.slice().sort(function(left, right) { return left.subIndex - right.subIndex; }).map(function(item) {
                var itemDiff = item.best.rate - result.currentRate;
                var itemSign = itemDiff > 1e-4 ? "+" : "";
                var action = item.best.isOriginal ? "保留原词条" : item.fromStat + " → " + item.best.toStat;
                return '<div style="display:grid;grid-template-columns:minmax(82px,.6fr) minmax(145px,1.4fr) minmax(105px,.8fr);gap:10px;padding:8px 4px;border-bottom:1px solid rgba(255,255,255,.08);align-items:center;">'
                    + '<span>第' + (item.subIndex + 1) + '条</span><span>' + action + '</span>'
                    + '<span style="text-align:right;color:' + (itemDiff > 1e-4 ? '#4caf50' : '#ffc107') + ';">' + item.best.rate.toFixed(2) + '%（' + itemSign + itemDiff.toFixed(2) + '）</span></div>';
            }).join("");
            resultElement.innerHTML = '<div class="transmute-result-card transmute-result-centered">'
                + '<div style="color:' + color + ';font-weight:700;font-size:1.05rem;margin-bottom:8px;">' + title + '</div>'
                + '<div style="color:#ddd;line-height:1.7;">当前装备原词条毕业率：<span style="color:#fff;font-weight:700;">' + result.currentRate.toFixed(2) + '%</span><br>'
                + '最佳转律毕业率：<span style="color:#fff;font-weight:700;">' + result.bestRate.toFixed(2) + '%</span><br>'
                + '差值：<span class="' + diffClass + '" style="font-weight:700;">' + sign + diff.toFixed(2) + '%</span></div>'
                + '<div style="margin-top:10px;color:#fff;font-size:.9rem;">' + advice + '</div></div>'
                + '<div class="transmute-bestbuild-card transmute-result-centered" style="text-align:left;">'
                + '<div style="color:var(--gold);font-weight:700;margin-bottom:6px;">副词条比较（共计算' + result.checkedCount + '种状态）</div>' + rows + '</div>';
        };
    }

    // ── Monkey-patch: 让 getTransmutationVariants 尊重 excludedTargets ──
    function installTransmutationVariantFilter() {
        if ("undefined" === typeof GradModal || !GradModal || !GradModal.getTransmutationVariants) return;

        var _originalGetVariants = GradModal.getTransmutationVariants;

        GradModal.getTransmutationVariants = function(equip, className, subStatIndex, useAllPools) {
            var variants = _originalGetVariants.call(this, equip, className, subStatIndex, useAllPools);

            var equipId = "function" === typeof getOriginalEquipId
                ? getOriginalEquipId(equip)
                : equip.id;
            var status = getZhuanlvForEquip(equipId);
            var normalized = normalizeZhuanlvStatus(status, equip);
            if (!normalized || !Array.isArray(normalized.excludedTargets) || normalized.excludedTargets.length === 0) {
                return variants;
            }

            var excludedSet = {};
            normalized.excludedTargets.forEach(function(t) { excludedSet[t] = true; });

            // 只有当选中的 subStatIndex 与状态中的一致时才过滤
            // subStatIndex === null 表示操作所有槽位，也应用过滤
            if (subStatIndex === null || normalized.subStatIndex === subStatIndex) {
                return variants.filter(function(v) {
                    return !excludedSet[v.toStat];
                });
            }
            return variants;
        };
    }

    // ─────────────────────────────────────────────

    api.ensureLevelSelect = ensureLevelSelect;
    api.ensureJsonControls = ensureJsonControls;
    api.downloadJsonDataAsFile = downloadJsonDataAsFile;
    api.handleJsonFileImport = handleJsonFileImport;
    api.buildFullBackupPayload = buildFullBackupPayload;
    api.validateFullBackup = validateFullBackup;
    api.restoreFullBackup = restoreFullBackup;
    api.FULL_BACKUP_KIND = FULL_BACKUP_KIND;
    api.FULL_BACKUP_SCHEMA_VERSION = FULL_BACKUP_SCHEMA_VERSION;
    api.renderBuildStatsSummary = renderBuildStatsSummary;
    api.collectEquipStatSummary = collectEquipStatSummary;
    api.renderHomeStatCountSummary = renderHomeStatCountSummary;
    api.allocateManualStatCounts = allocateManualStatCounts;
    api.isTransmutableEquip = isTransmutableEquip;
    api.loadZhuanlvMap = loadZhuanlvMap;
    api.getZhuanlvForEquip = getZhuanlvForEquip;
    api.refreshAllZhuanlvBadges = refreshAllZhuanlvBadges;
    api.commitZhuanlvFromModal = commitZhuanlvFromModal;
    api.installTwoStateTransmutationAdvice = installTwoStateTransmutationAdvice;
    api.installTransmutationVariantFilter = installTransmutationVariantFilter;

    purgeRemovedTransmutationCooldownData();
    migrateTransmutationToExplicitEligibility();
    migrateTransmutationStatusesToLevel110();
    migrateTransmutationStatusesToTwoState();
    ensureLevelSelect();
    ensureJsonControls();
    bindJsonControls();
    initZhuanlvObservers();
    window.addEventListener("load", function() {
        initRegularImportClear();
        initManualStatCountMode();
        installTwoStateTransmutationAdvice();
        installTransmutationVariantFilter();
    });
})();
