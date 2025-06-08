const { chromium } = require('playwright');
const { exec } = require('child_process');

(async () => {
  // Start local server
  console.log('Starting local server...');
  const server = exec('npm run serve');
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 }
    });
    const page = await context.newPage();
    
    console.log('Loading local site...');
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.Alpine !== undefined, { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Click hamburger
    await page.click('.menu-btn');
    await page.waitForTimeout(500);
    
    const result = await page.evaluate(() => {
      const mobNav = document.querySelector('.mob-nav');
      const header = document.querySelector('.site-head');
      const contactBar = document.querySelector('.top-contact-bar');
      const promoBar = document.querySelector('.promo-bar');
      
      const mobNavRect = mobNav.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      const mobNavStyles = window.getComputedStyle(mobNav);
      const headerStyles = window.getComputedStyle(header);
      
      const cssVars = {
        '--head-h': getComputedStyle(document.documentElement).getPropertyValue('--head-h'),
        '--head-h-mob': getComputedStyle(document.documentElement).getPropertyValue('--head-h-mob')
      };
      
      return {
        elements: {
          contactBar: contactBar ? contactBar.getBoundingClientRect().height : 0,
          promoBar: promoBar ? window.getComputedStyle(promoBar).display !== 'none' : false,
          header: {
            top: headerRect.top,
            height: headerRect.height,
            bottom: headerRect.bottom,
            computedTop: headerStyles.top
          },
          mobNav: {
            top: mobNavRect.top,
            height: mobNavRect.height,
            computedTop: mobNavStyles.top,
            paddingTop: mobNavStyles.paddingTop
          }
        },
        gap: mobNavRect.top - headerRect.bottom,
        cssVars,
        bodyClasses: document.body.className,
        calculation: {
          expected: `${cssVars['--head-h-mob']} (${parseFloat(cssVars['--head-h-mob'])}px) + 68px = ${parseFloat(cssVars['--head-h-mob']) + 68}px`,
          actual: mobNavStyles.top
        }
      };
    });
    
    console.log('\n=== DETAILED DEBUG ===');
    console.log(JSON.stringify(result, null, 2));
    
    await browser.close();
  } finally {
    // Kill the server
    server.kill();
  }
})();