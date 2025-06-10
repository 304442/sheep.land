const { chromium } = require('playwright');

(async () => {
  console.log('Starting manual test of sheep.land...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  const errors = [];
  const features = {};
  
  // Monitor console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  try {
    // Load page
    console.log('1. Loading https://sheep.land...');
    await page.goto('https://sheep.land', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: 'manual-test/1-homepage.png', fullPage: true });
    features.pageLoad = 'Success';
    
    // Check title
    const title = await page.title();
    console.log('   Page title:', title);
    
    // Test search button
    console.log('2. Testing search button...');
    try {
      await page.click('button[aria-label="Search"]', { timeout: 5000 });
      await page.waitForTimeout(1000);
      const searchVisible = await page.isVisible('#searchModal');
      await page.screenshot({ path: 'manual-test/2-search.png' });
      features.searchModal = searchVisible ? 'Working' : 'Not visible';
      if (searchVisible) await page.keyboard.press('Escape');
    } catch (e) {
      features.searchModal = 'Failed: ' + e.message;
    }
    
    // Test cart
    console.log('3. Testing cart...');
    try {
      await page.click('button[aria-label="Shopping Cart"]', { timeout: 5000 });
      await page.waitForTimeout(1000);
      const cartVisible = await page.isVisible('#cartSidebar');
      await page.screenshot({ path: 'manual-test/3-cart.png' });
      features.cartSidebar = cartVisible ? 'Working' : 'Not visible';
      if (cartVisible) {
        const closeBtn = await page.$('#cartSidebar button[aria-label="Close"]');
        if (closeBtn) await closeBtn.click();
      }
    } catch (e) {
      features.cartSidebar = 'Failed: ' + e.message;
    }
    
    // Test wishlist
    console.log('4. Testing wishlist...');
    try {
      await page.click('button[aria-label="Wishlist"]', { timeout: 5000 });
      await page.waitForTimeout(1000);
      const wishlistVisible = await page.isVisible('#wishlistSidebar');
      await page.screenshot({ path: 'manual-test/4-wishlist.png' });
      features.wishlistSidebar = wishlistVisible ? 'Working' : 'Not visible';
      if (wishlistVisible) {
        const closeBtn = await page.$('#wishlistSidebar button[aria-label="Close"]');
        if (closeBtn) await closeBtn.click();
      }
    } catch (e) {
      features.wishlistSidebar = 'Failed: ' + e.message;
    }
    
    // Test products section
    console.log('5. Checking products section...');
    try {
      await page.evaluate(() => {
        const section = document.querySelector('#products');
        if (section) section.scrollIntoView();
      });
      await page.waitForTimeout(1000);
      const noProducts = await page.isVisible('text=No products available');
      await page.screenshot({ path: 'manual-test/5-products.png' });
      features.noProductsMessage = noProducts ? 'Visible' : 'Not found';
    } catch (e) {
      features.noProductsMessage = 'Failed: ' + e.message;
    }
    
    // Test keyboard shortcuts
    console.log('6. Testing keyboard shortcuts...');
    try {
      // Scroll to top first
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      
      // Test 'c' for cart
      await page.keyboard.press('c');
      await page.waitForTimeout(500);
      const cartOpen = await page.isVisible('#cartSidebar');
      if (cartOpen) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
      
      // Test '/' for search
      await page.keyboard.press('/');
      await page.waitForTimeout(500);
      const searchOpen = await page.isVisible('#searchModal');
      if (searchOpen) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
      
      features.keyboardShortcuts = `Cart: ${cartOpen}, Search: ${searchOpen}`;
    } catch (e) {
      features.keyboardShortcuts = 'Failed: ' + e.message;
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  // Summary
  console.log('\n=== TEST RESULTS ===');
  console.log('Features tested:');
  Object.entries(features).forEach(([feature, result]) => {
    console.log(`  ${feature}: ${result}`);
  });
  
  console.log('\nConsole errors:', errors.length);
  if (errors.length > 0) {
    console.log('Errors:');
    errors.forEach((err, i) => console.log(`  ${i+1}. ${err}`));
  }
  
  await browser.close();
  console.log('\nTest completed!');
})();