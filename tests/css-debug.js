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
  
  const cssAnalysis = await page.evaluate(() => {
    const mobNav = document.querySelector('.mob-nav');
    if (!mobNav) return { error: 'mob-nav not found' };
    
    // Get all stylesheets
    const sheets = Array.from(document.styleSheets);
    const mobNavRules = [];
    
    sheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules || []);
        rules.forEach(rule => {
          if (rule.selectorText && rule.selectorText.includes('.mob-nav')) {
            mobNavRules.push({
              selector: rule.selectorText,
              top: rule.style.top,
              position: rule.style.position,
              important: rule.style.getPropertyPriority('top') === 'important'
            });
          }
        });
      } catch (e) {
        // Cross-origin stylesheets throw errors
      }
    });
    
    const computed = window.getComputedStyle(mobNav);
    const cssVars = {
      '--head-h': getComputedStyle(document.documentElement).getPropertyValue('--head-h'),
      '--head-h-mob': getComputedStyle(document.documentElement).getPropertyValue('--head-h-mob')
    };
    
    return {
      computedTop: computed.top,
      position: computed.position,
      matchingRules: mobNavRules,
      cssVars,
      bodyClasses: document.body.className
    };
  });
  
  console.log('=== CSS ANALYSIS ===');
  console.log(JSON.stringify(cssAnalysis, null, 2));
  
  await browser.close();
})();
