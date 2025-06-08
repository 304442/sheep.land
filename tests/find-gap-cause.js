const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }
  });
  const page = await context.newPage();
  
  await page.goto('https://sheep.land');
  await page.waitForFunction(() => window.Alpine !== undefined, { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  // Click hamburger to open menu
  await page.click('.menu-btn');
  await page.waitForTimeout(500);
  
  const analysis = await page.evaluate(() => {
    const mobNav = document.querySelector('.mob-nav');
    const header = document.querySelector('.site-head');
    
    if (!mobNav || !header) return { error: 'Elements not found' };
    
    // Get all parent elements
    const getParentChain = (el) => {
      const chain = [];
      let current = el;
      while (current && current !== document.body) {
        chain.push({
          tag: current.tagName,
          class: current.className,
          position: window.getComputedStyle(current).position,
          transform: window.getComputedStyle(current).transform,
          top: window.getComputedStyle(current).top,
          marginTop: window.getComputedStyle(current).marginTop,
        });
        current = current.parentElement;
      }
      return chain;
    };
    
    const mobNavRect = mobNav.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const mobNavStyles = window.getComputedStyle(mobNav);
    
    // Check for any transforms
    const hasTransform = mobNavStyles.transform !== 'none';
    
    // Get offsetTop vs computed top
    const offsetVsComputed = {
      offsetTop: mobNav.offsetTop,
      computedTop: mobNavStyles.top,
      getBoundingTop: mobNavRect.top,
      difference: mobNavRect.top - parseFloat(mobNavStyles.top)
    };
    
    // Check Alpine x-show state
    const alpineState = {
      xShow: mobNav.getAttribute('x-show'),
      displayStyle: mobNavStyles.display,
      visibility: mobNavStyles.visibility,
      opacity: mobNavStyles.opacity
    };
    
    return {
      gap: mobNavRect.top - headerRect.bottom,
      mobNav: {
        rect: { top: mobNavRect.top, height: mobNavRect.height },
        styles: {
          top: mobNavStyles.top,
          position: mobNavStyles.position,
          transform: mobNavStyles.transform,
          transition: mobNavStyles.transition,
          padding: mobNavStyles.padding,
          margin: mobNavStyles.margin,
          marginTop: mobNavStyles.marginTop
        },
        offsetVsComputed,
        hasTransform,
        parentChain: getParentChain(mobNav),
        alpineState
      },
      header: {
        bottom: headerRect.bottom,
        height: headerRect.height
      }
    };
  });
  
  console.log('=== GAP ANALYSIS ===');
  console.log(JSON.stringify(analysis, null, 2));
  
  if (analysis.mobNav && analysis.mobNav.offsetVsComputed.difference !== 0) {
    console.log(`\n⚠️  POSITION MISMATCH: Element is ${analysis.mobNav.offsetVsComputed.difference}px away from its computed position!`);
  }
  
  await browser.close();
})();