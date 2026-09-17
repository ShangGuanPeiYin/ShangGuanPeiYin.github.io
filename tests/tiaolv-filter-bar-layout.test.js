const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const test = require("node:test");

const toolRoot = path.resolve(__dirname, "../static/tools/yysls-tiaolv");

test("keeps the add-equipment button in the filter bar row after the recycle bin is added", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "tiaolv-filter-bar-"));
    const page = path.join(directory, "filter-bar.html");
    const stylesheet = relativePath => pathToFileURL(path.join(toolRoot, relativePath)).href;

    fs.writeFileSync(page, `<!doctype html>
<link rel="stylesheet" href="${stylesheet("assets/css/style.css")}">
<link rel="stylesheet" href="${stylesheet("assets/css/ui-codex-command-classic.css")}">
<body class="ui-codex-command-classic">
  <div id="filter-bar">
    <div id="filter-container">筛选</div>
    <div id="filter-toggle-group"><button>词条</button></div>
    <button id="flow-filter-btn">大小外</button>
    <select id="sort-select"><option>录入顺序</option></select>
    <button id="recycle-bin-btn">回收站</button>
    <button id="add-btn" class="primary-btn">录入装备</button>
  </div>
  <script>
    const filterBar = document.getElementById("filter-bar");
    const addButton = document.getElementById("add-btn");
    const center = element => {
      const rect = element.getBoundingClientRect();
      return rect.top + rect.height / 2;
    };
    filterBar.dataset.addRow = Math.abs(center(addButton) - center(filterBar.firstElementChild)) < 2 ? "first" : "later";
  </script>
</body>`);

    try {
        const output = execFileSync("google-chrome-stable", [
            "--headless=new",
            "--no-sandbox",
            "--disable-gpu",
            "--window-size=1440,900",
            "--dump-dom",
            pathToFileURL(page).href
        ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

        assert.match(output, /data-add-row="first"/);
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});
