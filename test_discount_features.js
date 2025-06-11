const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔍 Testing discount features on live site...\n');

  await page.goto('https://sheep.land', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Check if products are loading now
  const productCount = await page.evaluate(() => {
    return document.querySelectorAll('.prod-card').length;
  });

  console.log(`Found ${productCount} product cards\n`);

  if (productCount === 0) {
    console.log('❌ No products loaded. Checking API...');
    
    const apiStatus = await page.evaluate(async () => {
      const response = await fetch('/api/collections/products/records?perPage=5');
      const data = await response.json();
      return {
        status: response.status,
        itemCount: data.items ? data.items.length : 0,
        firstItem: data.items && data.items[0] ? {
          item_key: data.items[0].item_key,
          type_name_en: data.items[0].type_name_en,
          discount_percentage: data.items[0].discount_percentage,
          base_price_egp: data.items[0].base_price_egp
        } : null
      };
    });
    
    console.log('API Status:', apiStatus);
    
    if (apiStatus.firstItem && apiStatus.firstItem.discount_percentage === undefined) {
      console.log('\n⚠️  The discount_percentage field is not in the database.');
      console.log('Please run setup.html to update the database schema.\n');
    }
  }

  // Check discount badges
  const badges = await page.evaluate(() => {
    const badges = Array.from(document.querySelectorAll('.sale-badge'));
    return badges.slice(0, 5).map(badge => {
      const prodCard = badge.closest('.prod-card');
      const prodName = prodCard?.querySelector('.prod-name')?.textContent?.trim();
      const isVisible = window.getComputedStyle(badge).display !== 'none';
      const badgeText = badge.textContent.trim();
      
      // Get Alpine data if available
      let discountValue = 'N/A';
      if (prodCard && prodCard.__x && prodCard.__x.$data) {
        discountValue = prodCard.__x.$data.item?.discount_percentage || 'undefined';
      }
      
      return {
        productName: prodName || 'Unknown',
        badgeText: badgeText,
        isVisible: isVisible,
        discountValue: discountValue,
        backgroundColor: window.getComputedStyle(badge).backgroundColor,
        position: window.getComputedStyle(badge).position
      };
    });
  });

  console.log('Sale Badges:');
  if (badges.length === 0) {
    console.log('No sale badges found\n');
  } else {
    badges.forEach((badge, i) => {
      console.log(`\nBadge ${i + 1} (${badge.productName}):`);
      console.log(`  Text: ${badge.badgeText}`);
      console.log(`  Visible: ${badge.isVisible}`);
      console.log(`  Discount value: ${badge.discountValue}`);
      console.log(`  Background: ${badge.backgroundColor}`);
      console.log(`  Position: ${badge.position}`);
    });
  }

  // Check price display with strikethrough
  const prices = await page.evaluate(() => {
    const priceElements = Array.from(document.querySelectorAll('.price-with-discount, .prod-price'));
    return priceElements.slice(0, 5).map(priceEl => {
      const prodCard = priceEl.closest('.prod-card');
      const prodName = prodCard?.querySelector('.prod-name')?.textContent?.trim();
      
      const originalPrice = priceEl.querySelector('.original-price');
      const salePrice = priceEl.querySelector('.sale-price');
      
      return {
        productName: prodName || 'Unknown',
        hasDiscountStructure: !!(originalPrice && salePrice),
        originalPriceText: originalPrice?.textContent || 'N/A',
        salePriceText: salePrice?.textContent || 'N/A',
        originalPriceStyle: originalPrice ? {
          textDecoration: window.getComputedStyle(originalPrice).textDecoration,
          color: window.getComputedStyle(originalPrice).color,
          opacity: window.getComputedStyle(originalPrice).opacity
        } : null,
        salePriceStyle: salePrice ? {
          color: window.getComputedStyle(salePrice).color,
          fontWeight: window.getComputedStyle(salePrice).fontWeight
        } : null
      };
    });
  });

  console.log('\n\nPrice Displays:');
  prices.forEach((price, i) => {
    console.log(`\nPrice ${i + 1} (${price.productName}):`);
    console.log(`  Has discount structure: ${price.hasDiscountStructure}`);
    if (price.hasDiscountStructure) {
      console.log(`  Original price: ${price.originalPriceText}`);
      console.log(`  Sale price: ${price.salePriceText}`);
      if (price.originalPriceStyle) {
        console.log(`  Original price style:`);
        console.log(`    Text decoration: ${price.originalPriceStyle.textDecoration}`);
        console.log(`    Color: ${price.originalPriceStyle.color}`);
        console.log(`    Opacity: ${price.originalPriceStyle.opacity}`);
      }
      if (price.salePriceStyle) {
        console.log(`  Sale price style:`);
        console.log(`    Color: ${price.salePriceStyle.color}`);
        console.log(`    Font weight: ${price.salePriceStyle.fontWeight}`);
      }
    }
  });

  // Check product images
  const images = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('.prod-img'));
    return imgs.slice(0, 3).map(img => ({
      src: img.src,
      loaded: img.complete && img.naturalWidth > 0,
      displayed: window.getComputedStyle(img).display !== 'none'
    }));
  });

  console.log('\n\nProduct Images:');
  images.forEach((img, i) => {
    console.log(`Image ${i + 1}: ${img.src.split('/').pop()} - Loaded: ${img.loaded}, Displayed: ${img.displayed}`);
  });

  // Take a screenshot
  await page.screenshot({ path: 'discount_test_screenshot.png', fullPage: false });
  console.log('\n📸 Screenshot saved as discount_test_screenshot.png');

  // Scroll to Fresh Meat section
  await page.evaluate(() => {
    const meatSection = document.querySelector('#fresh-meat');
    if (meatSection) {
      meatSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'meat_section_screenshot.png', fullPage: false });
  console.log('📸 Meat section screenshot saved as meat_section_screenshot.png');

  await browser.close();
})();