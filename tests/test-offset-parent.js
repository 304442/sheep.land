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
    
    // Click hamburger
    await page.click('.menu-btn');
    await page.waitForTimeout(500);
    
    const result = await page.evaluate(() => {
      const mobNav = document.querySelector('.mob-nav');
      const header = document.querySelector('.site-head');
      const body = document.body;
      
      const mobNavRect = mobNav.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      const bodyRect = body.getBoundingClientRect();
      const styles = window.getComputedStyle(mobNav);
      const bodyStyles = window.getComputedStyle(body);
      
      // Check offset parent
      let offsetParent = mobNav.offsetParent;
      let offsetParentInfo = null;
      if (offsetParent) {
        offsetParentInfo = {
          tag: offsetParent.tagName,
          class: offsetParent.className,
          rect: offsetParent.getBoundingClientRect()
        };
      }
      
      return {
        gap: mobNavRect.top - headerRect.bottom,
        mobNav: {
          top: mobNavRect.top,
          computedTop: styles.top,
          offsetTop: mobNav.offsetTop,
          offsetParent: offsetParentInfo
        },
        header: {
          bottom: headerRect.bottom
        },
        body: {
          top: bodyRect.top,
          paddingTop: bodyStyles.paddingTop,
          position: bodyStyles.position
        }
      };
    });
    
    console.log('\n=== OFFSET PARENT ANALYSIS ===');
    console.log(JSON.stringify(result, null, 2));
    
    await browser.close();
  } finally {
    server.kill();
  }
})();