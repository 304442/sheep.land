const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔍 Testing discount features after setup...\n');

  // First, let's go to setup page
  console.log('1. Opening setup page...');
  await page.goto('https://sheep.land/setup.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'setup_page.png' });
  console.log('📸 Setup page screenshot saved\n');

  console.log('⚠️  Please run the Complete Setup on the setup page to add the discount_percentage field!\n');
  console.log('After running setup, press Enter to continue testing...');
  
  // Wait for user to run setup
  await page.waitForTimeout(30000); // Give 30 seconds to run setup
  
  // Now test the main site
  console.log('\n2. Testing main site after setup...');
  await page.goto('https://sheep.land', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Check if products are loading
  const productCount = await page.evaluate(() => {
    return document.querySelectorAll('.prod-card').length;
  });

  console.log(`Found ${productCount} product cards\n`);

  // Check API for discount field
  const apiCheck = await page.evaluate(async () => {
    const response = await fetch('/api/collections/products/records?perPage=3&filter=discount_percentage>0');
    const data = await response.json();
    return {
      status: response.status,
      totalDiscountedProducts: data.totalItems || 0,
      products: data.items ? data.items.map(item => ({
        name: item.type_name_en,
        discount: item.discount_percentage,
        originalPrice: item.base_price_egp,
        salePrice: item.base_price_egp * (1 - (item.discount_percentage || 0) / 100)
      })) : []
    };
  });

  console.log('Products with discounts:');
  console.log(`Total discounted products: ${apiCheck.totalDiscountedProducts}`);
  apiCheck.products.forEach(prod => {
    console.log(`\n${prod.name}:`);
    console.log(`  Discount: ${prod.discount}%`);
    console.log(`  Original: ${prod.originalPrice} EGP`);
    console.log(`  Sale: ${prod.salePrice} EGP`);
  });

  // Check visible discount badges
  const badges = await page.evaluate(() => {
    const badges = Array.from(document.querySelectorAll('.sale-badge'));
    return badges.filter(badge => {
      const style = window.getComputedStyle(badge);
      return style.display !== 'none' && badge.textContent.includes('%');
    }).slice(0, 5).map(badge => {
      const prodCard = badge.closest('.prod-card');
      const prodName = prodCard?.querySelector('.prod-name')?.textContent?.trim();
      return {
        productName: prodName || 'Unknown',
        badgeText: badge.textContent.trim(),
        visible: true
      };
    });
  });

  console.log('\n\nVisible Sale Badges:');
  if (badges.length === 0) {
    console.log('No visible sale badges found');
  } else {
    badges.forEach((badge, i) => {
      console.log(`${i + 1}. ${badge.productName}: ${badge.badgeText}`);
    });
  }

  // Check strikethrough prices
  const prices = await page.evaluate(() => {
    const priceElements = Array.from(document.querySelectorAll('.price-with-discount'));
    return priceElements.slice(0, 5).map(priceEl => {
      const prodCard = priceEl.closest('.prod-card');
      const prodName = prodCard?.querySelector('.prod-name')?.textContent?.trim();
      const originalPrice = priceEl.querySelector('.original-price');
      const salePrice = priceEl.querySelector('.sale-price');
      
      return {
        productName: prodName || 'Unknown',
        originalPrice: originalPrice?.textContent || 'N/A',
        salePrice: salePrice?.textContent || 'N/A',
        hasStrikethrough: originalPrice ? window.getComputedStyle(originalPrice).textDecoration.includes('line-through') : false
      };
    });
  });

  console.log('\n\nPrice Displays with Strikethrough:');
  if (prices.length === 0) {
    console.log('No discount prices found');
  } else {
    prices.forEach((price, i) => {
      console.log(`${i + 1}. ${price.productName}:`);
      console.log(`   Original: ${price.originalPrice} (strikethrough: ${price.hasStrikethrough})`);
      console.log(`   Sale: ${price.salePrice}`);
    });
  }

  // Take screenshots
  await page.screenshot({ path: 'discount_working.png', fullPage: false });
  console.log('\n📸 Screenshot saved as discount_working.png');

  // Scroll to Fresh Meat section
  await page.evaluate(() => {
    const section = document.querySelector('#fresh-meat');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'meat_discounts.png', fullPage: false });
  console.log('📸 Meat section saved as meat_discounts.png');

  await browser.close();
  
  console.log('\n✅ Testing complete!');
})();