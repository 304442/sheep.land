const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔍 Checking Alpine component state...\n');

  await page.goto('https://sheep.land', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Get Alpine component state
  const alpineState = await page.evaluate(() => {
    const body = document.body;
    
    // Method 1: Check body.__x
    if (body.__x && body.__x.$data) {
      const data = body.__x.$data;
      return {
        method: 'body.__x',
        hasData: true,
        currentPage: data.currentPage,
        loadingStates: data.load,
        prodOptsKeys: Object.keys(data.prodOpts || {}),
        prodOptsCounts: {}
      };
    }
    
    // Method 2: Try Alpine.$data
    if (typeof Alpine !== 'undefined' && Alpine.$data) {
      try {
        const data = Alpine.$data(body);
        return {
          method: 'Alpine.$data',
          hasData: true,
          currentPage: data.currentPage,
          loadingStates: data.load,
          prodOptsKeys: Object.keys(data.prodOpts || {})
        };
      } catch (e) {}
    }
    
    // Method 3: Check if component exists but not initialized
    const xData = body.getAttribute('x-data');
    const xInit = body.getAttribute('x-init');
    
    return {
      method: 'none',
      hasData: false,
      xData,
      xInit,
      alpineExists: typeof Alpine !== 'undefined',
      alpineStarted: typeof Alpine !== 'undefined' ? Alpine.started : null
    };
  });

  console.log('Alpine Component State:');
  console.log(JSON.stringify(alpineState, null, 2));

  // If Alpine is available but not bound, try to debug
  if (!alpineState.hasData && alpineState.alpineExists) {
    console.log('\nAttempting to debug Alpine initialization...');
    
    const debugResult = await page.evaluate(() => {
      // Check if sheepLand component is registered
      let componentRegistered = false;
      let registrationError = null;
      
      try {
        // Try to get the component
        const testComponent = Alpine.data('sheepLand');
        componentRegistered = typeof testComponent === 'function';
      } catch (e) {
        registrationError = e.message;
      }
      
      // Try to manually initialize
      let manualInitResult = null;
      try {
        Alpine.initTree(document.body);
        manualInitResult = 'Alpine.initTree called';
      } catch (e) {
        manualInitResult = `Error: ${e.message}`;
      }
      
      return {
        componentRegistered,
        registrationError,
        manualInitResult
      };
    });
    
    console.log('Debug result:', JSON.stringify(debugResult, null, 2));
  }

  // Check for console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Reload to capture errors
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  if (errors.length > 0) {
    console.log('\nConsole errors on reload:');
    errors.slice(0, 5).forEach(err => console.log(`- ${err}`));
  }

  await browser.close();
})();