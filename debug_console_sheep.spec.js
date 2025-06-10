const { test, expect } = require('@playwright/test');

test.describe('Sheep.land Console Debug', () => {
  test('capture and analyze all console messages', async ({ page }) => {
    const consoleMessages = [];
    const pageErrors = [];
    
    // Capture all console messages with full details
    page.on('console', msg => {
      const entry = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        args: []
      };
      
      // Try to get actual values from console arguments
      msg.args().forEach(arg => {
        arg.jsonValue().then(val => {
          entry.args.push(val);
        }).catch(() => {
          entry.args.push('<unable to serialize>');
        });
      });
      
      consoleMessages.push(entry);
      
      // Print in real-time for debugging
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
      if (msg.location().url) {
        console.log(`  Location: ${msg.location().url}:${msg.location().lineNumber}:${msg.location().columnNumber}`);
      }
    });
    
    // Capture page errors
    page.on('pageerror', error => {
      const errorInfo = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
      pageErrors.push(errorInfo);
      console.error('\n[PAGE ERROR]:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    });
    
    // Capture request failures
    page.on('requestfailed', request => {
      console.error(`[REQUEST FAILED] ${request.url()}: ${request.failure().errorText}`);
    });
    
    console.log('\n=== Starting navigation to https://sheep.land ===\n');
    
    // Navigate with network idle to ensure all resources are loaded
    await page.goto('https://sheep.land', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Wait a bit more to catch any delayed console messages
    await page.waitForTimeout(3000);
    
    console.log('\n=== Console Messages Summary ===');
    console.log(`Total messages: ${consoleMessages.length}`);
    
    // Group messages by type
    const messagesByType = {};
    consoleMessages.forEach(msg => {
      if (!messagesByType[msg.type]) {
        messagesByType[msg.type] = [];
      }
      messagesByType[msg.type].push(msg);
    });
    
    // Print summary by type
    Object.keys(messagesByType).forEach(type => {
      console.log(`\n${type.toUpperCase()} messages (${messagesByType[type].length}):`);
      messagesByType[type].forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.text}`);
        if (msg.location.url && type === 'error') {
          console.log(`   at ${msg.location.url}:${msg.location.lineNumber}`);
        }
      });
    });
    
    console.log('\n=== Page Errors Summary ===');
    console.log(`Total page errors: ${pageErrors.length}`);
    pageErrors.forEach((error, index) => {
      console.log(`\nError ${index + 1}: ${error.name}`);
      console.log(`Message: ${error.message}`);
    });
    
    // Analyze specific Alpine.js warnings
    console.log('\n=== Alpine.js Warning Analysis ===');
    const alpineWarnings = consoleMessages.filter(msg => 
      msg.text.includes('Alpine Warning') || msg.text.includes('Alpine Expression Error')
    );
    
    console.log(`Found ${alpineWarnings.length} Alpine-related warnings`);
    
    // Group Alpine warnings by type
    const duplicateKeyWarnings = alpineWarnings.filter(w => w.text.includes('Duplicate key'));
    const undefinedKeyWarnings = alpineWarnings.filter(w => w.text.includes('undefined or invalid'));
    const expressionErrors = alpineWarnings.filter(w => w.text.includes('Expression Error'));
    
    console.log(`- Duplicate key warnings: ${duplicateKeyWarnings.length}`);
    console.log(`- Undefined key warnings: ${undefinedKeyWarnings.length}`);
    console.log(`- Expression errors: ${expressionErrors.length}`);
    
    // Extract problematic expressions
    console.log('\n=== Problematic Expressions ===');
    expressionErrors.forEach(error => {
      const match = error.text.match(/Expression: "([^"]+)"/);
      if (match) {
        console.log(`- Expression: "${match[1]}"`);
      }
    });
    
    // Check if error elements exist in DOM
    console.log('\n=== Error Elements in DOM ===');
    const errorElements = await page.$$eval('[class*="error"], [class*="Error"]', elements => 
      elements.map(el => ({
        tag: el.tagName,
        class: el.className,
        text: el.textContent.trim().substring(0, 100),
        visible: el.offsetParent !== null
      }))
    );
    
    errorElements.forEach(el => {
      console.log(`- ${el.tag}.${el.class}: "${el.text}" (visible: ${el.visible})`);
    });
    
    // Get current page state
    console.log('\n=== Page State ===');
    const pageState = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        alpine: typeof Alpine !== 'undefined',
        alpineVersion: typeof Alpine !== 'undefined' ? Alpine.version : 'not loaded',
        hasProducts: document.querySelectorAll('[x-for*="productType"]').length,
        errorIndicator: document.querySelector('.err-ind')?.textContent
      };
    });
    
    console.log('Current URL:', pageState.url);
    console.log('Page title:', pageState.title);
    console.log('Alpine.js loaded:', pageState.alpine);
    console.log('Alpine version:', pageState.alpineVersion);
    console.log('Product loops found:', pageState.hasProducts);
    console.log('Error indicator:', pageState.errorIndicator);
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      url: pageState.url,
      consoleMessages: consoleMessages,
      pageErrors: pageErrors,
      alpineWarnings: {
        total: alpineWarnings.length,
        duplicateKeys: duplicateKeyWarnings.length,
        undefinedKeys: undefinedKeyWarnings.length,
        expressionErrors: expressionErrors.length
      },
      errorElements: errorElements,
      pageState: pageState
    };
    
    require('fs').writeFileSync('sheep-land-console-debug.json', JSON.stringify(report, null, 2));
    console.log('\n=== Detailed report saved to sheep-land-console-debug.json ===');
    
    // Assertions
    expect(pageErrors.length).toBe(0);
    expect(expressionErrors.length).toBe(0);
  });
});