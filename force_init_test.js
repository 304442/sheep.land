const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console output
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  console.log('🔍 Testing forced initialization...\n');

  await page.goto('https://sheep.land', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Check initial state
  const initialState = await page.evaluate(() => {
    const body = document.body;
    return {
      hasAlpine: typeof Alpine !== 'undefined',
      bodyHasXData: body && body.__x ? 'Yes' : 'No',
      alpineStarted: typeof Alpine !== 'undefined' && Alpine.started
    };
  });

  console.log('Initial state:', initialState);

  // Try different initialization methods
  console.log('\n1. Trying Alpine.start()...');
  const startResult = await page.evaluate(() => {
    try {
      if (typeof Alpine !== 'undefined' && !Alpine.started) {
        Alpine.start();
        return 'Alpine.start() called';
      }
      return 'Alpine already started or not available';
    } catch (e) {
      return `Error: ${e.message}`;
    }
  });
  console.log(startResult);

  await page.waitForTimeout(1000);

  // Check if component is registered
  console.log('\n2. Checking component registration...');
  const componentCheck = await page.evaluate(() => {
    try {
      if (typeof Alpine === 'undefined') return 'Alpine not defined';
      
      // Try to get the component definition
      const componentDef = Alpine._data && Alpine._data.sheepLand;
      if (componentDef) {
        return 'Component found in Alpine._data';
      }
      
      // Try Alpine.data
      const dataFn = Alpine.data('sheepLand');
      if (dataFn) {
        return 'Component found via Alpine.data()';
      }
      
      return 'Component not found';
    } catch (e) {
      return `Error: ${e.message}`;
    }
  });
  console.log(componentCheck);

  // Try to re-evaluate the app.js script
  console.log('\n3. Re-evaluating app.js...');
  const scriptResult = await page.evaluate(async () => {
    try {
      const response = await fetch('/app.js');
      const scriptText = await response.text();
      
      // Check if Alpine.data is in the script
      if (!scriptText.includes("Alpine.data('sheepLand'")) {
        return 'Alpine.data not found in script';
      }
      
      // Try to execute just the Alpine.data registration
      const match = scriptText.match(/Alpine\.data\('sheepLand', \(\) => \(\{[\s\S]*?\}\)\);/);
      if (match) {
        eval(match[0]);
        return 'Alpine.data registration re-executed';
      }
      
      return 'Could not extract Alpine.data registration';
    } catch (e) {
      return `Error: ${e.message}`;
    }
  });
  console.log(scriptResult);

  // Final check
  console.log('\n4. Final state check...');
  const finalState = await page.evaluate(() => {
    const body = document.body;
    if (body && body.__x && body.__x.$data) {
      return {
        hasXData: true,
        hasInitApp: typeof body.__x.$data.initApp === 'function',
        loadState: body.__x.$data.load,
        prodOptsKeys: Object.keys(body.__x.$data.prodOpts || {})
      };
    }
    return { hasXData: false };
  });
  console.log('Final state:', JSON.stringify(finalState, null, 2));

  // If we have the component, try calling initApp
  if (finalState.hasXData && finalState.hasInitApp) {
    console.log('\n5. Calling initApp()...');
    const initResult = await page.evaluate(async () => {
      try {
        const body = document.body;
        await body.__x.$data.initApp();
        return 'initApp() called successfully';
      } catch (e) {
        return `Error: ${e.message}`;
      }
    });
    console.log(initResult);
    
    // Check products after init
    await page.waitForTimeout(2000);
    const productsCheck = await page.evaluate(() => {
      const body = document.body;
      if (body && body.__x && body.__x.$data) {
        const data = body.__x.$data;
        let totalProducts = 0;
        Object.keys(data.prodOpts).forEach(cat => {
          if (Array.isArray(data.prodOpts[cat])) {
            data.prodOpts[cat].forEach(group => {
              if (group.wps) totalProducts += group.wps.length;
            });
          }
        });
        return { totalProducts };
      }
      return { totalProducts: 0 };
    });
    console.log(`\nProducts loaded: ${productsCheck.totalProducts}`);
  }

  await browser.close();
})();