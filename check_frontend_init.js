const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  console.log('🔍 Checking frontend initialization...\n');

  await page.goto('https://sheep.land', { waitUntil: 'domcontentloaded' });
  
  // Wait a bit for Alpine to initialize
  await page.waitForTimeout(3000);

  // Check Alpine initialization
  const alpineStatus = await page.evaluate(() => {
    const app = document.querySelector('[x-data]');
    return {
      hasApp: !!app,
      hasAlpine: !!window.Alpine,
      hasAlpineData: !!(app && app.__x),
      alpineDataKeys: app && app.__x && app.__x.$data ? Object.keys(app.__x.$data).slice(0, 10) : [],
      loadingStates: app && app.__x && app.__x.$data ? {
        general: app.__x.$data.load.general,
        prods: app.__x.$data.load.prods
      } : null
    };
  });

  console.log('Alpine.js Status:');
  console.log(JSON.stringify(alpineStatus, null, 2));

  // Check if init() was called
  const initStatus = await page.evaluate(() => {
    const app = document.querySelector('[x-data]');
    if (app && app.__x && app.__x.$data) {
      return {
        prodOptsKeys: Object.keys(app.__x.$data.prodOpts),
        settingsKeys: Object.keys(app.__x.$data.settings),
        hasProducts: Object.values(app.__x.$data.prodOpts).some(cat => cat && cat.length > 0)
      };
    }
    return null;
  });

  console.log('\nInitialization Status:');
  console.log(JSON.stringify(initStatus, null, 2));

  // Show relevant console logs
  console.log('\nConsole logs:');
  logs.forEach(log => {
    if (log.type === 'error' || log.text.includes('error') || log.text.includes('Error')) {
      console.log(`${log.type.toUpperCase()}: ${log.text}`);
    }
  });

  // Try calling init manually
  console.log('\nTrying to call init() manually...');
  const manualInit = await page.evaluate(async () => {
    const app = document.querySelector('[x-data]');
    if (app && app.__x && app.__x.$data && app.__x.$data.init) {
      await app.__x.$data.init();
      return 'Init called successfully';
    }
    return 'Could not call init';
  });
  console.log(manualInit);

  await page.waitForTimeout(2000);

  // Check again after manual init
  const afterInit = await page.evaluate(() => {
    const app = document.querySelector('[x-data]');
    if (app && app.__x && app.__x.$data) {
      const meatCuts = app.__x.$data.prodOpts.meat_cuts;
      return {
        hasMeatCuts: !!meatCuts,
        meatCutsCount: meatCuts ? meatCuts.length : 0,
        firstProduct: meatCuts && meatCuts[0] && meatCuts[0].wps && meatCuts[0].wps[0] ? {
          item_key: meatCuts[0].wps[0].item_key,
          priceEGP: meatCuts[0].wps[0].priceEGP
        } : null
      };
    }
    return null;
  });

  console.log('\nAfter manual init:');
  console.log(JSON.stringify(afterInit, null, 2));

  await browser.close();
})();