(function() {
    "use strict";

    var SUPABASE_URL = "https://ffxrckbhryicvhnzvldd.supabase.co";
    var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fTjJJCzH8AsaNEw5gSfyDQ_JPfQ4Fsg";
    var AUTO_BACKUP_DELAY_MS = 30000;
    var AUTO_SNAPSHOT_INTERVAL_MS = 30 * 60 * 1000;
    var HISTORY_LIMIT = 20;
    var META_PREFIX = "tiaolv_cloud_";
    var api = window.TiaolvLocalCustomizations;
    var client = null;
    var state = {
        session: null,
        latest: null,
        history: [],
        busy: false,
        dirty: false,
        conflict: false,
        conflictReason: "",
        remoteReady: false,
        remoteLoading: false,
        remoteRetryDelay: 30000,
        changeVersion: 0,
        sessionVersion: 0,
        backupTimer: null,
        remoteRetryTimer: null
    };
    var elements = {};

    function metaKey(name, userId) {
        return META_PREFIX + name + (userId ? "_" + userId : "");
    }

    function getUserId() {
        return state.session && state.session.user && state.session.user.id || "";
    }

    function isAutoEnabled() {
        var userId = getUserId();
        if (!userId) return false;
        return localStorage.getItem(metaKey("auto", userId)) !== "0";
    }

    function hasLocalAccounts() {
        try {
            var accounts = JSON.parse(localStorage.getItem("game_account_list") || "[]");
            return Array.isArray(accounts) && accounts.some(function(name) {
                return "string" === typeof name && !!name.trim();
            });
        } catch (error) {
            return false;
        }
    }

    function isBackupDataKey(key) {
        if (!key || 0 === key.indexOf(META_PREFIX)) return false;
        return "game_account_list" === key
            || "last_selected_account" === key
            || 0 === key.indexOf("game_equip_data_")
            || 0 === key.indexOf("game_sim_data_")
            || 0 === key.indexOf("zhuanlv_status_")
            || 0 === key.indexOf("grad_manual_form_v2_");
    }

    function formatTime(value) {
        if (!value) return "尚未备份";
        var date = new Date(value);
        if (Number.isNaN(date.getTime())) return "时间未知";
        return date.toLocaleString("zh-CN", { hour12: false });
    }

    function sourceLabel(source) {
        return {
            auto: "自动备份",
            manual: "手动备份",
            before_restore: "恢复前保护",
            device_override: "本机覆盖"
        }[source] || "历史备份";
    }

    function setStatus(message, kind) {
        if (!elements.status) return;
        elements.status.textContent = message;
        elements.status.dataset.kind = kind || "normal";
    }

    function setBusy(busy) {
        state.busy = busy;
        updateActionAvailability();
        renderHistory();
    }

    function updateActionAvailability() {
        var remoteUnavailable = !!state.session && !state.remoteReady;
        [elements.loginButton, elements.logoutButton].forEach(function(button) {
            if (button) button.disabled = state.busy;
        });
        [elements.backupButton, elements.restoreButton, elements.overrideButton,
            elements.conflictRestoreButton].forEach(function(button) {
            if (button) button.disabled = state.busy || remoteUnavailable;
        });
        if (elements.conflictRestoreButton && !state.latest) elements.conflictRestoreButton.disabled = true;
        if (elements.autoToggle) elements.autoToggle.disabled = state.busy || remoteUnavailable;
    }

    function render() {
        var signedIn = !!state.session;
        if (elements.loggedOut) elements.loggedOut.classList.toggle("hidden", signedIn);
        if (elements.loggedIn) elements.loggedIn.classList.toggle("hidden", !signedIn);
        if (elements.account) elements.account.textContent = signedIn ? state.session.user.email : "未登录";
        if (elements.triggerState) {
            elements.triggerState.textContent = signedIn ? state.remoteReady ? "已连接" : "检查中" : "未连接";
            elements.triggerState.dataset.online = signedIn && state.remoteReady ? "true" : "false";
        }
        if (elements.autoToggle) elements.autoToggle.checked = signedIn && isAutoEnabled();
        if (elements.lastBackup) {
            var latestTime = state.latest && (state.latest.server_updated_at || state.latest.client_updated_at);
            elements.lastBackup.textContent = formatTime(latestTime);
        }
        if (elements.conflict) elements.conflict.classList.toggle("hidden", !state.conflict);
        if (elements.conflictTitle && elements.conflictText) {
            if ("owner_mismatch" === state.conflictReason) {
                elements.conflictTitle.textContent = "本机数据属于另一个云账号";
                elements.conflictText.textContent = "为防止账号之间误传数据，自动上传已暂停。请恢复当前账号的云端备份，或明确使用本机数据覆盖。";
            } else if ("remote_changed" === state.conflictReason) {
                elements.conflictTitle.textContent = "云端备份已被其他设备更新";
                elements.conflictText.textContent = "当前本机版本与云端版本已经分叉，自动上传已暂停。请选择要保留的数据。";
            } else {
                elements.conflictTitle.textContent = "检测到已有云端备份";
                elements.conflictText.textContent = "这是此账号在当前浏览器首次连接。自动上传已暂停，请选择要保留的数据。";
            }
        }
        if (elements.regularActions) elements.regularActions.classList.toggle("hidden", state.conflict);
        updateActionAvailability();
        renderHistory();
    }

    function renderHistory() {
        if (!elements.history) return;
        elements.history.textContent = "";
        if (!state.session) {
            var signedOut = document.createElement("p");
            signedOut.className = "cloud-empty";
            signedOut.textContent = "登录后可查看历史备份";
            elements.history.appendChild(signedOut);
            return;
        }
        if (!state.history.length) {
            var empty = document.createElement("p");
            empty.className = "cloud-empty";
            empty.textContent = "还没有历史备份";
            elements.history.appendChild(empty);
            return;
        }
        state.history.forEach(function(item) {
            var row = document.createElement("div");
            row.className = "cloud-history-row";
            var copy = document.createElement("div");
            copy.className = "cloud-history-copy";
            var title = document.createElement("strong");
            title.textContent = sourceLabel(item.source);
            var time = document.createElement("span");
            time.textContent = formatTime(item.client_updated_at);
            copy.appendChild(title);
            copy.appendChild(time);
            var restore = document.createElement("button");
            restore.type = "button";
            restore.className = "secondary-btn cloud-history-restore";
            restore.textContent = "恢复";
            restore.disabled = state.busy;
            restore.addEventListener("click", function() { restoreSnapshot(item.id); });
            row.appendChild(copy);
            row.appendChild(restore);
            elements.history.appendChild(row);
        });
    }

    function injectUi() {
        var headerControls = document.querySelector("header .header-controls");
        if (!headerControls || document.getElementById("cloud-backup-btn")) return;
        var trigger = document.createElement("button");
        trigger.id = "cloud-backup-btn";
        trigger.type = "button";
        trigger.className = "secondary-btn cloud-trigger";
        trigger.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18h10a4 4 0 0 0 .7-7.94A6 6 0 0 0 6.26 8.3 4.5 4.5 0 0 0 7 18Z"/><path d="M12 11v5m0-5-2 2m2-2 2 2"/></svg><span>云备份</span><i id="cloud-trigger-state">未连接</i>';
        headerControls.appendChild(trigger);

        var modal = document.createElement("div");
        modal.id = "cloud-backup-modal";
        modal.className = "modal hidden cloud-backup-modal";
        modal.innerHTML = '<div class="modal-content cloud-panel" role="dialog" aria-modal="true" aria-labelledby="cloud-panel-title">'
            + '<div class="modal-header cloud-panel-header"><div><span class="cloud-kicker">ACCOUNT ARCHIVE</span><h2 id="cloud-panel-title">云端备份</h2></div><button type="button" id="cloud-close-btn" class="cloud-close" aria-label="关闭">&times;</button></div>'
            + '<div class="cloud-panel-body">'
            + '<div id="cloud-logged-out" class="cloud-auth"><p class="cloud-lead">使用管理员创建的邮箱和密码登录。数据仍先保存在本机。</p><label for="cloud-email">邮箱</label><input id="cloud-email" type="email" autocomplete="username" inputmode="email"><label for="cloud-password">密码</label><input id="cloud-password" type="password" autocomplete="current-password"><button type="button" id="cloud-login-btn" class="primary-btn">登录</button></div>'
            + '<div id="cloud-logged-in" class="hidden"><div class="cloud-account-line"><div><span>当前账号</span><strong id="cloud-account"></strong></div><button type="button" id="cloud-logout-btn" class="secondary-btn">退出</button></div>'
            + '<div id="cloud-conflict" class="cloud-conflict hidden"><strong id="cloud-conflict-title">检测到已有云端备份</strong><p id="cloud-conflict-text">这是此账号在当前浏览器首次连接。自动上传已暂停，请选择要保留的数据。</p><div class="cloud-conflict-actions"><button type="button" id="cloud-conflict-restore" class="primary-btn">恢复云端备份</button><button type="button" id="cloud-conflict-override" class="danger-btn">以本机数据覆盖</button></div></div>'
            + '<div id="cloud-regular-actions"><label class="cloud-toggle"><input id="cloud-auto-toggle" type="checkbox"><span>自动云端备份</span><small>本地数据变化 30 秒后上传</small></label><div class="cloud-metrics"><div><span>最新云端备份</span><strong id="cloud-last-backup">尚未备份</strong></div><div><span>保存方式</span><strong>本地优先</strong></div></div><div class="cloud-actions"><button type="button" id="cloud-backup-now" class="primary-btn">立即备份</button><button type="button" id="cloud-restore-latest" class="secondary-btn">恢复最新备份</button></div></div>'
            + '<div class="cloud-status" id="cloud-status" aria-live="polite">等待操作</div><div class="cloud-history"><div class="cloud-section-title"><span>历史备份</span><small>最多保留 20 份</small></div><div id="cloud-history-list"></div></div></div></div></div>';
        document.body.appendChild(modal);

        var style = document.createElement("style");
        style.textContent = '.cloud-trigger{display:inline-flex!important;align-items:center;gap:7px;white-space:nowrap}.cloud-trigger svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.cloud-trigger i{font-style:normal;font-size:10px;color:#82969d;border-left:1px solid #34505a;padding-left:7px}.cloud-trigger i[data-online="true"]{color:#78ddd7}.cloud-backup-modal{z-index:3100}.cloud-panel{width:min(92vw,620px)!important;max-width:620px!important;max-height:90vh;overflow:hidden;border:1px solid #31505b!important;background:#08151b!important}.cloud-panel-header{background:#0b1c23;border-bottom:1px solid #31505b!important}.cloud-panel-header h2{margin:2px 0 0!important}.cloud-kicker{font:700 10px/1 monospace;color:#58d5d0;letter-spacing:.14em}.cloud-close{width:38px;height:38px;border:1px solid #31505b;background:transparent;color:#b8c8cc;font-size:26px;cursor:pointer}.cloud-close:hover{color:#58d5d0;border-color:#58d5d0}.cloud-panel-body{padding:20px;overflow-y:auto;max-height:calc(90vh - 74px)}.cloud-lead{margin:0 0 18px;color:#9eb0b5;line-height:1.6}.cloud-auth{display:grid;grid-template-columns:1fr;gap:8px}.cloud-auth label{font-size:12px;color:#9eb0b5;margin-top:5px}.cloud-auth input{box-sizing:border-box;width:100%;height:42px;padding:8px 10px;color:#e6f1f0;border:1px solid #31505b;border-radius:0;background:#071218}.cloud-auth .primary-btn{margin-top:8px;height:42px}.cloud-account-line{display:flex;align-items:center;justify-content:space-between;gap:15px;padding-bottom:16px;border-bottom:1px solid #263d46}.cloud-account-line div{display:flex;flex-direction:column;min-width:0}.cloud-account-line span,.cloud-metrics span{font-size:11px;color:#82969d}.cloud-account-line strong{margin-top:4px;color:#edf8f7;overflow-wrap:anywhere}.cloud-toggle{display:grid;grid-template-columns:22px 1fr;column-gap:8px;align-items:center;margin:18px 0;padding:12px;border:1px solid #31505b;background:#0b1c23;cursor:pointer}.cloud-toggle input{grid-row:1/3;width:18px;height:18px;accent-color:#58d5d0}.cloud-toggle span{font-weight:700;color:#edf8f7}.cloud-toggle small{color:#82969d}.cloud-metrics{display:grid;grid-template-columns:1fr 1fr;border:1px solid #263d46}.cloud-metrics div{display:flex;flex-direction:column;gap:5px;padding:12px}.cloud-metrics div+div{border-left:1px solid #263d46}.cloud-metrics strong{font-size:13px;color:#c9d8da}.cloud-actions,.cloud-conflict-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.cloud-actions button,.cloud-conflict-actions button{min-height:40px}.cloud-conflict{margin:18px 0;padding:14px;border:1px solid rgba(255,152,0,.55);background:rgba(255,152,0,.08)}.cloud-conflict strong{color:#ffbd66}.cloud-conflict p{margin:7px 0 0;color:#c9d0d1;line-height:1.55;font-size:13px}.cloud-status{margin-top:14px;padding:9px 10px;border-left:3px solid #31505b;background:#0b1c23;color:#9eb0b5;font-size:12px}.cloud-status[data-kind="success"]{border-color:#58d5d0;color:#9be7e2}.cloud-status[data-kind="error"]{border-color:#ee6262;color:#ff9b9b}.cloud-status[data-kind="warning"]{border-color:#ff9800;color:#ffbd66}.cloud-history{margin-top:20px}.cloud-section-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;color:#edf8f7;font-weight:700}.cloud-section-title small{font-weight:400;color:#82969d}.cloud-history-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid #263d46}.cloud-history-copy{display:flex;flex-direction:column;gap:3px}.cloud-history-copy strong{font-size:13px;color:#c9d8da}.cloud-history-copy span,.cloud-empty{font-size:11px;color:#82969d}.cloud-history-restore{min-height:34px!important;padding:6px 12px!important}.cloud-empty{padding:15px 0;margin:0;text-align:center;border-top:1px solid #263d46}@media(max-width:620px){.cloud-panel-body{padding:15px}.cloud-actions,.cloud-conflict-actions{grid-template-columns:1fr}.cloud-metrics{grid-template-columns:1fr}.cloud-metrics div+div{border-left:0;border-top:1px solid #263d46}.cloud-trigger i{display:none}}';
        document.head.appendChild(style);

        elements.modal = modal;
        elements.loggedOut = document.getElementById("cloud-logged-out");
        elements.loggedIn = document.getElementById("cloud-logged-in");
        elements.email = document.getElementById("cloud-email");
        elements.password = document.getElementById("cloud-password");
        elements.loginButton = document.getElementById("cloud-login-btn");
        elements.logoutButton = document.getElementById("cloud-logout-btn");
        elements.account = document.getElementById("cloud-account");
        elements.autoToggle = document.getElementById("cloud-auto-toggle");
        elements.backupButton = document.getElementById("cloud-backup-now");
        elements.restoreButton = document.getElementById("cloud-restore-latest");
        elements.lastBackup = document.getElementById("cloud-last-backup");
        elements.status = document.getElementById("cloud-status");
        elements.history = document.getElementById("cloud-history-list");
        elements.conflict = document.getElementById("cloud-conflict");
        elements.conflictTitle = document.getElementById("cloud-conflict-title");
        elements.conflictText = document.getElementById("cloud-conflict-text");
        elements.regularActions = document.getElementById("cloud-regular-actions");
        elements.overrideButton = document.getElementById("cloud-conflict-override");
        elements.conflictRestoreButton = document.getElementById("cloud-conflict-restore");
        elements.triggerState = document.getElementById("cloud-trigger-state");

        trigger.addEventListener("click", function() { modal.classList.remove("hidden"); });
        document.getElementById("cloud-close-btn").addEventListener("click", closeModal);
        modal.addEventListener("click", function(event) { if (event.target === modal) closeModal(); });
        document.addEventListener("keydown", function(event) { if ("Escape" === event.key) closeModal(); });
        elements.loginButton.addEventListener("click", login);
        elements.password.addEventListener("keydown", function(event) { if ("Enter" === event.key) login(); });
        elements.logoutButton.addEventListener("click", logout);
        elements.autoToggle.addEventListener("change", toggleAutoBackup);
        elements.backupButton.addEventListener("click", function() { uploadBackup("manual", true); });
        elements.restoreButton.addEventListener("click", restoreLatest);
        document.getElementById("cloud-conflict-restore").addEventListener("click", restoreLatest);
        elements.overrideButton.addEventListener("click", overrideRemote);
    }

    function closeModal() {
        if (elements.modal) elements.modal.classList.add("hidden");
    }

    async function digestPayload(payload) {
        var canonical = JSON.parse(JSON.stringify(payload));
        delete canonical.exportedAt;
        var bytes = new TextEncoder().encode(JSON.stringify(canonical));
        var hash = await crypto.subtle.digest("SHA-256", bytes);
        return Array.from(new Uint8Array(hash)).map(function(byte) {
            return byte.toString(16).padStart(2, "0");
        }).join("");
    }

    function buildPayload() {
        if (!api || "function" !== typeof api.buildFullBackupPayload) {
            throw new Error("完整备份模块尚未加载");
        }
        return api.buildFullBackupPayload({ silent: true });
    }

    function setDirtyFlag(dirty) {
        state.dirty = dirty;
        if (dirty) localStorage.setItem(metaKey("dirty"), "1");
        else localStorage.removeItem(metaKey("dirty"));
    }

    async function getLocalBackupState() {
        var result = { payload: null, hash: null, revision: state.changeVersion, stable: true };
        for (var attempt = 0; attempt < 3; attempt++) {
            var revision = state.changeVersion;
            var payload = buildPayload();
            var hash = payload ? await digestPayload(payload) : null;
            result = { payload: payload, hash: hash, revision: revision, stable: revision === state.changeVersion };
            if (result.stable) return result;
        }
        return result;
    }

    async function fetchLatestBackup(userId) {
        var result = await client.from("backup_latest")
            .select("data,data_hash,source,client_updated_at,server_updated_at")
            .eq("user_id", userId || getUserId()).maybeSingle();
        if (result.error) throw result.error;
        return result.data || null;
    }

    function ensureSameSession(userId, sessionVersion) {
        if (!userId || userId !== getUserId()
            || ("number" === typeof sessionVersion && sessionVersion !== state.sessionVersion)) {
            throw new Error("登录账号已变化，本次操作已安全取消");
        }
    }

    function isCurrentSession(userId, sessionVersion) {
        return userId === getUserId() && sessionVersion === state.sessionVersion;
    }

    async function writeLatestAtomically(row, remoteLatest, source, userId, sessionVersion) {
        ensureSameSession(userId, sessionVersion);
        if ("device_override" === source) {
            var overrideResult = await client.from("backup_latest")
                .upsert(row, { onConflict: "user_id" });
            if (overrideResult.error) throw overrideResult.error;
            ensureSameSession(userId, sessionVersion);
            return true;
        }
        if (!remoteLatest) {
            var insertResult = await client.from("backup_latest").insert(row);
            if (insertResult.error) {
                if ("23505" === String(insertResult.error.code)) return false;
                throw insertResult.error;
            }
            ensureSameSession(userId, sessionVersion);
            return true;
        }
        var updateResult = await client.from("backup_latest").update(row)
            .eq("user_id", userId).eq("data_hash", remoteLatest.data_hash)
            .select("data_hash");
        if (updateResult.error) throw updateResult.error;
        ensureSameSession(userId, sessionVersion);
        return Array.isArray(updateResult.data) && 1 === updateResult.data.length;
    }

    function finishUploadRevision(userId, hash, revision) {
        if (userId !== getUserId()) return;
        localStorage.setItem(metaKey("baseline", userId), hash);
        localStorage.setItem(metaKey("owner"), userId);
        if (revision === state.changeVersion) setDirtyFlag(false);
        else {
            setDirtyFlag(true);
            if (isAutoEnabled() && !state.conflict) scheduleBackup(AUTO_BACKUP_DELAY_MS);
        }
    }

    async function login() {
        var email = elements.email.value.trim();
        var password = elements.password.value;
        if (!email || !password) {
            setStatus("请输入邮箱和密码", "warning");
            return;
        }
        setBusy(true);
        setStatus("正在登录...", "normal");
        try {
            var result = await client.auth.signInWithPassword({ email: email, password: password });
            if (result.error) throw result.error;
            elements.password.value = "";
            setStatus("登录成功，正在检查云端备份...", "success");
        } catch (error) {
            setStatus("登录失败：" + friendlyError(error), "error");
        } finally {
            setBusy(false);
        }
    }

    async function logout() {
        setBusy(true);
        try {
            var result = await client.auth.signOut();
            if (result.error) throw result.error;
            setStatus("已退出。当前本地数据仍保留在此浏览器中。", "success");
        } catch (error) {
            setStatus("退出失败：" + friendlyError(error), "error");
        } finally {
            setBusy(false);
        }
    }

    function friendlyError(error) {
        var message = error && error.message || "未知错误";
        if (/invalid login credentials/i.test(message)) return "邮箱或密码不正确";
        if (/email not confirmed/i.test(message)) return "该邮箱尚未确认，请联系管理员";
        if (/failed to fetch|network/i.test(message)) return "网络连接失败，请稍后重试";
        return message;
    }

    async function loadRemoteState() {
        if (!state.session || state.remoteLoading) return;
        var operationUserId = getUserId();
        var operationSessionVersion = state.sessionVersion;
        state.remoteLoading = true;
        state.remoteReady = false;
        render();
        setStatus("正在读取云端备份...", "normal");
        try {
            var latest = await fetchLatestBackup(operationUserId);
            ensureSameSession(operationUserId);
            if (!isCurrentSession(operationUserId, operationSessionVersion)) return;
            state.latest = latest;
            await loadHistory(operationUserId);
            ensureSameSession(operationUserId);
            if (!isCurrentSession(operationUserId, operationSessionVersion)) return;
            var baseline = localStorage.getItem(metaKey("baseline", operationUserId));
            var localState = await getLocalBackupState();
            if (!localState.stable) {
                setDirtyFlag(true);
                setStatus("本地数据仍在变化，将稍后重新检查。", "normal");
                state.remoteReady = true;
                if (isAutoEnabled()) scheduleBackup(AUTO_BACKUP_DELAY_MS);
                render();
                return;
            }
            var remoteHash = state.latest && state.latest.data_hash || null;
            var localOwner = localStorage.getItem(metaKey("owner"));
            state.remoteReady = true;
            state.remoteRetryDelay = 30000;
            clearTimeout(state.remoteRetryTimer);
            var ownerMismatch = !!localState.payload && !!localOwner && localOwner !== operationUserId;
            state.conflict = ownerMismatch || !!state.latest && (!baseline
                || baseline !== remoteHash && localState.hash !== remoteHash);
            state.conflictReason = ownerMismatch ? "owner_mismatch"
                : state.latest && baseline ? "remote_changed" : "first_connect";
            if (state.conflict) {
                setStatus("自动上传已暂停，请选择保留云端或本机数据。", "warning");
            } else if (state.latest && localState.hash === remoteHash) {
                localStorage.setItem(metaKey("baseline", operationUserId), remoteHash);
                localStorage.setItem(metaKey("owner"), operationUserId);
                setDirtyFlag(false);
                setStatus("本机数据与云端备份一致", "success");
            } else if (state.latest) {
                if (localState.hash && baseline === remoteHash) {
                    setDirtyFlag(true);
                    setStatus("检测到尚未上传的本地修改，将自动备份。", "normal");
                    if (isAutoEnabled()) scheduleBackup(1000);
                } else setStatus("云端备份已连接", "success");
            } else {
                setStatus("云端暂无备份，将在本地数据变化后自动创建。", "normal");
                if (localState.payload) {
                    setDirtyFlag(true);
                    if (isAutoEnabled()) scheduleBackup(1000);
                }
            }
            if (localStorage.getItem(metaKey("pending", operationUserId)) === "1") {
                localStorage.removeItem(metaKey("pending", operationUserId));
                markDirty("恢复后的合并数据");
            }
        } catch (error) {
            if (!isCurrentSession(operationUserId, operationSessionVersion)) return;
            state.remoteReady = false;
            setStatus("读取云端失败：" + friendlyError(error), "error");
            scheduleRemoteRetry();
        } finally {
            if (isCurrentSession(operationUserId, operationSessionVersion)) state.remoteLoading = false;
        }
        render();
    }

    async function loadHistory(userId) {
        userId = userId || getUserId();
        var result = await client.from("backup_snapshots")
            .select("id,data_hash,source,client_updated_at")
            .eq("user_id", userId).order("client_updated_at", { ascending: false }).limit(HISTORY_LIMIT);
        if (result.error) throw result.error;
        ensureSameSession(userId);
        state.history = result.data || [];
    }

    async function insertSnapshot(payload, hash, source, userId, sessionVersion) {
        userId = userId || getUserId();
        ensureSameSession(userId, sessionVersion);
        var result = await client.from("backup_snapshots").insert({
            user_id: userId,
            data: payload,
            data_hash: hash,
            source: source,
            client_updated_at: payload.exportedAt
        });
        if (result.error) throw result.error;
        ensureSameSession(userId, sessionVersion);
        localStorage.setItem(metaKey("snapshot_at", userId), String(Date.now()));
        await pruneHistory(userId, sessionVersion);
    }

    async function pruneHistory(userId, sessionVersion) {
        userId = userId || getUserId();
        for (var pass = 0; pass < 10; pass++) {
            ensureSameSession(userId, sessionVersion);
            var result = await client.from("backup_snapshots").select("id")
                .eq("user_id", userId).order("client_updated_at", { ascending: false }).range(HISTORY_LIMIT, HISTORY_LIMIT + 199);
            if (result.error) throw result.error;
            var ids = (result.data || []).map(function(row) { return row.id; });
            if (!ids.length) return;
            var deleteResult = await client.from("backup_snapshots").delete().in("id", ids);
            if (deleteResult.error) throw deleteResult.error;
            ensureSameSession(userId, sessionVersion);
            if (ids.length < 200) return;
        }
        throw new Error("历史备份数量异常，清理未能在安全上限内完成");
    }

    async function uploadBackup(source, forceSnapshot) {
        if (!state.session || state.busy) return;
        if (!state.remoteReady) {
            setStatus("尚未确认云端最新状态，已禁止上传并等待重试。", "warning");
            scheduleRemoteRetry();
            return;
        }
        if (state.conflict && "device_override" !== source) {
            setStatus("请先选择恢复云端备份或以本机数据覆盖", "warning");
            return;
        }
        setBusy(true);
        setStatus("正在上传云端备份...", "normal");
        var operationUserId = getUserId();
        var operationSessionVersion = state.sessionVersion;
        try {
            var localState = await getLocalBackupState();
            var payload = localState.payload;
            var hash = localState.hash;
            ensureSameSession(operationUserId, operationSessionVersion);
            if (!payload) {
                setStatus("当前没有角色数据，已跳过上传，云端备份不会被清空。", "warning");
                return;
            }
            if (!localState.stable) {
                setDirtyFlag(true);
                setStatus("本地数据仍在变化，本次上传已延后。", "normal");
                scheduleBackup(AUTO_BACKUP_DELAY_MS);
                return;
            }
            var remoteLatest = await fetchLatestBackup(operationUserId);
            ensureSameSession(operationUserId, operationSessionVersion);
            var baseline = localStorage.getItem(metaKey("baseline", operationUserId));
            if (remoteLatest && "device_override" !== source
                && (!baseline || remoteLatest.data_hash !== baseline)) {
                state.latest = remoteLatest;
                if (remoteLatest.data_hash === hash) {
                    finishUploadRevision(operationUserId, hash, localState.revision);
                    state.conflict = false;
                    if (!forceSnapshot) {
                        setStatus("本机数据与云端备份一致，无需重复上传。", "success");
                        return;
                    }
                } else {
                    state.conflict = true;
                    state.conflictReason = "remote_changed";
                    setStatus("云端备份已被其他设备更新，自动上传已暂停。", "warning");
                    return;
                }
            }
            if (!forceSnapshot && remoteLatest && remoteLatest.data_hash === hash) {
                state.latest = remoteLatest;
                finishUploadRevision(operationUserId, hash, localState.revision);
                setStatus("数据没有变化，无需重复上传。", "success");
                return;
            }
            var now = (new Date()).toISOString();
            var lastSnapshot = Number(localStorage.getItem(metaKey("snapshot_at", operationUserId)) || 0);
            var needsSnapshot = forceSnapshot || !lastSnapshot || Date.now() - lastSnapshot >= AUTO_SNAPSHOT_INTERVAL_MS;
            if (needsSnapshot) await insertSnapshot(payload, hash, source, operationUserId, operationSessionVersion);
            var latestRow = {
                user_id: operationUserId, data: payload, data_hash: hash, source: source,
                client_updated_at: payload.exportedAt, server_updated_at: now
            };
            var writeSucceeded = await writeLatestAtomically(latestRow, remoteLatest, source, operationUserId, operationSessionVersion);
            if (!writeSucceeded) {
                state.latest = await fetchLatestBackup(operationUserId);
                ensureSameSession(operationUserId, operationSessionVersion);
                state.conflict = true;
                state.conflictReason = state.latest ? "remote_changed" : "first_connect";
                setStatus("云端备份刚被其他设备更新，本次上传已安全取消。", "warning");
                return;
            }
            state.latest = {
                data: payload, data_hash: hash, source: source,
                client_updated_at: payload.exportedAt, server_updated_at: now
            };
            state.conflict = false;
            state.conflictReason = "";
            finishUploadRevision(operationUserId, hash, localState.revision);
            localStorage.setItem(metaKey("last_success", operationUserId), now);
            await loadHistory(operationUserId);
            ensureSameSession(operationUserId, operationSessionVersion);
            setStatus("云端备份成功：" + formatTime(now), "success");
        } catch (error) {
            if (!isCurrentSession(operationUserId, operationSessionVersion)) return;
            setDirtyFlag(true);
            state.remoteReady = false;
            setStatus("云端备份失败，本地数据不受影响：" + friendlyError(error), "error");
            scheduleRemoteRetry();
        } finally {
            if (isCurrentSession(operationUserId, operationSessionVersion)) {
                setBusy(false);
                render();
            }
        }
    }

    async function overrideRemote() {
        if (!hasLocalAccounts()) {
            setStatus("本机没有角色数据，不能覆盖已有云端备份。", "warning");
            return;
        }
        if (!confirm("这会用当前浏览器中的本地数据覆盖最新云端备份，并保留一份历史快照。确定继续吗？")) return;
        await uploadBackup("device_override", true);
    }

    function describePayload(payload) {
        var validated = api.validateFullBackup(payload);
        var equipCount = validated.accounts.reduce(function(total, account) { return total + account.equipData.length; }, 0);
        return validated.accounts.length + " 个角色、" + equipCount + " 件装备";
    }

    async function protectLocalBeforeRestore(userId, sessionVersion) {
        ensureSameSession(userId, sessionVersion);
        var payload = buildPayload();
        if (!payload) return;
        var hash = await digestPayload(payload);
        await insertSnapshot(payload, hash, "before_restore", userId, sessionVersion);
    }

    async function restorePayload(payload, remoteHash, userId, sessionVersion) {
        userId = userId || getUserId();
        sessionVersion = "number" === typeof sessionVersion ? sessionVersion : state.sessionVersion;
        var description;
        try {
            description = describePayload(payload);
            if (!remoteHash) throw new Error("云端备份缺少校验摘要");
            var actualHash = await digestPayload(payload);
            if (actualHash !== remoteHash) throw new Error("云端备份校验摘要不匹配");
            ensureSameSession(userId, sessionVersion);
        } catch (error) {
            setStatus("云端备份校验失败：" + friendlyError(error), "error");
            return;
        }
        if (!confirm("即将恢复包含 " + description + " 的云端备份。\n\n恢复会覆盖同名角色，并保留其他本地角色。确定继续吗？")) return;
        setBusy(true);
        setStatus("正在保存恢复前保护快照...", "normal");
        try {
            await protectLocalBeforeRestore(userId, sessionVersion);
            ensureSameSession(userId, sessionVersion);
            api.restoreFullBackup(payload, {
                skipConfirm: true,
                onRestored: function() {
                    ensureSameSession(userId, sessionVersion);
                    localStorage.setItem(metaKey("baseline", userId), remoteHash);
                    localStorage.setItem(metaKey("owner"), userId);
                    localStorage.setItem(metaKey("pending", userId), "1");
                }
            });
        } catch (error) {
            if (isCurrentSession(userId, sessionVersion)) {
                setStatus("恢复已安全取消：" + friendlyError(error), "error");
                setBusy(false);
            }
        }
    }

    async function restoreLatest() {
        if (!state.session || state.busy || !state.remoteReady) return;
        var userId = getUserId();
        var sessionVersion = state.sessionVersion;
        setBusy(true);
        setStatus("正在确认云端最新备份...", "normal");
        try {
            state.latest = await fetchLatestBackup(userId);
            ensureSameSession(userId, sessionVersion);
        } catch (error) {
            if (isCurrentSession(userId, sessionVersion)) {
                state.remoteReady = false;
                setStatus("读取最新备份失败，恢复已取消：" + friendlyError(error), "error");
                scheduleRemoteRetry();
                setBusy(false);
                render();
            }
            return;
        }
        if (!isCurrentSession(userId, sessionVersion)) return;
        setBusy(false);
        render();
        if (!state.latest || !state.latest.data) {
            setStatus("云端还没有可恢复的备份", "warning");
            return;
        }
        await restorePayload(state.latest.data, state.latest.data_hash, userId, sessionVersion);
    }

    async function restoreSnapshot(id) {
        if (!state.session || state.busy) return;
        var userId = getUserId();
        var sessionVersion = state.sessionVersion;
        setBusy(true);
        setStatus("正在读取历史备份...", "normal");
        try {
            var result = await client.from("backup_snapshots").select("data,data_hash")
                .eq("user_id", userId).eq("id", id).single();
            if (result.error) throw result.error;
            ensureSameSession(userId, sessionVersion);
            setBusy(false);
            await restorePayload(result.data.data, result.data.data_hash, userId, sessionVersion);
        } catch (error) {
            if (isCurrentSession(userId, sessionVersion)) {
                setBusy(false);
                setStatus("读取历史备份失败：" + friendlyError(error), "error");
            }
        }
        if (isCurrentSession(userId, sessionVersion)) render();
    }

    function toggleAutoBackup() {
        if (!state.session) return;
        localStorage.setItem(metaKey("auto", getUserId()), elements.autoToggle.checked ? "1" : "0");
        if (elements.autoToggle.checked) {
            setStatus("自动云端备份已开启", "success");
            if (state.dirty) scheduleBackup(1000);
        } else {
            clearTimeout(state.backupTimer);
            setStatus("自动云端备份已关闭，本地保存不受影响。", "normal");
        }
    }

    function markDirty(reason) {
        state.changeVersion++;
        setDirtyFlag(true);
        if (!state.session || !isAutoEnabled() || state.conflict) return;
        setStatus((reason || "本地数据已变化") + "，将在 30 秒后备份。", "normal");
        scheduleBackup(AUTO_BACKUP_DELAY_MS);
    }

    function scheduleBackup(delay) {
        clearTimeout(state.backupTimer);
        state.backupTimer = setTimeout(function() { uploadBackup("auto", false); }, delay);
    }

    function scheduleRemoteRetry() {
        if (!state.session) return;
        clearTimeout(state.remoteRetryTimer);
        var delay = state.remoteRetryDelay;
        state.remoteRetryDelay = Math.min(state.remoteRetryDelay * 2, 5 * 60 * 1000);
        state.remoteRetryTimer = setTimeout(loadRemoteState, delay);
    }

    function migrateRenamedAccountZhuanlv(previousValue, nextValue, originalSetItem) {
        try {
            var previous = JSON.parse(previousValue || "[]");
            var next = JSON.parse(nextValue || "[]");
            if (!Array.isArray(previous) || !Array.isArray(next) || previous.length !== next.length) return;
            var removed = previous.filter(function(name) { return !next.includes(name); });
            var added = next.filter(function(name) { return !previous.includes(name); });
            if (1 !== removed.length || 1 !== added.length) return;
            var oldKey = "zhuanlv_status_" + removed[0];
            var newKey = "zhuanlv_status_" + added[0];
            var value = localStorage.getItem(oldKey);
            if (null !== value && null === localStorage.getItem(newKey)) {
                originalSetItem.call(localStorage, newKey, value);
                Storage.prototype.removeItem.call(localStorage, oldKey);
            }
        } catch (error) {
            console.warn("迁移改名角色的转律状态失败：", error);
        }
    }

    function installStorageObserver() {
        var originalSetItem = Storage.prototype.setItem;
        var originalRemoveItem = Storage.prototype.removeItem;
        Storage.prototype.setItem = function(key, value) {
            var previousValue = this === localStorage ? this.getItem(key) : null;
            originalSetItem.call(this, key, value);
            if (this === localStorage && "game_account_list" === String(key)) {
                migrateRenamedAccountZhuanlv(previousValue, value, originalSetItem);
            }
            if (this === localStorage && isBackupDataKey(String(key))) markDirty("本地数据已变化");
        };
        Storage.prototype.removeItem = function(key) {
            originalRemoveItem.call(this, key);
            if (this === localStorage && isBackupDataKey(String(key))) markDirty("本地数据已变化");
        };
        window.addEventListener("storage", function(event) {
            if (event.storageArea !== localStorage) return;
            if (null === event.key || isBackupDataKey(String(event.key))) markDirty("其他标签页中的本地数据已变化");
        });
    }

    async function handleSession(session) {
        var previousUserId = getUserId();
        var nextUserId = session && session.user && session.user.id || "";
        if (previousUserId && previousUserId === nextUserId) {
            state.session = session;
            render();
            return;
        }
        clearTimeout(state.backupTimer);
        clearTimeout(state.remoteRetryTimer);
        state.sessionVersion++;
        state.session = session;
        state.latest = null;
        state.history = [];
        state.conflict = false;
        state.conflictReason = "";
        state.remoteReady = false;
        state.remoteLoading = false;
        state.busy = false;
        state.dirty = localStorage.getItem(metaKey("dirty")) === "1";
        render();
        if (session) await loadRemoteState();
    }

    async function init() {
        injectUi();
        installStorageObserver();
        if (!window.supabase || "function" !== typeof window.supabase.createClient) {
            setStatus("云备份组件加载失败，请刷新页面重试。", "error");
            return;
        }
        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
        });
        client.auth.onAuthStateChange(function(event, session) {
            if ("INITIAL_SESSION" === event) return;
            if ("TOKEN_REFRESHED" === event && getUserId() === (session && session.user && session.user.id || "")) {
                state.session = session;
                render();
                return;
            }
            setTimeout(function() { handleSession(session); }, 0);
        });
        var result = await client.auth.getSession();
        if (result.error) setStatus("读取登录状态失败：" + friendlyError(result.error), "error");
        else await handleSession(result.data.session);
        window.addEventListener("online", function() {
            if (state.session && !state.remoteReady) loadRemoteState();
            else if (state.dirty && state.session && isAutoEnabled() && !state.conflict) scheduleBackup(1000);
        });
        document.addEventListener("visibilitychange", function() {
            if (document.hidden || !state.session) return;
            if (!state.remoteReady) loadRemoteState();
            else if (state.dirty && isAutoEnabled() && !state.conflict) scheduleBackup(1000);
        });
    }

    if ("loading" === document.readyState) document.addEventListener("DOMContentLoaded", init);
    else init();
})();
