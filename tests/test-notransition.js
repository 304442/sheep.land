const { chromium } = require('playwright');
const { exec } = require('child_process');

(async () => {
  const server = exec('npm run serve');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 }
    });
    const page = await context.newPage();
    
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.Alpine !== undefined, { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Remove x-transition attribute before clicking
    await page.evaluate(() => {
      const mobNav = document.querySelector('.mob-nav');
      if (mobNav) {
        mobNav.removeAttribute('x-transition');
      }
    });
    
    // Click hamburger
    await page.click('.menu-btn');
    await page.waitForTimeout(100);
    
    const result = await page.evaluate(() => {
      const mobNav = document.querySelector('.mob-nav');
      const header = document.querySelector('.site-head');
      
      const mobNavRect = mobNav.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      const styles = window.getComputedStyle(mobNav);
      
      return {
        gap: mobNavRect.top - headerRect.bottom,
        mobNav: {
          top: mobNavRect.top,
          computedTop: styles.top,
          display: styles.display
        },
        header: {
          bottom: headerRect.bottom
        }
      };
    });
    
    console.log('\n=== NO TRANSITION TEST ===');
    console.log(JSON.stringify(result, null, 2));
    
    await browser.close();
  } finally {
    server.kill();
  }
})();