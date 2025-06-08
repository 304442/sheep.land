const { test, expect } = require('@playwright/test');

test.describe('Mobile Menu Debugging', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the site
    await page.goto('/');
    
    // Wait for Alpine.js to initialize
    await page.waitForFunction(() => window.Alpine !== undefined);
    await page.waitForTimeout(1000); // Give Alpine time to fully initialize
  });

  test('Debug mobile menu positioning', async ({ page, browserName }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 812 });
    
    // Get measurements of all elements
    const measurements = await page.evaluate(() => {
      const contactBar = document.querySelector('.top-contact-bar');
      const header = document.querySelector('.site-head');
      const mobNav = document.querySelector('.mob-nav');
      const promoBar = document.querySelector('.promo-bar');
      
      const getComputedPosition = (el) => {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const computed = window.getComputedStyle(el);
        return {
          top: rect.top,
          height: rect.height,
          computedTop: computed.top,
          computedHeight: computed.height,
          padding: computed.padding,
          paddingTop: computed.paddingTop,
          position: computed.position,
          display: computed.display,
          visibility: computed.visibility,
        };
      };
      
      return {
        contactBar: getComputedPosition(contactBar),
        header: getComputedPosition(header),
        mobNav: getComputedPosition(mobNav),
        promoBar: getComputedPosition(promoBar),
        bodyClass: document.body.className,
        hasPromoBar: document.body.classList.contains('has-promo-bar'),
      };
    });
    
    console.log('Initial Measurements:', JSON.stringify(measurements, null, 2));
    
    // Click hamburger menu
    await page.click('.menu-btn');
    await page.waitForTimeout(500); // Wait for animation
    
    // Get measurements after opening menu
    const afterClick = await page.evaluate(() => {
      const mobNav = document.querySelector('.mob-nav');
      const header = document.querySelector('.site-head');
      
      if (!mobNav || !header) return null;
      
      const mobNavRect = mobNav.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      const mobNavStyle = window.getComputedStyle(mobNav);
      
      return {
        mobNav: {
          top: mobNavRect.top,
          height: mobNavRect.height,
          computedTop: mobNavStyle.top,
          padding: mobNavStyle.padding,
          paddingTop: mobNavStyle.paddingTop,
          display: mobNavStyle.display,
        },
        header: {
          bottom: headerRect.bottom,
          height: headerRect.height,
        },
        gap: mobNavRect.top - headerRect.bottom,
        isMenuVisible: mobNav.offsetParent !== null,
      };
    });
    
    console.log('After Click Measurements:', JSON.stringify(afterClick, null, 2));
    
    // Take screenshots
    await page.screenshot({ 
      path: `tests/screenshots/mobile-menu-${browserName}.png`,
      fullPage: false 
    });
    
    // Check if there's a gap
    if (afterClick && afterClick.gap > 0) {
      console.log(`WARNING: Gap detected! ${afterClick.gap}px between header and menu`);
    }
    
    // Test with promo bar enabled
    await page.evaluate(() => {
      // Enable promo bar for testing
      window.Alpine.store('sheepLand').settings.promoActive = true;
      window.Alpine.store('sheepLand').cd.ended = false;
    });
    
    await page.waitForTimeout(500);
    
    const withPromo = await page.evaluate(() => {
      return {
        hasPromoBar: document.body.classList.contains('has-promo-bar'),
        promoBarVisible: document.querySelector('.promo-bar')?.offsetParent !== null,
      };
    });
    
    console.log('With Promo:', JSON.stringify(withPromo, null, 2));
  });

  test('Inspect CSS cascade for mobile nav', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    
    const cssInfo = await page.evaluate(() => {
      const mobNav = document.querySelector('.mob-nav');
      if (!mobNav) return null;
      
      // Get all CSS rules that apply to .mob-nav
      const sheets = Array.from(document.styleSheets);
      const rules = [];
      
      sheets.forEach(sheet => {
        try {
          const cssRules = Array.from(sheet.cssRules || []);
          cssRules.forEach(rule => {
            if (rule.selectorText && rule.selectorText.includes('mob-nav')) {
              rules.push({
                selector: rule.selectorText,
                styles: rule.style.cssText,
              });
            }
          });
        } catch (e) {
          // Cross-origin stylesheets will throw
        }
      });
      
      return {
        appliedRules: rules,
        computedStyle: {
          top: window.getComputedStyle(mobNav).top,
          padding: window.getComputedStyle(mobNav).padding,
          position: window.getComputedStyle(mobNav).position,
        },
      };
    });
    
    console.log('CSS Cascade Info:', JSON.stringify(cssInfo, null, 2));
  });
});