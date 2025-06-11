const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔍 Checking live site issues...\n');

  await page.goto('https://sheep.land', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check image URLs being used
  const imageData = await page.evaluate(() => {
    const images = document.querySelectorAll('.prod-img');
    return Array.from(images).slice(0, 5).map(img => ({
      src: img.src,
      loaded: img.complete && img.naturalWidth > 0,
      display: window.getComputedStyle(img).display,
      parent: img.parentElement.className
    }));
  });

  console.log('Image URLs being used:');
  imageData.forEach((img, i) => {
    console.log(`\nImage ${i + 1}:`);
    console.log(`  URL: ${img.src}`);
    console.log(`  Loaded: ${img.loaded ? 'Yes' : 'No'}`);
  });

  // Check product data structure
  const productData = await page.evaluate(() => {
    const app = document.querySelector('[x-data]');
    if (app && app.__x) {
      const data = app.__x.$data;
      
      // Check first meat product
      if (data.prodOpts.meat_cuts && data.prodOpts.meat_cuts[0] && data.prodOpts.meat_cuts[0].wps) {
        const firstProduct = data.prodOpts.meat_cuts[0].wps[0];
        return {
          itemKey: firstProduct.itemKey || firstProduct.item_key,
          hasDiscount: 'discount_percentage' in firstProduct,
          discountValue: firstProduct.discount_percentage,
          price: firstProduct.priceEGP || firstProduct.base_price_egp,
          image: firstProduct.image
        };
      }
    }
    return null;
  });

  console.log('\nFirst meat product data:');
  console.log(productData);

  // Check actual API response
  const apiResponse = await page.evaluate(async () => {
    const response = await fetch('/api/collections/products/records?perPage=5&filter=product_category="meat_cuts"');
    const data = await response.json();
    if (data.items && data.items[0]) {
      return {
        item_key: data.items[0].item_key,
        discount_percentage: data.items[0].discount_percentage,
        fields: Object.keys(data.items[0])
      };
    }
    return null;
  });

  console.log('\nAPI Response sample:');
  console.log(apiResponse);

  // Check if our image files exist
  console.log('\nChecking our product images:');
  const imageUrls = [
    'https://sheep.land/images/products/lamb-chops-full.jpg',
    'https://sheep.land/images/products/minced-meat.jpg',
    'https://sheep.land/images/products/meat-banner.png'
  ];

  for (const url of imageUrls) {
    try {
      const response = await page.goto(url);
      console.log(`${url.split('/').pop()}: ${response.status()} ${response.ok() ? '✓' : '✗'}`);
    } catch (e) {
      console.log(`${url.split('/').pop()}: Failed to load`);
    }
  }

  await page.goto('https://sheep.land'); // Go back to main page

  await browser.close();
})();