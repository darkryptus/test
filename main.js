const express = require('express');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const CHROME_PATH = '/data/data/com.termux/files/usr/bin/chromium-browser';
const SCREENSHOT_PATH = path.join(__dirname, 'screenshot.png');

const sleep = ms => new Promise(r => setTimeout(r, ms));

app.get('/', async (req, res) => {
  res.send(`
    <h2>Aternos Screenshot</h2>
    <p><a href="/run">Run bot & refresh screenshot</a></p>
    <img src="/screenshot?t=${Date.now()}" style="max-width:100%;border:1px solid #ccc;" />
  `);
});

app.get('/screenshot', (req, res) => {
  if (!fs.existsSync(SCREENSHOT_PATH)) {
    return res.status(404).send('Screenshot not generated yet');
  }
  res.sendFile(SCREENSHOT_PATH);
});

app.get('/run', async (req, res) => {
  res.send('Bot started. Refresh the main page in ~15 seconds.');

  console.log('[BOT] Launching browser...');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME_PATH,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ],
    defaultViewport: null
  });

  const page = await browser.newPage();

  // ---- LOAD COOKIES ----
  if (!fs.existsSync('cookies.json')) {
    console.error('[BOT] cookies.json missing');
    await browser.close();
    return;
  }

  const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
  await page.setCookie(...cookies);

  console.log('[BOT] Opening Aternos sign-in...');
  await page.goto('https://aternos.org/go/', { waitUntil: 'networkidle2' });

  console.log('[BOT] Waiting 10 seconds for login to settle...');
  await sleep(10000);

  console.log('[BOT] Taking screenshot...');
  await page.screenshot({
    path: SCREENSHOT_PATH,
    fullPage: true
  });

  console.log('[BOT] Screenshot saved');

  await browser.close();
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
