const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console messages
  const logs = [];
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  console.log('🔍 Checking initialization errors...\n');

  await page.goto('https://sheep.land', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Check Alpine initialization
  const alpineStatus = await page.evaluate(() => {
    const body = document.body;
    if (body && body.__x && body.__x.$data) {
      return {
        initialized: true,
        loadingStates: body.__x.$data.load,
        hasProducts: Object.keys(body.__x.$data.prodOpts).some(key => 
          body.__x.$data.prodOpts[key] && body.__x.$data.prodOpts[key].length > 0
        ),
        setupRequired: body.__x.$data.setupRequired,
        apiError: body.__x.$data.apiErr
      };
    }
    return { initialized: false };
  });

  console.log('Alpine Status:');
  console.log(JSON.stringify(alpineStatus, null, 2));

  // Show relevant console logs
  console.log('\nConsole logs:');
  const relevantLogs = logs.filter(log => 
    log.type === 'error' || 
    log.text.includes('error') || 
    log.text.includes('Error') ||
    log.text.includes('discount') ||
    log.text.includes('undefined')
  );
  
  if (relevantLogs.length > 0) {
    relevantLogs.forEach(log => {
      console.log(`${log.type.toUpperCase()}: ${log.text}`);
    });
  } else {
    console.log('No error logs found');
  }

  // Check what's in prodOpts
  const prodData = await page.evaluate(() => {
    const body = document.body;
    if (body && body.__x && body.__x.$data && body.__x.$data.prodOpts) {
      const prodOpts = body.__x.$data.prodOpts;
      const result = {};
      Object.keys(prodOpts).forEach(key => {
        result[key] = {
          count: prodOpts[key] ? prodOpts[key].length : 0,
          firstItem: prodOpts[key] && prodOpts[key][0] ? {
            name: prodOpts[key][0].name,
            hasProducts: !!(prodOpts[key][0].wps),
            productCount: prodOpts[key][0].wps ? prodOpts[key][0].wps.length : 0
          } : null
        };
      });
      return result;
    }
    return null;
  });

  console.log('\nProduct Options Data:');
  console.log(JSON.stringify(prodData, null, 2));

  await browser.close();
})();