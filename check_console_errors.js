const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const logs = [];
  const errors = [];

  // Capture ALL console messages
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    logs.push({ type, text, args: msg.args() });
    
    if (type === 'error') {
      console.log(`CONSOLE ERROR: ${text}`);
    }
  });

  // Capture page errors
  page.on('pageerror', err => {
    errors.push(err.toString());
    console.log(`PAGE ERROR: ${err}`);
  });

  // Capture response errors
  page.on('response', response => {
    if (!response.ok() && response.url().includes('.js')) {
      console.log(`FAILED TO LOAD: ${response.url()} - ${response.status()}`);
    }
  });

  console.log('🔍 Monitoring console for errors...\n');

  await page.goto('https://sheep.land', { waitUntil: 'networkidle' });
  
  console.log('\nWaiting for initialization...');
  await page.waitForTimeout(3000);

  // Check if there are any Alpine-specific errors
  const alpineErrors = logs.filter(log => 
    log.text.toLowerCase().includes('alpine') || 
    log.text.toLowerCase().includes('x-data') ||
    log.text.toLowerCase().includes('x-init')
  );

  if (alpineErrors.length > 0) {
    console.log('\nAlpine-related messages:');
    alpineErrors.forEach(log => {
      console.log(`${log.type}: ${log.text}`);
    });
  }

  // Try to get more details about initialization
  const initDetails = await page.evaluate(() => {
    // Override console.error temporarily to catch errors
    const originalError = console.error;
    const capturedErrors = [];
    
    console.error = function(...args) {
      capturedErrors.push(args.join(' '));
      originalError.apply(console, args);
    };
    
    try {
      // Check if Alpine is trying to initialize
      if (typeof Alpine !== 'undefined') {
        // Try to get the sheepLand component
        const body = document.body;
        const xData = body.getAttribute('x-data');
        const xInit = body.getAttribute('x-init');
        
        // Try to evaluate x-init
        if (xInit && body.__x && body.__x.$data) {
          try {
            eval(`body.__x.$data.${xInit}`);
          } catch (e) {
            capturedErrors.push(`x-init error: ${e.message}`);
          }
        }
      }
    } catch (e) {
      capturedErrors.push(`General error: ${e.message}`);
    }
    
    console.error = originalError;
    
    return {
      capturedErrors,
      alpineVersion: typeof Alpine !== 'undefined' ? Alpine.version : null,
      hasBodyX: !!(document.body && document.body.__x)
    };
  });

  console.log('\nInitialization details:');
  console.log(JSON.stringify(initDetails, null, 2));

  // Check network tab for failed resources
  const failedResources = await page.evaluate(() => {
    return performance.getEntriesByType('resource')
      .filter(entry => entry.responseStatus >= 400)
      .map(entry => ({
        name: entry.name,
        status: entry.responseStatus
      }));
  });

  if (failedResources.length > 0) {
    console.log('\nFailed resources:');
    failedResources.forEach(resource => {
      console.log(`${resource.name} - ${resource.status}`);
    });
  }

  await page.screenshot({ path: 'console_check.png' });
  console.log('\n📸 Screenshot saved as console_check.png');

  await browser.close();
})();