const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔍 Checking API directly...\n');

  await page.goto('https://sheep.land', { waitUntil: 'networkidle' });

  // Check API endpoints directly
  const endpoints = [
    '/api/collections/products/records?perPage=100&filter=product_category="udheya"',
    '/api/collections/products/records?perPage=100&filter=product_category="meat_cuts"',
    '/api/collections/products/records?perPage=100&filter=product_category="ready_to_eat"',
    '/api/collections/site_settings/records'
  ];

  for (const endpoint of endpoints) {
    console.log(`\nChecking ${endpoint}:`);
    try {
      const response = await page.evaluate(async (url) => {
        const resp = await fetch(url);
        const data = await resp.json();
        return {
          ok: resp.ok,
          status: resp.status,
          itemCount: data.items ? data.items.length : 0,
          totalItems: data.totalItems,
          firstItem: data.items && data.items[0] ? {
            item_key: data.items[0].item_key,
            type_name_en: data.items[0].type_name_en,
            discount_percentage: data.items[0].discount_percentage,
            priceEGP: data.items[0].base_price_egp
          } : null
        };
      }, endpoint);
      
      console.log(`  Status: ${response.status} ${response.ok ? '✓' : '✗'}`);
      console.log(`  Items: ${response.itemCount} of ${response.totalItems}`);
      if (response.firstItem) {
        console.log(`  First item: ${response.firstItem.type_name_en} (${response.firstItem.item_key})`);
        console.log(`  Discount: ${response.firstItem.discount_percentage}%`);
        console.log(`  Price: ${response.firstItem.priceEGP} EGP`);
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }

  // Check console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.reload({ waitUntil: 'networkidle' });
  
  if (consoleErrors.length > 0) {
    console.log('\n\nConsole errors:');
    consoleErrors.forEach(err => console.log(`  - ${err}`));
  }

  await browser.close();
})();