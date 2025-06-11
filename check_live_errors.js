const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const errors = [];
  const logs = [];

  // Capture everything
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    logs.push({ type, text });
    
    if (type === 'error') {
      console.log(`CONSOLE ERROR: ${text}`);
      errors.push(text);
    }
  });

  page.on('pageerror', err => {
    console.log(`PAGE ERROR: ${err}`);
    errors.push(err.toString());
  });

  console.log('🔍 Checking live site errors...\n');

  try {
    await page.goto('https://sheep.land', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log('Navigation error:', e.message);
  }

  // Check script loading status
  const scriptStatus = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    return scripts.map(s => ({
      src: s.src,
      loaded: !s.async || s.readyState === 'complete' || s.readyState === undefined,
      hasError: s.onerror !== null
    }));
  });

  console.log('\nScript loading status:');
  scriptStatus.forEach(s => {
    console.log(`${s.src}: ${s.loaded ? 'Loaded' : 'Failed'}`);
  });

  // Check what's defined
  const globalCheck = await page.evaluate(() => {
    return {
      hasPocketBase: typeof PocketBase !== 'undefined',
      hasAlpine: typeof Alpine !== 'undefined',
      hasAppData: typeof appData !== 'undefined',
      bodyContent: document.body ? document.body.children.length : 0,
      bodyXData: document.body ? document.body.getAttribute('x-data') : null
    };
  });

  console.log('\nGlobal variables:');
  console.log(JSON.stringify(globalCheck, null, 2));

  // Get first few errors in detail
  if (errors.length > 0) {
    console.log('\nDetailed errors:');
    errors.slice(0, 5).forEach((err, i) => {
      console.log(`\n${i + 1}. ${err}`);
    });
  }

  await page.screenshot({ path: 'error_state.png' });
  console.log('\n📸 Screenshot saved as error_state.png');

  await browser.close();
})();