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
    
    // Enable promo bar first
    await page.evaluate(() => {
      const app = window.Alpine && Alpine.$data && Alpine.$data(document.querySelector('[x-data]'));
      if (app) {
        app.settings.enablePromoBar = true;
        app.settings.promoEndISO = new Date(Date.now() + 86400000).toISOString();
      }
    });
    await page.waitForTimeout(500);
    
    // Click hamburger
    await page.click('.menu-btn');
    await page.waitForTimeout(500);
    
    const result = await page.evaluate(() => {
      const mobNav = document.querySelector('.mob-nav');
      const styles = window.getComputedStyle(mobNav);
      const rect = mobNav.getBoundingClientRect();
      
      // Check for any transform or translate
      const matrix = new DOMMatrix(styles.transform);
      
      return {
        rect: {
          top: rect.top,
          height: rect.height
        },
        styles: {
          top: styles.top,
          transform: styles.transform,
          translateY: matrix.m42,
          margin: styles.margin,
          marginTop: styles.marginTop,
          padding: styles.padding,
          paddingTop: styles.paddingTop,
          position: styles.position
        },
        offsetTop: mobNav.offsetTop,
        bodyClasses: document.body.className
      };
    });
    
    console.log('\n=== TRANSFORM ANALYSIS ===');
    console.log(JSON.stringify(result, null, 2));
    
    await browser.close();
  } finally {
    server.kill();
  }
})();