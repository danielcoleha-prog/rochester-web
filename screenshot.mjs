import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = path.join(__dirname, 'temporary screenshots');
fs.mkdirSync(SHOT_DIR, { recursive: true });

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const viewportOnly = process.argv.includes('--viewport');

const existing = fs.readdirSync(SHOT_DIR).filter(f => /^screenshot-(\d+)/.test(f));
const nextN = existing.reduce((m, f) => Math.max(m, parseInt(f.match(/screenshot-(\d+)/)[1], 10)), 0) + 1;
const outName = label ? `screenshot-${nextN}-${label}.png` : `screenshot-${nextN}.png`;
const outPath = path.join(SHOT_DIR, outName);

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox']
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

// Scroll through the page to fire IntersectionObserver / GSAP ScrollTrigger reveals,
// then return to top.
await page.evaluate(async () => {
  const total = document.documentElement.scrollHeight;
  const step = window.innerHeight * 0.8;
  for (let y = 0; y < total; y += step) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 120));
  }
  window.scrollTo(0, total);
  await new Promise(r => setTimeout(r, 300));
  window.scrollTo(0, 0);
});
await new Promise(r => setTimeout(r, 800));

await page.screenshot({ path: outPath, fullPage: !viewportOnly });
await browser.close();
console.log('Saved:', outPath);
