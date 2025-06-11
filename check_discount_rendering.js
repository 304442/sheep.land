const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔍 Checking discount rendering...\n');

  await page.goto('https://sheep.land', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Check a specific product with known discount
  const bbqCheck = await page.evaluate(() => {
    // Find BBQ product card
    const cards = Array.from(document.querySelectorAll('.prod-card'));
    const bbqCard = cards.find(card => {
      const name = card.querySelector('.prod-name')?.textContent || '';
      return name.includes('BBQ') || name.includes('Grill');
    });
    
    if (!bbqCard) return { found: false };
    
    const badge = bbqCard.querySelector('.sale-badge');
    const priceDiv = bbqCard.querySelector('.prod-price');
    
    // Check Alpine data on the element
    let alpineData = null;
    if (bbqCard.__x && bbqCard.__x.$data) {
      alpineData = {
        hasData: true,
        item: bbqCard.__x.$data.item ? {
          name: bbqCard.__x.$data.item.type_name_en,
          discount: bbqCard.__x.$data.item.discount_percentage
        } : null
      };
    }
    
    return {
      found: true,
      productName: bbqCard.querySelector('.prod-name')?.textContent,
      badge: {
        exists: !!badge,
        text: badge?.textContent?.trim(),
        xShow: badge?.getAttribute('x-show'),
        computedDisplay: badge ? window.getComputedStyle(badge).display : null
      },
      price: {
        text: priceDiv?.textContent,
        hasDiscountStructure: !!bbqCard.querySelector('.price-with-discount')
      },
      alpineData
    };
  });

  console.log('BBQ Product Check:');
  if (bbqCheck.found) {
    console.log(`Product: ${bbqCheck.productName}`);
    console.log(`\nBadge:`);
    console.log(`  Exists: ${bbqCheck.badge.exists}`);
    console.log(`  Text: "${bbqCheck.badge.text}"`);
    console.log(`  x-show attribute: ${bbqCheck.badge.xShow}`);
    console.log(`  Display style: ${bbqCheck.badge.computedDisplay}`);
    console.log(`\nPrice:`);
    console.log(`  Text: ${bbqCheck.price.text}`);
    console.log(`  Has discount structure: ${bbqCheck.price.hasDiscountStructure}`);
    console.log(`\nAlpine data:`, bbqCheck.alpineData);
  } else {
    console.log('BBQ product not found');
  }

  // Check the actual DOM structure
  const domStructure = await page.evaluate(() => {
    const firstCard = document.querySelector('.prod-card');
    if (!firstCard) return null;
    
    // Get the template structure
    const templates = Array.from(firstCard.querySelectorAll('template'));
    const hasXIf = templates.some(t => t.hasAttribute('x-if'));
    
    return {
      cardHTML: firstCard.innerHTML.substring(0, 500),
      hasTemplates: templates.length > 0,
      hasXIf,
      templateCount: templates.length
    };
  });

  console.log('\n\nDOM Structure:');
  if (domStructure) {
    console.log(`Has templates: ${domStructure.hasTemplates}`);
    console.log(`Has x-if: ${domStructure.hasXIf}`);
    console.log(`Template count: ${domStructure.templateCount}`);
    console.log(`\nFirst 500 chars of card HTML:`);
    console.log(domStructure.cardHTML);
  }

  // Check if the issue is with the data binding
  const dataBinding = await page.evaluate(() => {
    // Try to get Alpine component data
    const body = document.body;
    if (body && body.__x && body.__x.$data) {
      const data = body.__x.$data;
      // Check if products have discount_percentage
      let sampleProducts = [];
      
      if (data.prodOpts && data.prodOpts.gathering_package) {
        data.prodOpts.gathering_package.forEach(group => {
          if (group.wps) {
            group.wps.forEach(product => {
              if (product.item_key && product.item_key.includes('bbq')) {
                sampleProducts.push({
                  item_key: product.item_key,
                  name: product.type_name_en,
                  discount_percentage: product.discount_percentage,
                  priceEGP: product.priceEGP
                });
              }
            });
          }
        });
      }
      
      return {
        hasData: true,
        bbqProducts: sampleProducts
      };
    }
    
    return { hasData: false };
  });

  console.log('\n\nData Binding Check:');
  console.log(JSON.stringify(dataBinding, null, 2));

  await browser.close();
})();