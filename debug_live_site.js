const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔍 Debugging live site product display...\n');

  await page.goto('https://sheep.land', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Check if products are loading
  const productCount = await page.evaluate(() => {
    return document.querySelectorAll('.prod-card').length;
  });

  console.log(`Found ${productCount} product cards on the page\n`);

  // Check Alpine.js data
  const alpineData = await page.evaluate(() => {
    const app = document.querySelector('[x-data]');
    if (app && app.__x && app.__x.$data) {
      const data = app.__x.$data;
      return {
        hasMeatCuts: !!data.prodOpts.meat_cuts,
        meatCutsLength: data.prodOpts.meat_cuts ? data.prodOpts.meat_cuts.length : 0,
        firstMeatCut: data.prodOpts.meat_cuts && data.prodOpts.meat_cuts[0] ? {
          name: data.prodOpts.meat_cuts[0].name,
          hasProducts: !!data.prodOpts.meat_cuts[0].wps,
          productCount: data.prodOpts.meat_cuts[0].wps ? data.prodOpts.meat_cuts[0].wps.length : 0
        } : null
      };
    }
    return null;
  });

  console.log('Alpine.js data structure:');
  console.log(JSON.stringify(alpineData, null, 2));

  // Check specific product images
  const productImages = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('.prod-img')).slice(0, 5);
    return images.map(img => ({
      src: img.src,
      alt: img.alt,
      loaded: img.complete && img.naturalWidth > 0,
      naturalDimensions: `${img.naturalWidth}x${img.naturalHeight}`,
      displayed: window.getComputedStyle(img).display !== 'none',
      parent: img.closest('.prod-card')?.querySelector('.prod-name')?.textContent?.trim() || 'Unknown'
    }));
  });

  console.log('\nProduct images:');
  productImages.forEach((img, i) => {
    console.log(`\nImage ${i + 1} (${img.parent}):`);
    console.log(`  URL: ${img.src}`);
    console.log(`  Loaded: ${img.loaded}`);
    console.log(`  Dimensions: ${img.naturalDimensions}`);
    console.log(`  Displayed: ${img.displayed}`);
  });

  // Check discount badges
  const discountBadges = await page.evaluate(() => {
    const badges = document.querySelectorAll('.sale-badge');
    return Array.from(badges).slice(0, 5).map(badge => ({
      visible: window.getComputedStyle(badge).display !== 'none',
      text: badge.textContent.trim(),
      parent: badge.closest('.prod-card')?.querySelector('.prod-name')?.textContent?.trim() || 'Unknown'
    }));
  });

  console.log('\nDiscount badges:');
  if (discountBadges.length === 0) {
    console.log('No discount badges found');
  } else {
    discountBadges.forEach((badge, i) => {
      console.log(`Badge ${i + 1} (${badge.parent}): ${badge.text} - Visible: ${badge.visible}`);
    });
  }

  // Check network requests for images
  const failedImages = [];
  page.on('response', response => {
    if (response.url().includes('/images/') && !response.ok()) {
      failedImages.push({
        url: response.url(),
        status: response.status()
      });
    }
  });

  // Reload to catch any failed image loads
  await page.reload({ waitUntil: 'networkidle' });
  
  if (failedImages.length > 0) {
    console.log('\nFailed image loads:');
    failedImages.forEach(img => {
      console.log(`  ${img.url} - Status: ${img.status}`);
    });
  }

  // Take a screenshot
  await page.screenshot({ path: 'live_site_debug.png', fullPage: false });
  console.log('\nScreenshot saved as live_site_debug.png');

  await browser.close();
})();