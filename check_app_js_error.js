const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const jsErrors = [];
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      jsErrors.push(msg.text());
    }
  });
  
  // Capture page errors
  page.on('pageerror', err => {
    jsErrors.push(`Page error: ${err.toString()}`);
  });

  console.log('🔍 Checking for app.js errors...\n');

  // Try to load and execute app.js content
  await page.goto('https://sheep.land/app.js');
  const appJsContent = await page.content();
  
  // Extract just the text content
  const scriptContent = await page.evaluate(() => document.body.textContent);
  
  console.log('app.js file size:', scriptContent.length, 'characters');
  
  // Try to parse it
  try {
    new Function(scriptContent);
    console.log('✅ app.js syntax is valid');
  } catch (e) {
    console.log('❌ app.js syntax error:', e.message);
    
    // Try to find the error location
    const match = e.message.match(/(\d+):(\d+)/);
    if (match) {
      const line = parseInt(match[1]);
      const lines = scriptContent.split('\n');
      console.log(`\nError around line ${line}:`);
      for (let i = Math.max(0, line - 3); i < Math.min(lines.length, line + 3); i++) {
        console.log(`${i + 1}: ${lines[i].substring(0, 100)}${lines[i].length > 100 ? '...' : ''}`);
      }
    }
  }

  // Now go to the actual site and check for errors
  await page.goto('https://sheep.land', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  console.log('\nJavaScript errors on page load:');
  if (jsErrors.length > 0) {
    jsErrors.slice(0, 10).forEach((err, i) => {
      console.log(`${i + 1}. ${err}`);
    });
  } else {
    console.log('No JavaScript errors captured during page load');
  }

  // Check if Alpine component registration is happening
  const componentCheck = await page.evaluate(() => {
    // Override Alpine.data to see if it's called
    let dataCallAttempted = false;
    let dataCallError = null;
    
    if (typeof Alpine !== 'undefined' && Alpine.data) {
      const originalData = Alpine.data;
      try {
        Alpine.data = function(name, fn) {
          dataCallAttempted = true;
          try {
            return originalData.call(this, name, fn);
          } catch (e) {
            dataCallError = e.toString();
            throw e;
          }
        };
        
        // Try to re-run the alpine:init event
        document.dispatchEvent(new CustomEvent('alpine:init'));
      } catch (e) {
        dataCallError = e.toString();
      }
    }
    
    return { dataCallAttempted, dataCallError };
  });

  console.log('\nComponent registration check:');
  console.log('Data call attempted:', componentCheck.dataCallAttempted);
  console.log('Data call error:', componentCheck.dataCallError);

  await browser.close();
})();