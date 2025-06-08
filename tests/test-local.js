const { chromium } = require('playwright');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

(async () => {
  // Start local server
  console.log('Starting local server...');
  const server = exec('npm run serve');
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 }
    });
    const page = await context.newPage();
    
    console.log('Loading local site...');
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.Alpine !== undefined, { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Click hamburger
    await page.click('.menu-btn');
    await page.waitForTimeout(500);
    
    const result = await page.evaluate(() => {
      const mobNav = document.querySelector('.mob-nav');
      const header = document.querySelector('.site-head');
      
      if (!mobNav || !header) return { error: 'Elements not found' };
      
      const mobNavRect = mobNav.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      const styles = window.getComputedStyle(mobNav);
      
      return {
        gap: mobNavRect.top - headerRect.bottom,
        mobNav: {
          top: mobNavRect.top,
          computedTop: styles.top
        },
        header: {
          bottom: headerRect.bottom
        }
      };
    });
    
    console.log('\n=== LOCAL TEST RESULT ===');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.gap === 0) {
      console.log('\n✅ SUCCESS: Mobile menu is flush with header!');
    } else {
      console.log(`\n❌ FAIL: Still has ${result.gap}px gap`);
    }
    
    await browser.close();
  } finally {
    // Kill the server
    server.kill();
  }
})();