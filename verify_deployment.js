const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Verifying deployment...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Check if app.js has been updated
  const appJsResponse = await page.goto('https://sheep.land/app.js');
  const appJsContent = await appJsResponse.text();
  
  const hasDiscountInMapping = appJsContent.includes('discount_percentage');
  const hasLambChopsImage = appJsContent.includes('lamb-chops-full.jpg');
  
  console.log('App.js checks:');
  console.log(`  Has discount_percentage: ${hasDiscountInMapping ? '✓' : '✗'}`);
  console.log(`  Has lamb-chops-full.jpg: ${hasLambChopsImage ? '✓' : '✗'}`);
  
  // Check if images are accessible
  console.log('\nImage accessibility:');
  const images = [
    'https://sheep.land/images/sheep-meat.jpg',
    'https://sheep.land/images/products/lamb-chops-full.jpg',
    'https://sheep.land/images/products/minced-meat.jpg'
  ];
  
  for (const url of images) {
    const response = await page.goto(url);
    console.log(`  ${url.split('/').pop()}: ${response.status()} ${response.ok() ? '✓' : '✗'}`);
  }
  
  // Check API
  await page.goto('https://sheep.land');
  const apiCheck = await page.evaluate(async () => {
    const response = await fetch('/api/collections/products/records?perPage=1');
    const data = await response.json();
    return {
      status: response.status,
      hasItems: data.items && data.items.length > 0,
      firstItemHasDiscount: data.items && data.items[0] && 'discount_percentage' in data.items[0]
    };
  });
  
  console.log('\nAPI check:');
  console.log(`  Status: ${apiCheck.status}`);
  console.log(`  Has products: ${apiCheck.hasItems ? '✓' : '✗'}`);
  console.log(`  Has discount field: ${apiCheck.firstItemHasDiscount ? '✓' : '✗'}`);
  
  if (!apiCheck.firstItemHasDiscount) {
    console.log('\n⚠️  The discount_percentage field is not in the database.');
    console.log('    Please run setup.html to update the database schema.');
  }
  
  console.log('\n✅ Deployment verification complete.');
  
  await browser.close();
})();