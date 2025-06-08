const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  
  // Test different viewports
  const viewports = [
    { width: 375, height: 812, name: 'iPhone X' },
    { width: 768, height: 1024, name: 'iPad' },
    { width: 769, height: 1024, name: 'iPad + 1px' },
  ];
  
  for (const viewport of viewports) {
    console.log(`\n=== Testing ${viewport.name} (${viewport.width}x${viewport.height}) ===`);
    
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    
    await page.goto('https://sheep.land');
    await page.waitForFunction(() => window.Alpine !== undefined, { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Check which media query is active
    const mediaQueryInfo = await page.evaluate(() => {
      const mobNav = document.querySelector('.mob-nav');
      if (!mobNav) return { error: 'mobNav not found' };
      
      const styles = window.getComputedStyle(mobNav);
      const bodyClasses = document.body.className;
      
      // Check if media query matches
      const mq768 = window.matchMedia('(max-width: 768px)');
      const mq769 = window.matchMedia('(min-width: 769px)');
      
      return {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        mediaQueries: {
          'max-width-768': mq768.matches,
          'min-width-769': mq769.matches
        },
        mobNav: {
          computedTop: styles.top,
          padding: styles.padding,
          display: styles.display
        },
        bodyClasses,
        hasPromoBar: document.body.classList.contains('has-promo-bar')
      };
    });
    
    console.log(JSON.stringify(mediaQueryInfo, null, 2));
    
    await context.close();
  }
  
  await browser.close();
})();