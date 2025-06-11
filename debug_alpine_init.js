const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture all console messages
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  console.log('🔍 Debugging Alpine initialization...\n');

  await page.goto('https://sheep.land', { waitUntil: 'domcontentloaded' });
  
  // Check Alpine before initialization
  const beforeInit = await page.evaluate(() => {
    return {
      hasAlpine: typeof Alpine !== 'undefined',
      alpineVersion: typeof Alpine !== 'undefined' ? Alpine.version : null,
      bodyXData: document.body.getAttribute('x-data'),
      bodyXInit: document.body.getAttribute('x-init')
    };
  });

  console.log('Before Alpine starts:');
  console.log(JSON.stringify(beforeInit, null, 2));

  // Wait for Alpine to initialize
  await page.waitForTimeout(3000);

  // Check Alpine after initialization
  const afterInit = await page.evaluate(() => {
    const body = document.body;
    return {
      hasAlpineData: !!(body && body._x_dataStack),
      alpineComponentName: body && body._x_dataStack ? body._x_dataStack[0] : null,
      hasXData: !!(body && body.__x),
      xDataKeys: body && body.__x && body.__x.$data ? Object.keys(body.__x.$data).slice(0, 5) : []
    };
  });

  console.log('\nAfter Alpine initialization:');
  console.log('Has Alpine data:', afterInit.hasAlpineData);
  console.log('Alpine component name:', afterInit.alpineComponentName);
  console.log('Has x-data:', afterInit.hasXData);
  console.log('X-data keys:', afterInit.xDataKeys);

  // Try to access the component
  const componentCheck = await page.evaluate(() => {
    try {
      const body = document.body;
      if (body && body.__x && body.__x.$data) {
        const data = body.__x.$data;
        return {
          hasInitApp: typeof data.initApp === 'function',
          hasSettings: !!data.settings,
          hasProdOpts: !!data.prodOpts,
          loadingState: data.load
        };
      }
      return { error: 'No Alpine data found' };
    } catch (e) {
      return { error: e.toString() };
    }
  });

  console.log('\nComponent check:');
  console.log(JSON.stringify(componentCheck, null, 2));

  // Show console logs
  const relevantLogs = consoleLogs.filter(log => 
    log.type === 'error' || 
    log.text.toLowerCase().includes('error') ||
    log.text.toLowerCase().includes('alpine') ||
    log.text.toLowerCase().includes('init')
  );

  if (relevantLogs.length > 0) {
    console.log('\nRelevant console logs:');
    relevantLogs.forEach(log => {
      console.log(`${log.type}: ${log.text}`);
      if (log.location.url) {
        console.log(`  at ${log.location.url}:${log.location.lineNumber}`);
      }
    });
  }

  // Try to manually trigger initApp
  console.log('\nTrying to manually trigger initApp...');
  const manualInit = await page.evaluate(async () => {
    try {
      const body = document.body;
      if (body && body.__x && body.__x.$data && typeof body.__x.$data.initApp === 'function') {
        await body.__x.$data.initApp();
        return 'initApp called successfully';
      }
      return 'Could not find initApp function';
    } catch (e) {
      return `Error calling initApp: ${e.toString()}`;
    }
  });
  console.log(manualInit);

  await browser.close();
})();