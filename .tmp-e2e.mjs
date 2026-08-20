import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', (msg) => console.log('BROWSER:', msg.text()));
page.on('pageerror', (err) => console.log('PAGEERROR:', err.message));

await page.goto('http://localhost:5183/', { waitUntil: 'networkidle' });
await page.screenshot({ path: '.tmp-1-home.png' });

await page.fill('input[placeholder*="start station"]', 'Aluva');
await page.waitForTimeout(300);
await page.getByText('Aluva', { exact: true }).first().click().catch(() => {});
await page.fill('input[placeholder*="destination jetty"]', 'Fort Kochi');
await page.waitForTimeout(300);

// Click a matching destination suggestion if the dropdown is open
const destOption = page.locator('button:has-text("Fort Kochi")').first();
if (await destOption.isVisible().catch(() => false)) {
  await destOption.click();
}

await page.screenshot({ path: '.tmp-2-filled.png' });

await page.getByRole('button', { name: /Plan Commute Route/i }).click();
await page.waitForTimeout(2000); // simulator artificial latency
await page.waitForSelector('text=Transit Copilot Reasoning', { timeout: 10000 });
await page.screenshot({ path: '.tmp-3-itinerary.png' });

await page.getByRole('button', { name: /Simulate CommCommute Disruption/i }).click();
await page.waitForSelector('text=Disruption Control Center', { timeout: 10000 });
await page.screenshot({ path: '.tmp-4-disruption-screen.png' });

// Wait for the live feed to finish loading
await page.waitForSelector('text=Checking live network conditions...', { state: 'detached', timeout: 5000 }).catch(() => {});
await page.screenshot({ path: '.tmp-5-feed-loaded.png' });

const presetButtons = page.locator('.clean-card.border-red-200 button');
const count = await presetButtons.count();
console.log('Preset count:', count);
if (count > 0) {
  await presetButtons.first().click();
  await page.waitForTimeout(2500); // replan simulator latency
  await page.screenshot({ path: '.tmp-6-rerouted.png' });
  const bodyText = await page.textContent('body');
  console.log('Contains "Copilot Rerouted":', bodyText.includes('Copilot Rerouted'));
  console.log('Contains "No alternative route found":', bodyText.includes('No alternative route found'));
}

await browser.close();
