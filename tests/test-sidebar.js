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
    
    // Get initial state
    const initial = await page.evaluate(() => {
      const mobNav = document.querySelector('.mob-nav');
      const overlay = document.querySelector('.mob-nav-overlay');
      const styles = window.getComputedStyle(mobNav);
      
      return {
        mobNav: {
          transform: styles.transform,
          left: styles.left,
          width: styles.width,
          hasActiveClass: mobNav.classList.contains('active')
        },
        overlay: overlay ? {
          display: window.getComputedStyle(overlay).display
        } : null
      };
    });
    
    console.log('\n=== INITIAL STATE ===');
    console.log(JSON.stringify(initial, null, 2));
    
    // Click hamburger
    await page.click('.menu-btn');
    await page.waitForTimeout(500);
    
    // Get open state
    const opened = await page.evaluate(() => {
      const mobNav = document.querySelector('.mob-nav');
      const overlay = document.querySelector('.mob-nav-overlay');
      const styles = window.getComputedStyle(mobNav);
      const rect = mobNav.getBoundingClientRect();
      
      return {
        mobNav: {
          transform: styles.transform,
          left: styles.left,
          width: styles.width,
          hasActiveClass: mobNav.classList.contains('active'),
          rect: {
            left: rect.left,
            width: rect.width,
            top: rect.top,
            height: rect.height
          }
        },
        overlay: overlay ? {
          display: window.getComputedStyle(overlay).display,
          visible: overlay.offsetParent !== null
        } : null
      };
    });
    
    console.log('\n=== OPENED STATE ===');
    console.log(JSON.stringify(opened, null, 2));
    
    if (opened.mobNav.hasActiveClass && opened.mobNav.rect.left === 0) {
      console.log('\n✅ SUCCESS: Sidebar menu is working correctly!');
    } else {
      console.log('\n❌ FAIL: Sidebar not positioned correctly');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/sidebar-open.png' });
    
    await browser.close();
  } finally {
    server.kill();
  }
})();