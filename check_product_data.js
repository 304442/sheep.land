const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔍 Checking product data in Alpine component...\n');

  await page.goto('https://sheep.land', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Get product data from Alpine component
  const productData = await page.evaluate(() => {
    const body = document.body;
    const data = Alpine.$data(body);
    
    if (!data) return { error: 'No Alpine data' };
    
    const productCounts = {};
    let totalProducts = 0;
    let productsWithDiscounts = 0;
    
    Object.keys(data.prodOpts).forEach(category => {
      productCounts[category] = 0;
      if (Array.isArray(data.prodOpts[category])) {
        data.prodOpts[category].forEach(group => {
          if (group.wps && Array.isArray(group.wps)) {
            productCounts[category] += group.wps.length;
            totalProducts += group.wps.length;
            
            group.wps.forEach(product => {
              if (product.discount_percentage > 0) {
                productsWithDiscounts++;
              }
            });
          }
        });
      }
    });
    
    // Get sample products with discounts
    const sampleDiscounts = [];
    if (data.prodOpts.gathering_package) {
      data.prodOpts.gathering_package.forEach(group => {
        if (group.wps) {
          group.wps.forEach(product => {
            if (product.discount_percentage > 0) {
              sampleDiscounts.push({
                name: product.type_name_en,
                discount: product.discount_percentage,
                item_key: product.item_key
              });
            }
          });
        }
      });
    }
    
    return {
      loadingStates: data.load,
      productCounts,
      totalProducts,
      productsWithDiscounts,
      sampleDiscounts,
      setupRequired: data.setupRequired,
      apiErr: data.apiErr
    };
  });

  console.log('Product Data in Alpine:');
  console.log(JSON.stringify(productData, null, 2));

  // Try to manually call initApp
  console.log('\nManually calling initApp()...');
  const initResult = await page.evaluate(async () => {
    try {
      const body = document.body;
      const data = Alpine.$data(body);
      
      if (data && typeof data.initApp === 'function') {
        await data.initApp();
        return { success: true, message: 'initApp called' };
      } else {
        return { success: false, message: 'initApp not found' };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  console.log('Init result:', initResult);

  // Wait for potential data loading
  await page.waitForTimeout(3000);

  // Check again after init
  const afterInit = await page.evaluate(() => {
    const body = document.body;
    const data = Alpine.$data(body);
    
    let totalProducts = 0;
    Object.keys(data.prodOpts).forEach(category => {
      if (Array.isArray(data.prodOpts[category])) {
        data.prodOpts[category].forEach(group => {
          if (group.wps) totalProducts += group.wps.length;
        });
      }
    });
    
    return {
      loadingStates: data.load,
      totalProducts,
      currentPage: data.currentPage,
      setupRequired: data.setupRequired
    };
  });

  console.log('\nAfter manual init:');
  console.log(JSON.stringify(afterInit, null, 2));

  // Check visible products
  const visibleProducts = await page.evaluate(() => {
    return document.querySelectorAll('.prod-card').length;
  });

  console.log(`\nVisible product cards: ${visibleProducts}`);

  await browser.close();
})();