const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔍 Checking discount functionality...\n');

  await page.goto('https://sheep.land', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. Check if discount_percentage exists in database
  const apiCheck = await page.evaluate(async () => {
    const response = await fetch('/api/collections/products/records?perPage=5');
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return {
        hasItems: true,
        firstProduct: {
          name: data.items[0].type_name_en,
          item_key: data.items[0].item_key,
          discount_percentage: data.items[0].discount_percentage,
          hasField: 'discount_percentage' in data.items[0],
          allFields: Object.keys(data.items[0])
        }
      };
    }
    return { hasItems: false };
  });

  console.log('Database Check:');
  if (apiCheck.hasItems) {
    console.log(`Product: ${apiCheck.firstProduct.name}`);
    console.log(`Has discount_percentage field: ${apiCheck.firstProduct.hasField}`);
    console.log(`Discount value: ${apiCheck.firstProduct.discount_percentage}`);
    if (!apiCheck.firstProduct.hasField) {
      console.log('\n⚠️  discount_percentage field is MISSING from database!');
      console.log('Available fields:', apiCheck.firstProduct.allFields.join(', '));
    }
  }

  // 2. Check products with discounts
  const discountedProducts = await page.evaluate(async () => {
    const response = await fetch('/api/collections/products/records?filter=discount_percentage>0&perPage=20');
    const data = await response.json();
    return {
      total: data.totalItems || 0,
      items: data.items ? data.items.slice(0, 5).map(item => ({
        name: item.type_name_en,
        discount: item.discount_percentage,
        category: item.product_category
      })) : []
    };
  });

  console.log(`\nProducts with discounts: ${discountedProducts.total}`);
  if (discountedProducts.items.length > 0) {
    discountedProducts.items.forEach(item => {
      console.log(`- ${item.name}: ${item.discount}% [${item.category}]`);
    });
  }

  // 3. Check Alpine data
  const alpineData = await page.evaluate(() => {
    const body = document.body;
    if (body && body.__x && body.__x.$data) {
      const data = body.__x.$data;
      let sampleProduct = null;
      
      // Find a product with discount
      Object.keys(data.prodOpts).forEach(cat => {
        if (!sampleProduct && data.prodOpts[cat] && Array.isArray(data.prodOpts[cat])) {
          data.prodOpts[cat].forEach(group => {
            if (!sampleProduct && group.wps) {
              const productWithDiscount = group.wps.find(p => p.discount_percentage > 0);
              if (productWithDiscount) {
                sampleProduct = {
                  name: productWithDiscount.type_name_en,
                  discount: productWithDiscount.discount_percentage,
                  category: cat
                };
              }
            }
          });
        }
      });
      
      return {
        initialized: true,
        sampleProduct
      };
    }
    return { initialized: false };
  });

  console.log('\nAlpine Data:');
  console.log(`Initialized: ${alpineData.initialized}`);
  if (alpineData.sampleProduct) {
    console.log(`Sample product with discount: ${alpineData.sampleProduct.name} - ${alpineData.sampleProduct.discount}%`);
  } else {
    console.log('No products with discounts found in Alpine data');
  }

  // 4. Check DOM elements
  const domCheck = await page.evaluate(() => {
    // Find all sale badges
    const badges = document.querySelectorAll('.sale-badge');
    const visibleBadges = [];
    
    badges.forEach(badge => {
      const style = window.getComputedStyle(badge);
      const xShow = badge.getAttribute('x-show');
      const text = badge.textContent.trim();
      
      if (style.display !== 'none' || text !== '-undefined%') {
        const card = badge.closest('.prod-card');
        const productName = card ? card.querySelector('.prod-name')?.textContent : 'Unknown';
        visibleBadges.push({
          productName,
          text,
          display: style.display,
          xShow
        });
      }
    });
    
    return {
      totalBadges: badges.length,
      visibleBadges
    };
  });

  console.log('\nDOM Check:');
  console.log(`Total sale badges in DOM: ${domCheck.totalBadges}`);
  console.log(`Visible badges: ${domCheck.visibleBadges.length}`);
  if (domCheck.visibleBadges.length > 0) {
    domCheck.visibleBadges.forEach(badge => {
      console.log(`- ${badge.productName}: "${badge.text}" (display: ${badge.display}, x-show: ${badge.xShow})`);
    });
  }

  // 5. Check specific elements
  const specificCheck = await page.evaluate(() => {
    const firstCard = document.querySelector('.prod-card');
    if (!firstCard) return null;
    
    const badge = firstCard.querySelector('.sale-badge');
    const priceDiv = firstCard.querySelector('.price-with-discount, .prod-price');
    
    return {
      productName: firstCard.querySelector('.prod-name')?.textContent,
      hasBadge: !!badge,
      badgeXShow: badge?.getAttribute('x-show'),
      badgeText: badge?.textContent,
      priceStructure: priceDiv?.className
    };
  });

  if (specificCheck) {
    console.log('\nFirst Product Card:');
    console.log(`Product: ${specificCheck.productName}`);
    console.log(`Has badge: ${specificCheck.hasBadge}`);
    console.log(`Badge x-show: ${specificCheck.badgeXShow}`);
    console.log(`Badge text: ${specificCheck.badgeText}`);
    console.log(`Price structure: ${specificCheck.priceStructure}`);
  }

  await browser.close();
  
  console.log('\n📌 Summary:');
  if (!apiCheck.firstProduct?.hasField) {
    console.log('❌ The discount_percentage field is missing from the database.');
    console.log('   Run setup.html with "Complete Setup" to add the field.');
  } else if (discountedProducts.total === 0) {
    console.log('⚠️  No products have discount_percentage > 0 in the database.');
    console.log('   Run setup.html to seed products with discounts.');
  } else {
    console.log('✅ Database has discount field and products with discounts.');
    console.log('   Check Alpine/DOM binding for display issues.');
  }
})();