const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Loading sheep.land...');
  await page.goto('https://sheep.land', { waitUntil: 'networkidle' });
  
  // Get page content
  const content = await page.content();
  
  // Check for key elements
  console.log('\nChecking for key elements:');
  
  const hasSearchButton = content.includes('aria-label="Search"');
  console.log('Search button:', hasSearchButton);
  
  const hasCartButton = content.includes('aria-label="Shopping Cart"');
  console.log('Cart button:', hasCartButton);
  
  const hasWishlistButton = content.includes('aria-label="Wishlist"');
  console.log('Wishlist button:', hasWishlistButton);
  
  const hasAlpine = content.includes('x-data');
  console.log('Alpine.js directives:', hasAlpine);
  
  const hasSearchModal = content.includes('id="searchModal"');
  console.log('Search modal:', hasSearchModal);
  
  const hasCartSidebar = content.includes('id="cartSidebar"');
  console.log('Cart sidebar:', hasCartSidebar);
  
  // Check for scripts
  const scripts = await page.$$eval('script', scripts => 
    scripts.map(s => s.src || 'inline').filter(s => s !== 'inline')
  );
  console.log('\nExternal scripts loaded:');
  scripts.forEach(s => console.log('  -', s));
  
  // Check Alpine.js
  const alpineLoaded = await page.evaluate(() => typeof Alpine !== 'undefined');
  console.log('\nAlpine.js loaded:', alpineLoaded);
  
  // Save HTML for inspection
  await require('fs').promises.writeFile('page-content.html', content);
  console.log('\nFull HTML saved to page-content.html');
  
  await browser.close();
})();