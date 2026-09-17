const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const test = require("node:test");

const toolRoot = path.resolve(__dirname, "../static/tools/yysls-tiaolv");

function probePanelHeader(width, height) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "tiaolv-panel-header-"));
    const page = path.join(directory, "panel-header.html");
    const source = fs.readFileSync(path.join(toolRoot, "index.html"), "utf8");
    const start = source.indexOf('<aside id="simulator-panel"');
    const end = source.indexOf("</aside>", start) + "</aside>".length;
    assert.ok(start >= 0 && end > start, "index.html must contain the simulator panel markup");
    const absolutize = value => /^(?:[a-z]+:|\/)/i.test(value) ? value : pathToFileURL(path.join(toolRoot, value)).href;
    const aside = source.slice(start, end)
        .replace(' class="hidden"', "")
        .replace(/(src|href)="([^"]*)"/g, (match, attribute, value) => `${attribute}="${absolutize(value)}"`);
    const stylesheet = relativePath => pathToFileURL(path.join(toolRoot, relativePath)).href;

    fs.writeFileSync(page, `<!doctype html>
<link rel="stylesheet" href="${stylesheet("assets/css/style.css")}">
<link rel="stylesheet" href="${stylesheet("assets/css/ui-codex-command-classic.css")}">
<body class="ui-codex-command-classic">
${aside}
<script>
  const panel = document.getElementById("simulator-panel");
  const header = panel.querySelector(".sim-header");
  header.querySelector("h2").click();
  panel.dataset.probe = JSON.stringify({
    cursor: getComputedStyle(header).cursor,
    expandedAfterClick: panel.classList.contains("expanded")
  });
</script>
</body>`);

    try {
        const output = execFileSync("google-chrome-stable", [
            "--headless=new",
            "--no-sandbox",
            "--disable-gpu",
            `--window-size=${width},${height}`,
            "--virtual-time-budget=2000",
            "--dump-dom",
            pathToFileURL(page).href
        ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
        const match = output.match(/data-probe="([^"]*)"/);
        assert.ok(match, "panel probe must be present in the rendered DOM");
        return JSON.parse(match[1].replace(/&quot;/g, '"'));
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
}

test("clicking the panel heading neither shows a hand cursor nor toggles the panel", () => {
    for (const [width, height] of [[1440, 900], [500, 800]]) {
        const probe = probePanelHeader(width, height);
        assert.notEqual(probe.cursor, "pointer", `panel header must not look clickable at ${width}px`);
        assert.equal(probe.expandedAfterClick, false, `panel must stay untouched after clicking the heading at ${width}px`);
    }
});
