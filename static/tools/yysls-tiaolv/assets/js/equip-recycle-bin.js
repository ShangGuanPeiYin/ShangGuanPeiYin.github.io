(function(root, factory) {
    var api = factory();
    if ("object" == typeof module && module.exports) module.exports = api;
    root.YYSLSEquipRecycleBin = api;
})("undefined" != typeof window ? window : globalThis, function() {
    var RETENTION_MS = 15 * 24 * 60 * 60 * 1000;
    var KEY_PREFIX = "game_equip_recycle_bin_";
    var EQUIP_SLOT_KEYS = ["weapon1", "weapon2", "head", "chest", "ring", "pendant", "legs", "hands"];

    function keyFor(accountName) {
        return KEY_PREFIX + accountName;
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function readRaw(storage, accountName) {
        try {
            var records = JSON.parse(storage.getItem(keyFor(accountName)) || "[]");
            return Array.isArray(records) ? records.filter(function(record) {
                return record && record.equip && null != record.equip.id && Number.isFinite(record.deletedAt);
            }) : [];
        } catch (error) {
            return [];
        }
    }

    function write(storage, accountName, records) {
        if (records.length) storage.setItem(keyFor(accountName), JSON.stringify(records));
        else storage.removeItem(keyFor(accountName));
    }

    function prune(storage, accountName, now) {
        var records = readRaw(storage, accountName);
        var active = records.filter(function(record) {
            return now - record.deletedAt < RETENTION_MS;
        });
        if (active.length !== records.length) write(storage, accountName, active);
        return active;
    }

    function list(storage, accountName, now) {
        return clone(prune(storage, accountName, now));
    }

    function trash(storage, accountName, equip, deletedAt) {
        var records = prune(storage, accountName, deletedAt).filter(function(record) {
            return String(record.equip.id) !== String(equip.id);
        });
        records.unshift({ equip: clone(equip), deletedAt: deletedAt });
        write(storage, accountName, records);
    }

    function restore(storage, accountName, equipId, now) {
        var restored = null;
        var records = prune(storage, accountName, now).filter(function(record) {
            if (String(record.equip.id) !== String(equipId)) return true;
            restored = record.equip;
            return false;
        });
        write(storage, accountName, records);
        return restored ? clone(restored) : null;
    }

    function discard(storage, accountName, equipId, now) {
        var records = prune(storage, accountName, now).filter(function(record) {
            return String(record.equip.id) !== String(equipId);
        });
        write(storage, accountName, records);
    }

    function removeEquipReferences(loadouts, equipId) {
        Object.keys(loadouts || {}).forEach(function(className) {
            var classData = loadouts[className];
            var schemes = classData && classData.schemes ? classData.schemes : classData ? { "默认": classData } : {};
            Object.keys(schemes).forEach(function(schemeName) {
                var scheme = schemes[schemeName];
                if (!scheme || "object" != typeof scheme) return;
                EQUIP_SLOT_KEYS.forEach(function(slotKey) {
                    if (String(scheme[slotKey]) === String(equipId)) scheme[slotKey] = null;
                });
                if (scheme.transmutationSelections && "object" == typeof scheme.transmutationSelections) {
                    Object.keys(scheme.transmutationSelections).forEach(function(selectionId) {
                        if (String(selectionId) === String(equipId)) delete scheme.transmutationSelections[selectionId];
                    });
                }
            });
        });
    }

    function removeTransmutationSelection(selections, equipId) {
        if (!selections || "object" != typeof selections) return;
        Object.keys(selections).forEach(function(selectionId) {
            if (String(selectionId) === String(equipId)) delete selections[selectionId];
        });
    }

    return {
        RETENTION_MS: RETENTION_MS,
        KEY_PREFIX: KEY_PREFIX,
        keyFor: keyFor,
        list: list,
        trash: trash,
        restore: restore,
        discard: discard,
        removeEquipReferences: removeEquipReferences,
        removeTransmutationSelection: removeTransmutationSelection,
        prune: prune
    };
});

(function() {
    "use strict";

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>"']/g, function(character) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
        });
    }

    function formatDeletedAt(value) {
        return new Date(value).toLocaleString("zh-CN", { hour12: false });
    }

    function formatRemainingTime(deletedAt) {
        var remaining = Math.max(0, deletedAt + window.YYSLSEquipRecycleBin.RETENTION_MS - Date.now());
        var days = Math.floor(remaining / 86400000);
        var hours = Math.ceil((remaining % 86400000) / 3600000);
        return days ? "约 " + days + " 天 " + hours + " 小时后清理" : "约 " + hours + " 小时后清理";
    }

    function initRecycleBinUi() {
        if (document.getElementById("recycle-bin-btn") || "undefined" == typeof AppState || "undefined" == typeof UIManager) return;

        var renameAllButton = document.getElementById("rename-all-btn");
        if (!renameAllButton) return;

        var button = document.createElement("button");
        button.id = "recycle-bin-btn";
        button.className = "secondary-btn";
        button.type = "button";
        renameAllButton.parentNode.insertBefore(button, renameAllButton);

        var modal = document.createElement("div");
        modal.id = "recycle-bin-modal";
        modal.className = "modal hidden ocr-modal-z-index";
        modal.innerHTML = '<div class="modal-content modal-content-export" style="max-width:720px"><div class="modal-header"><h2>装备回收站</h2><span class="close-btn" data-recycle-action="close">&times;</span></div><div class="modal-body"><p style="margin-top:0;color:var(--text-sub)">装备删除后会保留 15 天。恢复只会放回装备库，不会修改当前穿戴或方案。</p><div id="recycle-bin-list"></div></div></div>';
        document.body.appendChild(modal);
        var listElement = modal.querySelector("#recycle-bin-list");

        function accountName() {
            return AppState.currentAccount || "";
        }

        function records() {
            return accountName() ? window.YYSLSEquipRecycleBin.list(localStorage, accountName(), Date.now()) : [];
        }

        function updateButton() {
            var count = records().length;
            button.textContent = count ? "回收站 (" + count + ")" : "回收站";
            button.disabled = !accountName();
        }

        function render() {
            var entries = records();
            if (!entries.length) {
                listElement.innerHTML = '<div class="empty-equip-message" style="display:block;margin:12px 0">回收站为空</div>';
                updateButton();
                return;
            }
            listElement.innerHTML = entries.map(function(record, index) {
                var equip = record.equip;
                return '<div style="display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)">'
                    + '<div style="flex:1;min-width:0"><strong>' + escapeHtml(equip.name) + '</strong>'
                    + '<div style="margin-top:5px;color:var(--text-sub);font-size:.85rem">'
                    + escapeHtml(equip.slotName || "装备") + ' · ' + escapeHtml(equip.level || 105) + '级 · 删除于 ' + formatDeletedAt(record.deletedAt)
                    + '<br>' + formatRemainingTime(record.deletedAt) + '</div></div>'
                    + '<button class="secondary-btn" type="button" data-recycle-action="restore" data-recycle-index="' + index + '">恢复</button>'
                    + '<button class="danger-btn" type="button" data-recycle-action="discard" data-recycle-index="' + index + '">永久删除</button></div>';
            }).join("");
            updateButton();
        }

        function refreshLibrary() {
            UIManager.renderLibrary(filterDB(getDB()), getHandlers());
            UIManager.updateSimulatorGrid(AppState.equippedItems);
            updateStats();
        }

        button.addEventListener("click", function() {
            render();
            modal.classList.remove("hidden");
        });
        modal.addEventListener("click", function(event) {
            if (event.target === modal || event.target.closest('[data-recycle-action="close"]')) {
                modal.classList.add("hidden");
                return;
            }
            var actionButton = event.target.closest("[data-recycle-action]");
            if (!actionButton) return;
            var index = Number(actionButton.dataset.recycleIndex);
            var record = records()[index];
            if (!record) return void render();
            var currentDb = getDB();
            if ("restore" === actionButton.dataset.recycleAction) {
                if (currentDb.some(function(equip) { return String(equip.id) === String(record.equip.id); })) {
                    return void alert("装备库中已存在相同 ID 的装备，无法恢复。请先处理重复数据。");
                }
                try {
                    currentDb.push(record.equip);
                    saveDB(currentDb);
                } catch (error) {
                    console.error("恢复回收站装备失败：", error);
                    return void alert("恢复装备失败，回收站中的副本仍已保留。请检查浏览器存储空间后重试。");
                }
                window.YYSLSEquipRecycleBin.discard(localStorage, accountName(), record.equip.id, Date.now());
                refreshLibrary();
            } else if ("discard" === actionButton.dataset.recycleAction) {
                if (!confirm("永久删除后无法恢复，确定？")) return;
                window.YYSLSEquipRecycleBin.discard(localStorage, accountName(), record.equip.id, Date.now());
            }
            window.dispatchEvent(new Event("yysls-recycle-bin-changed"));
            render();
        });
        window.addEventListener("yysls-recycle-bin-changed", updateButton);
        document.getElementById("account-select").addEventListener("change", function() { setTimeout(updateButton, 0); });
        updateButton();
    }

    if ("undefined" != typeof window) window.addEventListener("load", initRecycleBinUi);
})();
