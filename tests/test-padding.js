const { chromium } = require('playwright');
const { exec } = require('child_process');

(async () => {
  const server = exec('npm run serve');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const browser = await chromium.launch({ headless: false });
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
    
    const analysis = await page.evaluate(() => {
      const mobNav = document.querySelector('.mob-nav');
      const firstChild = mobNav.firstElementChild;
      const navList = document.querySelector('.nav-list-mob');
      
      const mobNavRect = mobNav.getBoundingClientRect();
      const mobNavStyles = window.getComputedStyle(mobNav);
      const firstChildRect = firstChild ? firstChild.getBoundingClientRect() : null;
      const navListRect = navList ? navList.getBoundingClientRect() : null;
      
      return {
        mobNav: {
          rect: { top: mobNavRect.top, height: mobNavRect.height },
          padding: mobNavStyles.padding,
          paddingTop: mobNavStyles.paddingTop,
          boxSizing: mobNavStyles.boxSizing
        },
        firstChild: firstChildRect ? {
          tag: firstChild.tagName,
          rect: { top: firstChildRect.top },
          marginTop: window.getComputedStyle(firstChild).marginTop
        } : null,
        navList: navListRect ? {
          rect: { top: navListRect.top },
          marginTop: window.getComputedStyle(navList).marginTop
        } : null,
        innerGap: firstChildRect ? firstChildRect.top - mobNavRect.top : 0
      };
    });
    
    console.log('\n=== PADDING ANALYSIS ===');
    console.log(JSON.stringify(analysis, null, 2));
    
    // Keep browser open for visual inspection
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await browser.close();
  } finally {
    server.kill();
  }
})();