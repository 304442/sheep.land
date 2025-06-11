const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔍 Checking BBQ and discount data...\n');

  await page.goto('https://sheep.land', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check BBQ product specifically
  const bbqData = await page.evaluate(async () => {
    const response = await fetch('/api/collections/products/records?filter=item_key~"bbq"||type_name_en~"BBQ"||variant_name_en~"BBQ"');
    const data = await response.json();
    return {
      totalBBQ: data.totalItems,
      items: data.items || []
    };
  });

  console.log('BBQ Products found:', bbqData.totalBBQ);
  if (bbqData.items.length > 0) {
    bbqData.items.forEach(item => {
      console.log(`\n${item.type_name_en} - ${item.variant_name_en || item.item_key}:`);
      console.log(`  Item key: ${item.item_key}`);
      console.log(`  Discount percentage: ${item.discount_percentage}`);
      console.log(`  Base price: ${item.base_price_egp} EGP`);
      console.log(`  Has discount field: ${'discount_percentage' in item}`);
    });
  }

  // Check all products with discounts
  const discountedProducts = await page.evaluate(async () => {
    const response = await fetch('/api/collections/products/records?filter=discount_percentage>0&perPage=100');
    const data = await response.json();
    return {
      total: data.totalItems,
      items: data.items ? data.items.map(item => ({
        name: item.type_name_en,
        variant: item.variant_name_en,
        item_key: item.item_key,
        discount: item.discount_percentage,
        category: item.product_category
      })) : []
    };
  });

  console.log(`\n\nTotal products with discounts: ${discountedProducts.total}`);
  if (discountedProducts.items.length > 0) {
    console.log('\nProducts with discounts:');
    discountedProducts.items.forEach(item => {
      console.log(`- ${item.name} (${item.variant || item.item_key}): ${item.discount}% off [${item.category}]`);
    });
  }

  // Check Alpine.js data loading
  const alpineCheck = await page.evaluate(() => {
    const body = document.body;
    if (body && body.__x && body.__x.$data) {
      const data = body.__x.$data;
      // Check if products are loaded
      let totalProducts = 0;
      let productsWithDiscounts = 0;
      
      Object.keys(data.prodOpts).forEach(category => {
        if (data.prodOpts[category] && Array.isArray(data.prodOpts[category])) {
          data.prodOpts[category].forEach(group => {
            if (group.wps && Array.isArray(group.wps)) {
              group.wps.forEach(product => {
                totalProducts++;
                if (product.discount_percentage > 0) {
                  productsWithDiscounts++;
                }
              });
            }
          });
        }
      });
      
      return {
        initialized: true,
        totalProducts,
        productsWithDiscounts,
        loadState: data.load
      };
    }
    return { initialized: false };
  });

  console.log('\n\nAlpine.js Status:');
  console.log(`Initialized: ${alpineCheck.initialized}`);
  if (alpineCheck.initialized) {
    console.log(`Total products in Alpine: ${alpineCheck.totalProducts}`);
    console.log(`Products with discounts in Alpine: ${alpineCheck.productsWithDiscounts}`);
    console.log(`Loading states:`, alpineCheck.loadState);
  }

  // Check DOM for discount elements
  const domCheck = await page.evaluate(() => {
    const badges = document.querySelectorAll('.sale-badge');
    const visibleBadges = Array.from(badges).filter(badge => 
      window.getComputedStyle(badge).display !== 'none'
    );
    
    const discountPrices = document.querySelectorAll('.price-with-discount');
    
    return {
      totalBadges: badges.length,
      visibleBadges: visibleBadges.length,
      totalDiscountPrices: discountPrices.length,
      firstBadgeText: badges[0]?.textContent || 'none',
      firstBadgeDisplay: badges[0] ? window.getComputedStyle(badges[0]).display : 'none'
    };
  });

  console.log('\n\nDOM Elements:');
  console.log(`Sale badges: ${domCheck.totalBadges} total, ${domCheck.visibleBadges} visible`);
  console.log(`Discount price structures: ${domCheck.totalDiscountPrices}`);
  if (domCheck.totalBadges > 0) {
    console.log(`First badge text: "${domCheck.firstBadgeText}"`);
    console.log(`First badge display: ${domCheck.firstBadgeDisplay}`);
  }

  // Check a specific product card
  const productCardCheck = await page.evaluate(() => {
    const firstCard = document.querySelector('.prod-card');
    if (!firstCard) return null;
    
    // Try to get Alpine data from the card
    let productData = null;
    const cardElement = firstCard;
    if (cardElement && cardElement.__x && cardElement.__x.$data) {
      productData = {
        item_key: cardElement.__x.$data.item?.item_key,
        discount: cardElement.__x.$data.item?.discount_percentage
      };
    }
    
    return {
      productName: firstCard.querySelector('.prod-name')?.textContent,
      badgeExists: !!firstCard.querySelector('.sale-badge'),
      badgeText: firstCard.querySelector('.sale-badge')?.textContent,
      hasDiscountPrice: !!firstCard.querySelector('.price-with-discount'),
      alpineData: productData
    };
  });

  console.log('\n\nFirst Product Card:');
  if (productCardCheck) {
    console.log(`Product: ${productCardCheck.productName}`);
    console.log(`Badge exists: ${productCardCheck.badgeExists}`);
    console.log(`Badge text: ${productCardCheck.badgeText}`);
    console.log(`Has discount price: ${productCardCheck.hasDiscountPrice}`);
    console.log(`Alpine data:`, productCardCheck.alpineData);
  } else {
    console.log('No product cards found');
  }

  await browser.close();
})();