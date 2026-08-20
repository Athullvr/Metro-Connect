import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext({ geolocation: { latitude: 9.9676, longitude: 76.3206 }, permissions: ['geolocation'] });
const page = await context.newPage();
page.on('pageerror', (err) => console.log('PAGEERROR:', err.message));

await page.goto('http://localhost:5184/', { waitUntil: 'networkidle' });

await page.getByRole('button', { name: /Use my location/i }).click();
await page.waitForTimeout(1000);
const originValue = await page.locator('input[placeholder*="start station"]').inputValue();
console.log('Origin after geolocation:', originValue);
await page.screenshot({ path: '.tmp-1-geo.png' });

await page.fill('input[placeholder*="destination jetty"]', 'Fort Kochi');
await page.waitForTimeout(300);
const destOption = page.locator('button:has-text("Fort Kochi")').first();
if (await destOption.isVisible().catch(() => false)) await destOption.click();
await page.getByRole('button', { name: /Plan Commute Route/i }).click();
await page.waitForSelector('text=Transit Copilot Reasoning', { timeout: 10000 });

await page.getByRole('button', { name: /Back to Search/i }).click();
await page.waitForTimeout(300);
const bodyText = await page.textContent('body');
console.log('Shows Recent Trips section:', bodyText.includes('Recent Trips'));
console.log('Shows the just-planned trip:', bodyText.includes('Vyttila') && bodyText.includes('Fort Kochi'));
await page.screenshot({ path: '.tmp-2-recent-trips.png' });

await browser.close();
