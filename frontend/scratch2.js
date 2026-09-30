import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(`LOG: ${msg.text()}`));
  page.on('pageerror', error => logs.push(`ERROR: ${error.message}`));
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  fs.writeFileSync('browser_logs.txt', logs.join('\n'));
  await browser.close();
})();
