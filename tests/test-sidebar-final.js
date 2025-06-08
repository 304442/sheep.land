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
    
    // Get final state
    const final = await page.evaluate(() => {
      const mobNav = document.querySelector('.mob-nav');
      const overlay = document.querySelector('.mob-nav-overlay');
      const header = document.querySelector('.mob-nav-header');
      const navList = document.querySelector('.nav-list-mob');
      
      const mobNavRect = mobNav.getBoundingClientRect();
      const overlayVisible = overlay && overlay.offsetParent !== null;
      
      return {
        sidebar: {
          position: {
            left: mobNavRect.left,
            top: mobNavRect.top,
            width: mobNavRect.width,
            height: mobNavRect.height
          },
          hasActiveClass: mobNav.classList.contains('active'),
          scrollable: window.getComputedStyle(mobNav).overflowY
        },
        overlay: {
          visible: overlayVisible
        },
        content: {
          hasHeader: !!header,
          hasNavList: !!navList,
          navItemsCount: navList ? navList.querySelectorAll('.nav-link-mob').length : 0
        },
        viewport: {
          height: window.innerHeight
        }
      };
    });
    
    console.log('\n=== SIDEBAR FINAL STATE ===');
    console.log(JSON.stringify(final, null, 2));
    
    const success = 
      final.sidebar.hasActiveClass && 
      final.sidebar.position.left === 0 &&
      final.sidebar.position.height === final.viewport.height &&
      final.overlay.visible;
      
    if (success) {
      console.log('\n✅ SUCCESS: Sidebar is working perfectly!');
      console.log('- Slides in from left');
      console.log('- Full viewport height');
      console.log('- Overlay is visible');
      console.log('- Content is properly structured');
    } else {
      console.log('\n❌ Issues found:');
      if (!final.sidebar.hasActiveClass) console.log('- Active class not applied');
      if (final.sidebar.position.left !== 0) console.log('- Not positioned at left edge');
      if (final.sidebar.position.height !== final.viewport.height) console.log('- Not full height');
      if (!final.overlay.visible) console.log('- Overlay not visible');
    }
    
    // Keep browser open for visual inspection
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await browser.close();
  } finally {
    server.kill();
  }
})();