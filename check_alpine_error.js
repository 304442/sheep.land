const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture ALL console messages
  const logs = [];
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  // Capture page errors
  const errors = [];
  page.on('pageerror', err => {
    errors.push(err.toString());
  });

  console.log('🔍 Checking Alpine initialization errors...\n');

  await page.goto('https://sheep.land', { waitUntil: 'domcontentloaded' });
  
  // Wait for potential initialization
  await page.waitForTimeout(3000);

  // Check if Alpine is registered
  const alpineCheck = await page.evaluate(() => {
    return {
      hasAlpine: typeof Alpine !== 'undefined',
      alpineVersion: typeof Alpine !== 'undefined' ? Alpine.version : null,
      hasBody: !!document.body,
      bodyXData: document.body?.getAttribute('x-data'),
      bodyXInit: document.body?.getAttribute('x-init'),
      alpineStarted: typeof Alpine !== 'undefined' && Alpine.started !== undefined ? Alpine.started : 'unknown'
    };
  });

  console.log('Alpine Status:');
  console.log(JSON.stringify(alpineCheck, null, 2));

  // Try to manually check Alpine data
  const dataCheck = await page.evaluate(() => {
    if (typeof Alpine === 'undefined') return { error: 'Alpine not defined' };
    
    try {
      // Check if sheepLand is registered
      const data = Alpine.data('sheepLand');
      return {
        dataRegistered: typeof data === 'function',
        alpineStores: Object.keys(Alpine.store || {}),
        alpineComponents: Object.keys(Alpine._data || {})
      };
    } catch (e) {
      return { error: e.toString() };
    }
  });

  console.log('\nAlpine Data Check:');
  console.log(JSON.stringify(dataCheck, null, 2));

  // Show all console logs
  console.log('\nConsole Logs:');
  if (logs.length === 0) {
    console.log('No console logs captured');
  } else {
    logs.forEach(log => {
      if (log.type === 'error' || log.text.includes('error') || log.text.includes('Error')) {
        console.log(`${log.type.toUpperCase()}: ${log.text}`);
        if (log.location.url) {
          console.log(`  at ${log.location.url}:${log.location.lineNumber}`);
        }
      }
    });
  }

  // Show page errors
  if (errors.length > 0) {
    console.log('\nPage Errors:');
    errors.forEach(err => console.log(err));
  }

  // Check if initApp function exists
  const initCheck = await page.evaluate(() => {
    const body = document.body;
    if (body && body.__x && body.__x.$data) {
      return {
        hasInitApp: typeof body.__x.$data.initApp === 'function',
        hasInit: typeof body.__x.$data.init === 'function',
        dataKeys: Object.keys(body.__x.$data).filter(k => typeof body.__x.$data[k] === 'function').slice(0, 10)
      };
    }
    return { hasXData: false };
  });

  console.log('\nInit Function Check:');
  console.log(JSON.stringify(initCheck, null, 2));

  // Try to call initApp manually
  const manualInit = await page.evaluate(async () => {
    try {
      // Method 1: Through Alpine component
      const body = document.body;
      if (body && body.__x && body.__x.$data && typeof body.__x.$data.initApp === 'function') {
        await body.__x.$data.initApp();
        return { success: true, method: 'Through __x.$data' };
      }
      
      // Method 2: Direct Alpine.data call
      if (typeof Alpine !== 'undefined' && Alpine.data) {
        const component = Alpine.data('sheepLand');
        if (component) {
          const instance = component();
          if (instance && typeof instance.initApp === 'function') {
            await instance.initApp();
            return { success: true, method: 'Through Alpine.data' };
          }
        }
      }
      
      return { success: false, reason: 'No initialization method found' };
    } catch (e) {
      return { success: false, error: e.toString() };
    }
  });

  console.log('\nManual Init Result:');
  console.log(JSON.stringify(manualInit, null, 2));

  // Final check after manual init
  await page.waitForTimeout(2000);
  
  const finalCheck = await page.evaluate(() => {
    const body = document.body;
    if (body && body.__x && body.__x.$data) {
      const data = body.__x.$data;
      let productCount = 0;
      Object.keys(data.prodOpts).forEach(cat => {
        if (Array.isArray(data.prodOpts[cat])) {
          productCount += data.prodOpts[cat].length;
        }
      });
      return {
        hasData: true,
        productCategories: Object.keys(data.prodOpts),
        totalProductGroups: productCount,
        loadingStates: data.load
      };
    }
    return { hasData: false };
  });

  console.log('\nFinal State:');
  console.log(JSON.stringify(finalCheck, null, 2));

  await browser.close();
})();