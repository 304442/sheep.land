const { chromium } = require('playwright');

(async () => {
  console.log('Testing sheep.land with proper wait conditions...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate to page
    console.log('1. Loading page...');
    await page.goto('https://sheep.land', { waitUntil: 'networkidle' });
    
    // Wait for Alpine.js to initialize
    console.log('2. Waiting for Alpine.js initialization...');
    await page.waitForFunction(() => {
      return window.Alpine && window.Alpine.version;
    }, { timeout: 10000 });
    
    // Additional wait for components to mount
    await page.waitForTimeout(2000);
    
    console.log('3. Checking page state...');
    
    // Check Alpine status
    const alpineVersion = await page.evaluate(() => window.Alpine?.version);
    console.log(`   - Alpine.js version: ${alpineVersion}`);
    
    // Check for elements
    const elements = await page.evaluate(() => {
      return {
        searchButton: !!document.querySelector('button[title="Search"]'),
        cartButton: !!document.querySelector('button[title="Shopping Cart"]'),
        wishlistButton: !!document.querySelector('button[title="Wishlist"]'),
        trackOrderButton: !!document.querySelector('button:has-text("Track Order")'),
        searchDropdown: !!document.querySelector('.search-dropdown'),
        cartSidebar: !!document.querySelector('.cart-sidebar'),
        wishlistDropdown: !!document.querySelector('.wishlist-dropdown'),
        xDataElements: document.querySelectorAll('[x-data]').length,
        xShowElements: document.querySelectorAll('[x-show]').length
      };
    });
    
    console.log('   - Elements found:');
    Object.entries(elements).forEach(([key, value]) => {
      console.log(`     • ${key}: ${value}`);
    });
    
    // Try clicking search with better selector
    console.log('\n4. Testing search button click...');
    try {
      // Find all buttons and check their attributes
      const buttons = await page.$$eval('button', buttons => 
        buttons.map(b => ({
          text: b.textContent.trim(),
          title: b.getAttribute('title'),
          ariaLabel: b.getAttribute('aria-label'),
          classes: b.className
        }))
      );
      
      console.log('   - Found buttons:');
      buttons.forEach(b => {
        if (b.title || b.ariaLabel) {
          console.log(`     • "${b.text || 'no text'}" - title: "${b.title}", aria-label: "${b.ariaLabel}"`);
        }
      });
      
      // Try to click search
      const searchClicked = await page.evaluate(() => {
        const btn = document.querySelector('button[title="Search"]');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      
      console.log(`   - Search button clicked: ${searchClicked}`);
      
      if (searchClicked) {
        await page.waitForTimeout(1000);
        const searchVisible = await page.isVisible('.search-dropdown');
        console.log(`   - Search dropdown visible: ${searchVisible}`);
      }
      
    } catch (e) {
      console.log('   - Error testing search:', e.message);
    }
    
    // Check x-show states
    console.log('\n5. Checking x-show element states...');
    const xShowStates = await page.evaluate(() => {
      const elements = document.querySelectorAll('[x-show]');
      const states = [];
      elements.forEach(el => {
        const xShow = el.getAttribute('x-show');
        const display = window.getComputedStyle(el).display;
        if (xShow.includes('Search') || xShow.includes('Cart') || xShow.includes('Wishlist')) {
          states.push({
            xShow,
            display,
            visible: display !== 'none'
          });
        }
      });
      return states;
    });
    
    console.log('   - Key x-show elements:');
    xShowStates.forEach(state => {
      console.log(`     • ${state.xShow}: ${state.visible ? 'visible' : 'hidden'}`);
    });
    
    // Check Alpine data
    console.log('\n6. Checking Alpine.js data...');
    const alpineData = await page.evaluate(() => {
      const rootEl = document.querySelector('[x-data="sheepLand"]');
      if (rootEl && rootEl._x_dataStack) {
        const data = rootEl._x_dataStack[0];
        return {
          hasData: true,
          showSearch: data.showSearch,
          showCart: data.showCart,
          isWishlistOpen: data.isWishlistOpen,
          load: data.load,
          apiErr: data.apiErr
        };
      }
      return { hasData: false };
    });
    
    console.log('   - Alpine data state:');
    Object.entries(alpineData).forEach(([key, value]) => {
      console.log(`     • ${key}: ${JSON.stringify(value)}`);
    });
    
  } catch (error) {
    console.error('Test error:', error);
  }
  
  await browser.close();
  console.log('\nTest completed!');
})();