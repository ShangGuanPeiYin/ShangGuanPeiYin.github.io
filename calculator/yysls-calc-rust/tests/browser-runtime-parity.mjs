const baseUrl = process.env.YYSLS_BROWSER_URL;
if (!baseUrl) throw new Error("YYSLS_BROWSER_URL is required");
const expectedEngine = process.env.YYSLS_ENGINE || "assistant";

async function openPage(url) {
  const target = await fetch(`http://127.0.0.1:9222/json/new?${encodeURIComponent(url)}`, {
    method: "PUT",
  }).then(response => response.json());
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  const exceptions = [];
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const messageId = ++id;
    pending.set(messageId, { resolve, reject });
    socket.send(JSON.stringify({ id: messageId, method, params }));
  });
  await send("Runtime.enable");
  return { socket, send, exceptions };
}

async function evaluate(client, expression) {
  const response = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
  return response.result.value;
}

const client = await openPage(`${baseUrl}/?test=${Date.now()}`);
try {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if ((await evaluate(client, "location.href")).startsWith(baseUrl)) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  await evaluate(client, `(() => {
    const expected = ${JSON.stringify(expectedEngine)};
    if (localStorage.getItem("yysls_calculator_engine") !== expected) {
      localStorage.setItem("yysls_calculator_engine", expected);
      location.reload();
      return true;
    }
    return false;
  })()`);
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (await evaluate(client, `window.YYSLS_ACTIVE_ENGINE === ${JSON.stringify(expectedEngine)} && Boolean(window.YYSLSExcelRuntime)`)) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!await evaluate(client, "Boolean(window.YYSLSExcelRuntime)")) {
    throw new Error("YYSLSExcelRuntime did not load");
  }
  client.exceptions.length = 0;
  const result = await evaluate(client, `(async () => {
    await window.YYSLSExcelRuntime.ready;
    const editId = document.getElementById("edit-id");
    const slotSelect = document.getElementById("slot-select");
    const levelSelect = document.getElementById("level-select");
    const transmutableCheck = document.getElementById("is-transmutable");
    if (!editId || !slotSelect || !levelSelect || !transmutableCheck) throw new Error("equipment form is incomplete");
    document.getElementById("modal").classList.remove("hidden");
    await new Promise(resolve => setTimeout(resolve, 0));
    editId.value = "";
    slotSelect.value = "1";
    slotSelect.dispatchEvent(new Event("change", { bubbles: true }));
    levelSelect.value = "110";
    levelSelect.dispatchEvent(new Event("change", { bubbles: true }));
    transmutableCheck.checked = true;
    transmutableCheck.dispatchEvent(new Event("change", { bubbles: true }));
    const subStatSelect = document.querySelector("#sub-stats-container .sub-stat-select");
    if (!subStatSelect) throw new Error("equipment sub-stat select is missing");
    subStatSelect.value = "最大外功攻击";
    subStatSelect.dispatchEvent(new Event("change", { bubbles: true }));
    const transmutationRadio = document.querySelector('.zhuanlv-slot-radio[data-index="0"]');
    if (!transmutationRadio) throw new Error("transmutation slot selector is missing");
    transmutationRadio.checked = true;
    transmutationRadio.dispatchEvent(new Event("change", { bubbles: true }));
    const transmutationTargets = Array.from(document.querySelectorAll("#zhuanlv-target-checkboxes .zhuanlv-target-name"), node => node.textContent.trim());
    const invalidWeaponTargets = ["最大鸣金攻击", "最大裂石攻击", "最大牵丝攻击", "最大破竹攻击"].filter(stat => transmutationTargets.includes(stat));
    if (invalidWeaponTargets.length || !transmutationTargets.includes("最大无相攻击")) {
      throw new Error("new weapon has invalid transmutation targets: " + JSON.stringify({ transmutationTargets, slotId: slotSelect.value }));
    }
    const runtime = window.YYSLSExcelRuntime;
    const initiallyLoaded = runtime.loadedExcelFlows();
    const flowNames = Object.keys(window.YYSLS_CALC_METADATA.flowIds);
    if (!Calculator || typeof Calculator.ensureExcel !== "function") throw new Error("Calculator.ensureExcel is missing");
    const firstFlow = flowNames[0];
    await Calculator.ensureExcel(firstFlow);
    const firstBase = { className: firstFlow, equippedItems: {}, xinfa: [], modifiers: [] };
    const firstBest = typeof runtime.createBestBuildContext === "function"
      ? runtime.calculateBestBuildCompiled(runtime.createBestBuildContext(firstBase), [])
      : runtime.calculate(firstBase);
    const firstExport = runtime.exportClassInputData(firstBase);
    if (!firstBest || !firstExport || firstExport.values.length !== 40) throw new Error("first-use Excel path returned null");
    if (window.YYSLS_ACTIVE_ENGINE === "q7") {
      const scored = GradModal.calculateBuildRate({}, firstFlow, "precision", "", [], false);
      const directScore = runtime.calculate({ className: firstFlow, equippedItems: {}, bow: "precision", xinfa: [], setName: "", armory: AppState.currentArmory, earlySeasonBonus: AppState.earlySeasonBonus || false, loanDingyin: false, loanDingyinValue: normalizeLoanDingyinValue(AppState.loanDingyinValue), classInputOverrides: getCurrentClassInputOverrides(firstFlow), flowVersion: getCurrentFlowVersionKey(firstFlow), flowName: getFlowNameForClass(firstFlow) });
      if (!scored || !directScore || scored.rate !== directScore.graduationRate || scored.dps !== directScore.dps) throw new Error("Q7 best-build score differs from direct Q7 runtime");
      const template = await fetch("excels/q7/" + encodeURIComponent(firstExport.workbookName));
      if (!template.ok) throw new Error("Q7 workbook template is unavailable: " + firstExport.workbookName);
    }
    const summaries = [];
    for (const className of flowNames) {
      await runtime.ensureExcel(className);
      const base = { className, equippedItems: {}, xinfa: [], modifiers: [] };
      const normal = runtime.calculate(base);
      const manual = runtime.calculate({
        ...base,
        modifiers: [
          { type: "精准率", value: 100 },
          { type: "会心率", value: 80 },
          { type: "会意率", value: 40 },
          { type: "最小外功攻击", value: 121.4 }
        ]
      });
      const best = typeof runtime.createBestBuildContext === "function" ? runtime.calculateBestBuildCompiled(
        runtime.createBestBuildContext(base),
        [runtime.compileBestBuildEquip("weapon1", { slotId: 1, isPurple: true, mainStat: { type: "最小外功攻击", value: 121.4 }, subStats: [{ type: "精准率", value: 12.4 }] })]
      ) : runtime.calculate({ ...base, equippedItems: { weapon1: { slotId: 1, isPurple: true, mainStat: { type: "最小外功攻击", value: 121.4 }, subStats: [{ type: "精准率", value: 12.4 }] } } });
      const exported = runtime.exportClassInputData(base);
      if (!normal || !manual || !best || !exported) throw new Error("runtime path returned null: " + className);
      summaries.push([className, normal.dps, manual.dps, best.dps, exported.values.length]);
    }
    const mainClasses = Array.from(document.getElementById("class-select").options, option => option.value);
    const availableClasses = ClassConfig.AVAILABLE_CLASSES.slice();
    return { engine: window.YYSLS_ACTIVE_ENGINE, seasonResistance: CommonData.SEASON_STATS["赛季抗性"], compiled: typeof runtime.calculateBestBuildCompiled === "function", summaries, mainClasses, availableClasses, initiallyLoaded, loadedFlows: runtime.loadedExcelFlows(), firstFlow, firstBestRate: firstBest.graduationRate, resources: performance.getEntriesByType("resource").map(entry => entry.name) };
  })()`);
  if (expectedEngine === "assistant" && result.initiallyLoaded.length !== 0) {
    throw new Error(`Excel modules loaded before demand: ${JSON.stringify(result.initiallyLoaded)}`);
  }
  const expectedFlowCount = expectedEngine === "q7" ? 13 : 11;
  if (result.loadedFlows.length !== expectedFlowCount) {
    throw new Error(`unexpected flow count ${result.loadedFlows.length} (engine=${result.engine})`);
  }
  const expectedMainClasses = expectedEngine === "q7" ? 11 : 11;
  const expectedAvailableClasses = expectedEngine === "q7" ? 12 : 12;
  if (result.mainClasses.includes("pvp") || result.mainClasses.includes("裂石钧（纯唐）") || result.mainClasses.length !== expectedMainClasses) {
    throw new Error(`unexpected main classes: ${JSON.stringify(result.mainClasses)}`);
  }
  if (!result.availableClasses.includes("pvp") || result.availableClasses.length !== expectedAvailableClasses) {
    throw new Error(`unexpected equipment available classes: ${JSON.stringify(result.availableClasses)}`);
  }
  if (result.engine !== expectedEngine || result.compiled !== (expectedEngine === "assistant")) throw new Error(`engine isolation failed: ${JSON.stringify(result)}`);
  if (result.seasonResistance !== 2.45) throw new Error(`unexpected season resistance: ${result.seasonResistance}`);
  const loadedQ7 = result.resources.some(url => url.includes("/assets/wasm/q7/") || url.includes("/assets/engines/q7/"));
  const loadedAssistantWasm = result.resources.some(url => url.includes("/assets/wasm/yysls_panel.wasm") || url.includes("/assets/wasm/excel/"));
  if (expectedEngine === "q7" ? (!loadedQ7 || loadedAssistantWasm) : (loadedQ7 || !loadedAssistantWasm)) throw new Error(`cross-engine resource load: ${JSON.stringify(result.resources)}`);
  await new Promise(resolve => setTimeout(resolve, 100));
  if (client.exceptions.length) throw new Error(`browser exceptions: ${JSON.stringify(client.exceptions)}`);
  console.log(JSON.stringify({ status: "ok", engine: result.engine, compiledBestBuild: result.compiled, flows: result.summaries.length, firstUse: result.firstFlow, firstBestRate: result.firstBestRate }));
} finally {
  client.socket.close();
}
