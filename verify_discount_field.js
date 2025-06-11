const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Verifying discount_percentage field in database...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://sheep.land');
  
  // Check a specific product
  const fieldCheck = await page.evaluate(async () => {
    const response = await fetch('/api/collections/products/records?perPage=1');
    const data = await response.json();
    
    if (data.items && data.items[0]) {
      const product = data.items[0];
      return {
        productName: product.type_name_en,
        allFields: Object.keys(product).sort(),
        hasDiscountField: 'discount_percentage' in product,
        discountValue: product.discount_percentage
      };
    }
    return null;
  });
  
  if (fieldCheck) {
    console.log(`Sample product: ${fieldCheck.productName}`);
    console.log(`Has discount_percentage field: ${fieldCheck.hasDiscountField ? '✅ YES' : '❌ NO'}`);
    
    if (!fieldCheck.hasDiscountField) {
      console.log('\n⚠️  The discount_percentage field is MISSING from the database!');
      console.log('\n📝 To fix this:');
      console.log('1. Go to https://sheep.land/setup.html');
      console.log('2. Enter your admin email and password');
      console.log('3. Click "🚀 Complete Setup" to add the field and seed data');
      console.log('   OR');
      console.log('3. Click "📋 Schema Only" to just add the field without changing data');
      console.log('\nAfter setup, the discounts will appear!');
    } else {
      console.log(`Discount value: ${fieldCheck.discountValue}%`);
    }
    
    console.log('\nAll database fields:');
    console.log(fieldCheck.allFields.join(', '));
  }
  
  await browser.close();
})();