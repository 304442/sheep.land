const { test, expect } = require('@playwright/test');

test('Quick sheep.land test', async ({ page }) => {
  console.log('Starting test...');
  
  // Navigate to the site
  const response = await page.goto('https://sheep.land', { 
    waitUntil: 'domcontentloaded',
    timeout: 30000 
  });
  
  console.log('Response status:', response?.status());
  
  // Take a screenshot
  await page.screenshot({ path: 'screenshots/quick-test.png' });
  
  // Check if page loaded
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check for any element
  const body = await page.$('body');
  expect(body).not.toBeNull();
  
  console.log('Test completed!');
});