import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = path.join(__dirname, 'temporary screenshots');
const url = 'http://localhost:3000';
const label = process.argv[2] || 'snap2';

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox']
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

await page.evaluate(async () => {
  const total = document.documentElement.scrollHeight;
  const step = window.innerHeight * 0.7;
  for (let y = 0; y <= total; y += step) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 100));
  }
});

const targets = [
  { name: 'facility-genesee', sel: '.facility-block.reverse' },
  { name: 'cta-photo', sel: '#cta' },
  { name: 'coach', sel: '.cta-coach' }
];
for (const t of targets) {
  const y = await page.evaluate(sel => {
    const el = document.querySelector(sel);
    return el ? el.getBoundingClientRect().top + window.scrollY - 50 : 0;
  }, t.sel);
  await page.evaluate(y => window.scrollTo(0, y), y);
  await new Promise(r => setTimeout(r, 1500));
  const out = path.join(SHOT_DIR, `${label}-${t.name}.png`);
  await page.screenshot({ path: out, fullPage: false });
  console.log('Saved:', out);
}
await browser.close();
