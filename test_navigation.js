// Test script to verify navigation functionality
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the site
    await page.goto('http://localhost:8080');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Test desktop navigation
    console.log('Testing desktop navigation...');
    
    // Click on Sacrifices
    await page.click('a[href="#sacrifices"]');
    await page.waitForTimeout(1000);
    
    // Check if scrolled to sacrifices section
    const sacrificesVisible = await page.isVisible('#sacrifices');
    console.log('Sacrifices section visible:', sacrificesVisible);
    
    // Click on Fresh Meat
    await page.click('a[href="#fresh-meat"]');
    await page.waitForTimeout(1000);
    
    // Check if scrolled to fresh meat section
    const freshMeatVisible = await page.isVisible('#fresh-meat');
    console.log('Fresh Meat section visible:', freshMeatVisible);
    
    // Click on Events & Catering
    await page.click('a[href="#events-catering"]');
    await page.waitForTimeout(1000);
    
    // Check if scrolled to events section
    const eventsVisible = await page.isVisible('#events-catering');
    console.log('Events & Catering section visible:', eventsVisible);
    
    // Test mobile navigation
    console.log('\nTesting mobile navigation...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Open mobile menu
    await page.click('.menu-btn');
    await page.waitForTimeout(500);
    
    // Click on mobile navigation links
    await page.click('.nav-list-mob a[href="#sacrifices"]');
    await page.waitForTimeout(1000);
    console.log('Mobile Sacrifices navigation tested');
    
    await page.click('.menu-btn');
    await page.waitForTimeout(500);
    await page.click('.nav-list-mob a[href="#fresh-meat"]');
    await page.waitForTimeout(1000);
    console.log('Mobile Fresh Meat navigation tested');
    
    await page.click('.menu-btn');
    await page.waitForTimeout(500);
    await page.click('.nav-list-mob a[href="#events-catering"]');
    await page.waitForTimeout(1000);
    console.log('Mobile Events & Catering navigation tested');
    
    console.log('\nAll navigation tests completed!');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
})();