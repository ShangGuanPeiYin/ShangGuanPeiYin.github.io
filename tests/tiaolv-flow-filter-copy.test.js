const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const test = require("node:test");

const toolRoot = path.resolve(__dirname, "../static/tools/yysls-tiaolv");
const toolPageUrl = pathToFileURL(path.join(toolRoot, "index.html")).href;

function dumpToolPage(userDataDir) {
    const output = execFileSync("google-chrome-stable", [
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--window-size=1440,900",
        "--user-data-dir=" + userDataDir,
        "--virtual-time-budget=8000",
        "--dump-dom",
        toolPageUrl
    ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 120000 });

    const match = output.match(/<button[^>]*filter-toggle-btn[^>]*>([^<]*)</);
    assert.ok(match, "the flow filter toggle should be rendered on the tool page");
    return { text: match[1].trim(), dom: output };
}

function renderWithClassFilter(classFilter) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "tiaolv-flow-filter-copy-"));
    const userDataDir = path.join(directory, "profile");
    fs.mkdirSync(userDataDir);

    try {
        if (classFilter !== null) {
            const seedPage = path.join(directory, "seed.html");
            fs.writeFileSync(seedPage, `<!doctype html><body><script>
                localStorage.setItem("tiaolv_class_filter", ${JSON.stringify(classFilter)});
                localStorage.setItem("tiaolv_flow_filter", "");
            </script></body>`);
            execFileSync("google-chrome-stable", [
                "--headless=new",
                "--no-sandbox",
                "--disable-gpu",
                "--user-data-dir=" + userDataDir,
                "--virtual-time-budget=2000",
                "--dump-dom",
                pathToFileURL(seedPage).href
            ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 120000 });
        }

        return dumpToolPage(userDataDir);
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
}

test("labels the enabled flow filter as 当前流派", () => {
    const rendered = renderWithClassFilter(null);

    assert.equal(rendered.text, "当前流派");
});

test("labels the disabled flow filter as 全流派 after persisting tiaolv_class_filter=0", () => {
    const rendered = renderWithClassFilter("0");

    assert.equal(rendered.text, "全流派");
});
