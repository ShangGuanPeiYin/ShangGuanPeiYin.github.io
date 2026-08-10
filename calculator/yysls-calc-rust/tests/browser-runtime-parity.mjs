const baseUrl = process.env.YYSLS_BROWSER_URL;
if (!baseUrl) throw new Error("YYSLS_BROWSER_URL is required");

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
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
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
  return { socket, send };
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

const client = await openPage(`${baseUrl}/`);
try {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (await evaluate(client, "Boolean(window.YYSLSExcelRuntime)")) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!await evaluate(client, "Boolean(window.YYSLSExcelRuntime)")) {
    throw new Error("YYSLSExcelRuntime did not load");
  }
  const result = await evaluate(client, `(async () => {
    await window.YYSLSExcelRuntime.ready;
    const runtime = window.YYSLSExcelRuntime;
    const flowNames = Object.keys(window.YYSLS_CALC_METADATA.flowIds);
    const summaries = [];
    for (const className of flowNames) {
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
      const context = runtime.createBestBuildContext(base);
      const equip = runtime.compileBestBuildEquip("weapon1", {
        slotId: 1,
        isPurple: true,
        mainStat: { type: "最小外功攻击", value: 121.4 },
        subStats: [{ type: "精准率", value: 12.4 }]
      });
      const best = runtime.calculateBestBuildCompiled(context, [equip]);
      const exported = runtime.exportClassInputData(base);
      if (!normal || !manual || !best || !exported) throw new Error("runtime path returned null: " + className);
      summaries.push([className, normal.dps, manual.dps, best.dps, exported.values.length]);
    }
    return { summaries };
  })()`);
  console.log(JSON.stringify({ status: "ok", engine: "rust", flows: result.summaries.length }));
} finally {
  client.socket.close();
}
