import assert from 'node:assert/strict';
import fs from 'node:fs';
const base = process.env.YYSLS_CLOUD_TEST_URL;
if (!base || !new URL(base).hostname.match(/^(127\.0\.0\.1|localhost)$/)) throw new Error('YYSLS_CLOUD_TEST_URL must point to an isolated localhost blank page');
const source = fs.readFileSync(new URL('../../static/tools/yysls-tiaolv/assets/js/cloud-backup.js', import.meta.url), 'utf8');
for (const scenario of ['empty', 'network', 'credentials', 'missing-sdk']) {
  const tab = await fetch('http://127.0.0.1:9222/json/new?' + encodeURIComponent(base), { method: 'PUT' }).then(r => r.json());
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id) { pending.get(m.id)?.(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise(r => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => {
    const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (response.result.exceptionDetails) throw new Error(JSON.stringify(response.result.exceptionDetails));
    return response.result.result.value;
  };
  try {
    for (let i = 0; i < 100; i++) {
      if (await evaluate('document.readyState === "complete" && location.hostname === "127.0.0.1"')) break;
      await new Promise(r => setTimeout(r, 50));
    }
    const result = await evaluate(`(async () => {
      document.body.innerHTML = '<style>.hidden{display:none!important}</style><header><div class="header-controls"></div></header>';
      const scenario = ${JSON.stringify(scenario)};
      let calls = 0;
      window.supabase = scenario === 'missing-sdk' ? undefined : { createClient() { return { auth: {
        onAuthStateChange() {}, getSession: async () => ({ data: { session: null } }),
        signInWithPassword: async () => { calls++; return { error: { message: scenario === 'network' ? 'Failed to fetch' : 'Invalid login credentials' } }; }
      } }; } };
      (0, eval)(${JSON.stringify(source)});
      await new Promise(r => setTimeout(r, 0));
      document.getElementById('cloud-backup-btn').click();
      if (scenario !== 'empty') {
        document.getElementById('cloud-email').value = 'isolated@example.invalid';
        document.getElementById('cloud-password').value = 'mock-only';
      }
      document.getElementById('cloud-login-btn').click();
      await new Promise(r => setTimeout(r, 0));
      const status = document.getElementById('cloud-status');
      return { text: status.textContent, visible: status.checkVisibility(), calls, disabled: document.getElementById('cloud-login-btn').disabled };
    })()`);
    const expected = { empty: '请输入邮箱和密码', network: '登录失败：网络连接失败，请稍后重试', credentials: '登录失败：邮箱或密码不正确', 'missing-sdk': 'Supabase 云备份组件加载失败，请刷新页面重试。' };
    assert.equal(result.text, expected[scenario]);
    assert.equal(result.visible, true, scenario + ': login feedback must be visible before authentication');
    assert.equal(result.calls, ['network', 'credentials'].includes(scenario) ? 1 : 0);
    assert.equal(result.disabled, scenario === 'missing-sdk');
    console.log(scenario + ': visible feedback passed');
  } finally {
    await send('Page.close'); ws.close();
  }
}
