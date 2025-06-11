const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const errors = [];
  page.on('pageerror', err => {
    errors.push(err.toString());
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console error: ${msg.text()}`);
    }
  });

  console.log('🔍 Checking for JavaScript errors...\n');

  await page.goto('https://sheep.land', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  if (errors.length > 0) {
    console.log('JavaScript errors found:');
    errors.forEach((err, i) => {
      console.log(`\n${i + 1}. ${err}`);
    });
  } else {
    console.log('No JavaScript errors detected');
  }

  // Check if app.js loaded
  const scriptsInfo = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    return scripts.map(s => ({
      src: s.src,
      loaded: !s.async || s.readyState === 'complete' || s.readyState === undefined
    }));
  });

  console.log('\n\nScripts loaded:');
  scriptsInfo.forEach(s => {
    console.log(`${s.src} - ${s.loaded ? 'Loaded' : 'Not loaded'}`);
  });

  // Check Alpine data directly
  const alpineCheck = await page.evaluate(() => {
    const alpineScript = document.querySelector('script[x-data]');
    return {
      hasInlineAlpine: !!alpineScript,
      appDataStart: document.body.innerHTML.includes('appData()') ? 'Found appData()' : 'appData() not found'
    };
  });

  console.log('\n\nAlpine setup:');
  console.log(JSON.stringify(alpineCheck, null, 2));

  // Try to get the actual error by evaluating appData
  try {
    const appDataError = await page.evaluate(() => {
      try {
        if (typeof appData === 'function') {
          appData();
          return 'appData executed successfully';
        }
        return 'appData is not defined';
      } catch (e) {
        return `Error in appData: ${e.toString()}`;
      }
    });
    console.log('\nappData test: ' + appDataError);
  } catch (e) {
    console.log('\nCould not test appData: ' + e.message);
  }

  await browser.close();
})();