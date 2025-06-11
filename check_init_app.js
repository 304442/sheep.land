const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Intercept console logs
  page.on('console', msg => {
    if (msg.text().includes('init') || msg.text().includes('error')) {
      console.log(`Console: ${msg.text()}`);
    }
  });

  console.log('🔍 Checking initApp execution...\n');

  await page.goto('https://sheep.land', { waitUntil: 'networkidle' });
  
  // Check x-init attribute
  const initCheck = await page.evaluate(() => {
    const body = document.body;
    return {
      xInit: body.getAttribute('x-init'),
      hasXData: !!body.__x,
      alpineVersion: typeof Alpine !== 'undefined' ? Alpine.version : null
    };
  });

  console.log('Body attributes:');
  console.log(`x-init: ${initCheck.xInit}`);
  console.log(`Has Alpine binding: ${initCheck.hasXData}`);
  console.log(`Alpine version: ${initCheck.alpineVersion}`);

  // Try to manually call initApp
  console.log('\nTrying to manually call initApp()...');
  const manualInit = await page.evaluate(async () => {
    try {
      const body = document.body;
      if (body && body.__x && body.__x.$data && typeof body.__x.$data.initApp === 'function') {
        console.log('Calling initApp manually...');
        await body.__x.$data.initApp();
        return { success: true, message: 'initApp called' };
      } else {
        // Check what's available
        return {
          success: false,
          hasBody: !!body,
          hasX: !!(body && body.__x),
          hasData: !!(body && body.__x && body.__x.$data),
          hasInitApp: !!(body && body.__x && body.__x.$data && body.__x.$data.initApp),
          dataKeys: body && body.__x && body.__x.$data ? Object.keys(body.__x.$data).slice(0, 10) : []
        };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  console.log('Manual init result:', JSON.stringify(manualInit, null, 2));

  // If initApp exists, check products after calling it
  if (manualInit.success) {
    await page.waitForTimeout(2000);
    
    const afterInit = await page.evaluate(() => {
      const body = document.body;
      if (body && body.__x && body.__x.$data) {
        const data = body.__x.$data;
        let productCount = 0;
        let productsWithDiscounts = 0;
        
        Object.keys(data.prodOpts).forEach(cat => {
          if (Array.isArray(data.prodOpts[cat])) {
            data.prodOpts[cat].forEach(group => {
              if (group.wps) {
                group.wps.forEach(p => {
                  productCount++;
                  if (p.discount_percentage > 0) productsWithDiscounts++;
                });
              }
            });
          }
        });
        
        return {
          loadState: data.load,
          productCount,
          productsWithDiscounts
        };
      }
      return null;
    });
    
    console.log('\nAfter manual init:');
    console.log(JSON.stringify(afterInit, null, 2));
  }

  await browser.close();
})();