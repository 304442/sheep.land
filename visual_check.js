const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔍 Visual check of the site...\n');

  await page.goto('https://sheep.land', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: 'current_state.png', fullPage: false });
  console.log('📸 Screenshot saved as current_state.png');

  // Scroll to different sections
  await page.evaluate(() => {
    // Find Events & Catering section
    const section = document.querySelector('#events-catering');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'events_section.png', fullPage: false });
  console.log('📸 Events section saved as events_section.png');

  // Check what sections are visible
  const visibleSections = await page.evaluate(() => {
    const sections = ['sacrifices', 'fresh-meat', 'events-catering'];
    const visible = [];
    
    sections.forEach(id => {
      const section = document.getElementById(id);
      if (section) {
        const products = section.querySelectorAll('.prod-card');
        visible.push({
          id,
          exists: true,
          productCount: products.length,
          firstProduct: products[0]?.querySelector('.prod-name')?.textContent || null
        });
      } else {
        visible.push({ id, exists: false });
      }
    });
    
    return visible;
  });

  console.log('\nVisible sections:');
  visibleSections.forEach(section => {
    if (section.exists) {
      console.log(`- ${section.id}: ${section.productCount} products`);
      if (section.firstProduct) {
        console.log(`  First: ${section.firstProduct}`);
      }
    } else {
      console.log(`- ${section.id}: NOT FOUND`);
    }
  });

  // Check for any visible discount badges
  const visibleDiscounts = await page.evaluate(() => {
    const badges = Array.from(document.querySelectorAll('.sale-badge'));
    return badges.filter(badge => {
      const style = window.getComputedStyle(badge);
      return style.display !== 'none' && badge.textContent.trim() !== '-undefined%';
    }).map(badge => {
      const card = badge.closest('.prod-card');
      return {
        product: card?.querySelector('.prod-name')?.textContent || 'Unknown',
        badgeText: badge.textContent.trim()
      };
    });
  });

  console.log('\nVisible discount badges:', visibleDiscounts.length);
  visibleDiscounts.forEach(d => {
    console.log(`- ${d.product}: ${d.badgeText}`);
  });

  // Check if Alpine is working on products
  const alpineWorking = await page.evaluate(() => {
    const cards = document.querySelectorAll('.prod-card');
    let boundCount = 0;
    let unboundCount = 0;
    
    cards.forEach(card => {
      if (card.__x) boundCount++;
      else unboundCount++;
    });
    
    return { boundCount, unboundCount, total: cards.length };
  });

  console.log('\nAlpine binding on product cards:');
  console.log(`Total cards: ${alpineWorking.total}`);
  console.log(`Bound to Alpine: ${alpineWorking.boundCount}`);
  console.log(`Not bound: ${alpineWorking.unboundCount}`);

  await browser.close();
})();