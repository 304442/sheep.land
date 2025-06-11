const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔍 Testing Alpine initialization...\n');

  // Inject test code before page loads
  await page.addInitScript(() => {
    window.alpineInitFired = false;
    window.alpineDataRegistered = false;
    
    document.addEventListener('alpine:init', () => {
      window.alpineInitFired = true;
      console.log('alpine:init event fired!');
    });
    
    // Also check when Alpine.data is called
    if (typeof Alpine !== 'undefined') {
      const originalData = Alpine.data;
      Alpine.data = function(name, component) {
        console.log(`Alpine.data called with: ${name}`);
        window.alpineDataRegistered = true;
        return originalData.call(this, name, component);
      };
    }
  });

  await page.goto('https://sheep.land', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const status = await page.evaluate(() => {
    return {
      alpineInitFired: window.alpineInitFired,
      alpineDataRegistered: window.alpineDataRegistered,
      alpineVersion: typeof Alpine !== 'undefined' ? Alpine.version : null,
      alpineStarted: typeof Alpine !== 'undefined' ? Alpine.started : null,
      hasAlpineData: typeof Alpine !== 'undefined' && typeof Alpine.data === 'function'
    };
  });

  console.log('Alpine initialization status:');
  console.log(JSON.stringify(status, null, 2));

  // Try to manually fire alpine:init
  console.log('\nManually dispatching alpine:init event...');
  const manualResult = await page.evaluate(() => {
    document.dispatchEvent(new CustomEvent('alpine:init'));
    return window.alpineInitFired;
  });
  console.log('Manual dispatch result:', manualResult);

  // Check if app.js content is correct
  const appJsCheck = await page.evaluate(async () => {
    const response = await fetch('/app.js');
    const text = await response.text();
    return {
      hasAlpineInit: text.includes("document.addEventListener('alpine:init'"),
      hasAlpineData: text.includes("Alpine.data('sheepLand'"),
      firstLines: text.substring(0, 200)
    };
  });

  console.log('\napp.js content check:');
  console.log('Has alpine:init listener:', appJsCheck.hasAlpineInit);
  console.log('Has Alpine.data call:', appJsCheck.hasAlpineData);

  await browser.close();
})();