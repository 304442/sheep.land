const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();
  
  console.log('Loading https://sheep.land...');
  await page.goto('https://sheep.land');
  
  // Wait for Alpine to load
  await page.waitForFunction(() => window.Alpine !== undefined, { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  // Get initial measurements
  const initialMeasurements = await page.evaluate(() => {
    const measurements = {};
    
    // Get all relevant elements
    const elements = {
      contactBar: '.top-contact-bar',
      header: '.site-head',
      mobNav: '.mob-nav',
      promoBar: '.promo-bar',
      menuBtn: '.menu-btn'
    };
    
    for (const [name, selector] of Object.entries(elements)) {
      const el = document.querySelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        measurements[name] = {
          selector,
          visible: el.offsetParent !== null,
          rect: {
            top: rect.top,
            height: rect.height,
            bottom: rect.bottom
          },
          styles: {
            position: styles.position,
            top: styles.top,
            padding: styles.padding,
            paddingTop: styles.paddingTop,
            display: styles.display,
            visibility: styles.visibility
          }
        };
      }
    }
    
    measurements.bodyClasses = document.body.className;
    measurements.viewportHeight = window.innerHeight;
    
    return measurements;
  });
  
  console.log('\n=== INITIAL STATE ===');
  console.log(JSON.stringify(initialMeasurements, null, 2));
  
  // Click the hamburger menu
  console.log('\nClicking hamburger menu...');
  await page.click('.menu-btn');
  await page.waitForTimeout(1000);
  
  // Get measurements after click
  const afterClickMeasurements = await page.evaluate(() => {
    const header = document.querySelector('.site-head');
    const mobNav = document.querySelector('.mob-nav');
    
    if (!header || !mobNav) return { error: 'Elements not found' };
    
    const headerRect = header.getBoundingClientRect();
    const mobNavRect = mobNav.getBoundingClientRect();
    
    return {
      header: {
        bottom: headerRect.bottom,
        height: headerRect.height
      },
      mobNav: {
        top: mobNavRect.top,
        visible: mobNav.offsetParent !== null,
        computedTop: window.getComputedStyle(mobNav).top,
        padding: window.getComputedStyle(mobNav).padding,
        paddingTop: window.getComputedStyle(mobNav).paddingTop
      },
      gap: mobNavRect.top - headerRect.bottom,
      alpineData: {
        isMobNavOpen: window.Alpine && window.Alpine.$data ? 
          window.Alpine.$data(document.querySelector('[x-data]')).isMobNavOpen : 
          'Alpine not accessible'
      }
    };
  });
  
  console.log('\n=== AFTER CLICK ===');
  console.log(JSON.stringify(afterClickMeasurements, null, 2));
  
  if (afterClickMeasurements.gap > 0) {
    console.log(`\n⚠️  GAP DETECTED: ${afterClickMeasurements.gap}px between header and mobile nav!`);
  } else if (afterClickMeasurements.gap < 0) {
    console.log(`\n✓ Mobile nav overlaps header by ${Math.abs(afterClickMeasurements.gap)}px`);
  } else {
    console.log('\n✓ Mobile nav is flush with header (no gap)');
  }
  
  // Take screenshot
  await page.screenshot({ path: 'tests/screenshots/mobile-menu-state.png' });
  console.log('\nScreenshot saved to tests/screenshots/mobile-menu-state.png');
  
  await browser.close();
})();