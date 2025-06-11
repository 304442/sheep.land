const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔍 Debugging discount display...\n');

  await page.goto('https://sheep.land', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Check product data from API
  const apiData = await page.evaluate(async () => {
    const response = await fetch('/api/collections/products/records?perPage=10');
    const data = await response.json();
    return {
      totalProducts: data.totalItems,
      products: data.items ? data.items.slice(0, 5).map(item => ({
        item_key: item.item_key,
        name: item.type_name_en,
        discount_percentage: item.discount_percentage,
        hasDiscountField: 'discount_percentage' in item,
        price: item.base_price_egp
      })) : []
    };
  });

  console.log('API Product Data:');
  console.log(`Total products: ${apiData.totalProducts}\n`);
  apiData.products.forEach(prod => {
    console.log(`${prod.name} (${prod.item_key}):`);
    console.log(`  Has discount field: ${prod.hasDiscountField}`);
    console.log(`  Discount value: ${prod.discount_percentage}`);
    console.log(`  Price: ${prod.price} EGP\n`);
  });

  // Check Alpine.js data
  const alpineData = await page.evaluate(() => {
    const body = document.body;
    if (body && body.__x && body.__x.$data && body.__x.$data.prodOpts) {
      // Get first product from meat_cuts
      const meatCuts = body.__x.$data.prodOpts.meat_cuts;
      if (meatCuts && meatCuts[0] && meatCuts[0].wps && meatCuts[0].wps[0]) {
        const firstProduct = meatCuts[0].wps[0];
        return {
          hasAlpineData: true,
          product: {
            item_key: firstProduct.item_key,
            name: firstProduct.type_name_en,
            discount_percentage: firstProduct.discount_percentage,
            hasDiscountField: 'discount_percentage' in firstProduct,
            priceEGP: firstProduct.priceEGP,
            allFields: Object.keys(firstProduct)
          }
        };
      }
    }
    return { hasAlpineData: false };
  });

  console.log('\nAlpine.js Product Data:');
  if (alpineData.hasAlpineData) {
    console.log(`${alpineData.product.name}:`);
    console.log(`  Has discount field: ${alpineData.product.hasDiscountField}`);
    console.log(`  Discount value: ${alpineData.product.discount_percentage}`);
    console.log(`  Price: ${alpineData.product.priceEGP} EGP`);
    console.log(`  All fields: ${alpineData.product.allFields.join(', ')}`);
  } else {
    console.log('No Alpine data found');
  }

  // Check DOM elements
  const domCheck = await page.evaluate(() => {
    const firstCard = document.querySelector('.prod-card');
    if (!firstCard) return { hasCard: false };

    const badge = firstCard.querySelector('.sale-badge');
    const priceDiv = firstCard.querySelector('.price-with-discount');
    const normalPrice = firstCard.querySelector('.prod-price');
    
    return {
      hasCard: true,
      badge: badge ? {
        exists: true,
        text: badge.textContent,
        display: window.getComputedStyle(badge).display,
        xShowAttribute: badge.getAttribute('x-show')
      } : { exists: false },
      discountPrice: priceDiv ? {
        exists: true,
        originalPrice: priceDiv.querySelector('.original-price')?.textContent,
        salePrice: priceDiv.querySelector('.sale-price')?.textContent,
        xIfAttribute: priceDiv.closest('[x-if]')?.getAttribute('x-if')
      } : { exists: false },
      normalPriceExists: !!normalPrice
    };
  });

  console.log('\n\nDOM Elements Check:');
  console.log('First product card:', domCheck.hasCard ? 'Found' : 'Not found');
  if (domCheck.hasCard) {
    console.log('\nSale badge:');
    console.log(`  Exists: ${domCheck.badge.exists}`);
    if (domCheck.badge.exists) {
      console.log(`  Text: "${domCheck.badge.text}"`);
      console.log(`  Display: ${domCheck.badge.display}`);
      console.log(`  x-show: ${domCheck.badge.xShowAttribute}`);
    }
    
    console.log('\nDiscount price structure:');
    console.log(`  Exists: ${domCheck.discountPrice.exists}`);
    if (domCheck.discountPrice.exists) {
      console.log(`  Original price: ${domCheck.discountPrice.originalPrice}`);
      console.log(`  Sale price: ${domCheck.discountPrice.salePrice}`);
      console.log(`  x-if: ${domCheck.discountPrice.xIfAttribute}`);
    }
    
    console.log(`\nNormal price element exists: ${domCheck.normalPriceExists}`);
  }

  // Check specific products with known discounts
  console.log('\n\nChecking products that should have discounts:');
  const discountedProducts = await page.evaluate(async () => {
    const response = await fetch('/api/collections/products/records?filter=item_key="baladi_udheya_40kg" || item_key="barki_udheya_37kg" || item_key="lamb_chops_premium"');
    const data = await response.json();
    return data.items || [];
  });

  discountedProducts.forEach(prod => {
    console.log(`\n${prod.type_name_en} (${prod.item_key}):`);
    console.log(`  Discount percentage: ${prod.discount_percentage}`);
    console.log(`  Expected in seed data: ${prod.item_key === 'baladi_udheya_40kg' ? '20%' : prod.item_key === 'barki_udheya_37kg' ? '15%' : prod.item_key === 'lamb_chops_premium' ? '25%' : 'Unknown'}`);
  });

  // Take a screenshot
  await page.screenshot({ path: 'discount_debug.png', fullPage: false });
  console.log('\n📸 Debug screenshot saved as discount_debug.png');

  await browser.close();
})();