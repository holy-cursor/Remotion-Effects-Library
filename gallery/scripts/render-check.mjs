// Render check + contact sheets. Requires the dev server (npm run dev) on :4198.
// Usage: node scripts/render-check.mjs [outDir]
// Writes after-<theme>-<n>.jpg and render-check.json into outDir (default ../review/redesign-2026-11-24/after).
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const out = path.resolve(process.argv[2] ?? "../review/redesign-2026-11-24/after");
fs.mkdirSync(out, { recursive: true });
const exe = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ["--no-sandbox", "--disable-crash-reporter", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const report = { at: new Date().toISOString(), sheets: [], errors: [], consoleErrors: [] };
const manifest = await (await fetch('http://127.0.0.1:4198/components.json')).json();
const pages = Array.from({length: Math.ceil(manifest.effects.length / 25)}, (_,i) => i);
for (const theme of ["light", "dark"]) {
  for (const pg of pages) {
    const page = await browser.newPage();
    page.on("pageerror", (e) => report.consoleErrors.push({ theme, pg, msg: String(e) }));
    page.on("console", (m) => m.type() === "error" && report.consoleErrors.push({ theme, pg, msg: m.text() }));
    await page.setViewport({ width: 1010, height: 900, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:4198/check.html?theme=${theme}&page=${pg}`, { waitUntil: "networkidle0", timeout: 120000 });
    await page.waitForFunction("window.__ready === true", { timeout: 120000 });
    const errs = await page.evaluate("window.__fxCheck");
    report.errors.push(...errs);
    const file = path.join(out, `after-${theme}-${pg + 1}.jpg`);
    await page.screenshot({ path: file, fullPage: true, type: "jpeg", quality: 82 });
    report.sheets.push(file);
    await page.close();
  }
}
await browser.close();
fs.writeFileSync(path.join(out, "render-check.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ sheets: report.sheets.length, renderErrors: report.errors.length, consoleErrors: report.consoleErrors.length }));
process.exit(report.errors.length ? 1 : 0);
