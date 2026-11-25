// Usage: node scripts/shot.mjs <url> <out.png|jpg> [width]
import puppeteer from 'puppeteer-core';
const [url, out, width = '1000'] = process.argv.slice(2);
const exe = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({executablePath: exe, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewport({width: Number(width), height: 900, deviceScaleFactor: 1});
await page.goto(url, {waitUntil: 'networkidle0', timeout: 120000});
await page.waitForFunction('window.__ready === true', {timeout: 120000});
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({path: out, fullPage: true, ...(out.endsWith('.jpg') ? {type: 'jpeg', quality: 82} : {})});
console.log(JSON.stringify({out, errors: errors.slice(0, 20), errorCount: errors.length}));
await browser.close();
