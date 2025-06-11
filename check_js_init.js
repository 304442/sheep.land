const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture page errors
  const errors = [];
  page.on('pageerror', err => {
    errors.push(err.toString());
  });

  console.log('🔍 Checking JS initialization...\n');

  await page.goto('https://sheep.land', { waitUntil: 'domcontentloaded' });
  
  // Check if Alpine is available
  const alpineCheck = await page.evaluate(() => {
    return {
      hasAlpine: typeof Alpine !== 'undefined',
      hasAppData: typeof appData !== 'undefined',
      bodyAttributes: {
        'x-data': document.body.getAttribute('x-data'),
        'x-init': document.body.getAttribute('x-init'),
        'x-cloak': document.body.hasAttribute('x-cloak')
      }
    };
  });

  console.log('Initial checks:');
  console.log(JSON.stringify(alpineCheck, null, 2));

  // Wait for Alpine to potentially initialize
  await page.waitForTimeout(2000);

  // Try to manually initialize Alpine
  const manualInit = await page.evaluate(() => {
    try {
      // Check if Alpine.data is registered
      if (typeof Alpine !== 'undefined' && Alpine.data) {
        const registered = Alpine.data('sheepLand');
        return {
          alpineDataRegistered: typeof registered === 'function',
          message: 'Alpine.data checked'
        };
      }
      return { message: 'Alpine not available' };
    } catch (e) {
      return { error: e.toString() };
    }
  });

  console.log('\nManual check:');
  console.log(JSON.stringify(manualInit, null, 2));

  // Check if the component is initialized
  const componentStatus = await page.evaluate(() => {
    const body = document.body;
    return {
      hasXData: !!(body && body.__x),
      hasDataStack: !!(body && body._x_dataStack),
      dataStackContent: body && body._x_dataStack ? body._x_dataStack : null
    };
  });

  console.log('\nComponent status:');
  console.log(JSON.stringify(componentStatus, null, 2));

  if (errors.length > 0) {
    console.log('\nPage errors:');
    errors.forEach(err => console.log(err));
  } else {
    console.log('\nNo page errors detected');
  }

  // Try calling Alpine.start() manually
  const startResult = await page.evaluate(() => {
    try {
      if (typeof Alpine !== 'undefined' && typeof Alpine.start === 'function') {
        Alpine.start();
        return 'Alpine.start() called';
      }
      return 'Alpine.start not available';
    } catch (e) {
      return `Error: ${e.toString()}`;
    }
  });

  console.log('\nAlpine.start() result:', startResult);

  // Wait and check again
  await page.waitForTimeout(1000);

  const finalCheck = await page.evaluate(() => {
    const body = document.body;
    return {
      hasXData: !!(body && body.__x),
      xDataKeys: body && body.__x && body.__x.$data ? Object.keys(body.__x.$data).slice(0, 5) : [],
      loadState: body && body.__x && body.__x.$data ? body.__x.$data.load : null
    };
  });

  console.log('\nFinal check:');
  console.log(JSON.stringify(finalCheck, null, 2));

  await browser.close();
})();