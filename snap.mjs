import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = path.join(__dirname, 'temporary screenshots');
fs.mkdirSync(SHOT_DIR, { recursive: true });
const url = 'http://localhost:3000';
const label = process.argv[2] || 'snap';

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox']
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

// Scroll through to trigger reveals
await page.evaluate(async () => {
  const total = document.documentElement.scrollHeight;
  const step = window.innerHeight * 0.7;
  for (let y = 0; y <= total; y += step) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 100));
  }
});

const total = await page.evaluate(() => document.documentElement.scrollHeight);
console.log('Total height:', total);

// Snap 5 sections by scrolling to each
const sections = ['races-photos', 'team-hero', 'julia', 'elizabeth', 'academics-pillars', 'campus-wide'];
const selectors = ['.race-photo-strip', '.team-hero', '.athlete-card', '.athlete-card.reverse', '.pillars-grid', '.campus-wide'];
const positions = [];
for (const s of selectors) {
  const y = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? el.getBoundingClientRect().top + window.scrollY - 60 : 0;
  }, s);
  positions.push(y);
}

for (let i = 0; i < sections.length; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), positions[i]);
  await new Promise(r => setTimeout(r, 1500));
  const out = path.join(SHOT_DIR, `${label}-${sections[i]}.png`);
  await page.screenshot({ path: out, fullPage: false });
  console.log('Saved:', out);
}

await browser.close();
