import { test, expect } from '@playwright/test';

test.describe('Critical User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage and display products', async ({ page }) => {
    // Check page loads
    await expect(page).toHaveTitle(/Sheep Land/);
    
    // Check main sections are visible
    await expect(page.locator('text=Udheya')).toBeVisible();
    await expect(page.locator('text=Live Sheep')).toBeVisible();
    
    // Check products load
    await page.waitForSelector('.product-card', { timeout: 10000 });
    const products = await page.locator('.product-card').count();
    expect(products).toBeGreaterThan(0);
  });

  test('should add product to cart', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('.product-card');
    
    // Click first add to cart button
    await page.locator('.add-to-cart-btn').first().click();
    
    // Check cart count updates
    await expect(page.locator('.cart-count')).toHaveText('1');
    
    // Open cart
    await page.locator('.cart-icon').click();
    
    // Verify item in cart
    await expect(page.locator('.cart-item')).toHaveCount(1);
  });

  test('should complete checkout flow', async ({ page }) => {
    // Add item to cart
    await page.waitForSelector('.product-card');
    await page.locator('.add-to-cart-btn').first().click();
    
    // Go to checkout
    await page.locator('text=Checkout').click();
    
    // Fill checkout form
    await page.fill('input[name="customer_name"]', 'Test Customer');
    await page.fill('input[name="customer_phone"]', '+201234567890');
    await page.fill('input[name="customer_email"]', 'test@example.com');
    
    // Select payment method
    await page.locator('input[value="cod"]').click();
    
    // Agree to terms
    await page.locator('input[name="terms_agreed"]').check();
    
    // Submit order
    await page.locator('button:has-text("Place Order")').click();
    
    // Verify order confirmation
    await expect(page.locator('text=Order Confirmed')).toBeVisible({ timeout: 10000 });
  });

  test('should handle form validation errors', async ({ page }) => {
    // Go directly to checkout
    await page.goto('/checkout');
    
    // Try to submit without filling form
    await page.locator('button:has-text("Place Order")').click();
    
    // Check validation errors appear
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('should switch between languages', async ({ page }) => {
    // Check English is default
    await expect(page.locator('text=Premium Live Sheep')).toBeVisible();
    
    // Switch to Arabic
    await page.locator('button:has-text("عربي")').click();
    
    // Check Arabic content appears
    await expect(page.locator('text=مواشي وأضاحي')).toBeVisible();
    
    // Switch back to English
    await page.locator('button:has-text("EN")').click();
    
    // Verify English content returns
    await expect(page.locator('text=Premium Live Sheep')).toBeVisible();
  });
});