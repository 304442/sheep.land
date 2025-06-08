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
    
    // Get state before clicking
    const before = await page.evaluate(() => {
      const mobNav = document.querySelector('.mob-nav');
      const styles = window.getComputedStyle(mobNav);
      const rect = mobNav.getBoundingClientRect();
      return {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        top: styles.top,
        transform: styles.transform,
        rect: { top: rect.top, height: rect.height },
        attributes: {
          style: mobNav.getAttribute('style'),
          xShow: mobNav.getAttribute('x-show')
        }
      };
    });
    
    // Click hamburger
    await page.click('.menu-btn');
    await page.waitForTimeout(500);
    
    // Get state after clicking
    const after = await page.evaluate(() => {
      const mobNav = document.querySelector('.mob-nav');
      const styles = window.getComputedStyle(mobNav);
      const rect = mobNav.getBoundingClientRect();
      return {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        top: styles.top,
        transform: styles.transform,
        rect: { top: rect.top, height: rect.height },
        attributes: {
          style: mobNav.getAttribute('style'),
          xShow: mobNav.getAttribute('x-show')
        }
      };
    });
    
    console.log('\n=== ALPINE X-SHOW ANALYSIS ===');
    console.log('BEFORE:', JSON.stringify(before, null, 2));
    console.log('\nAFTER:', JSON.stringify(after, null, 2));
    
    await browser.close();
  } finally {
    server.kill();
  }
})();