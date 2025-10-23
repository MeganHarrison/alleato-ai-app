import { test, expect } from '@playwright/test';

test.describe('Debug Authenticated State', () => {
  test('take screenshot of authenticated home page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'screenshots/authenticated-home.png',
      fullPage: true 
    });
    
    // Print page title and URL for debugging
    const title = await page.title();
    const url = page.url();
    console.log('Page Title:', title);
    console.log('Page URL:', url);
    
    // Print available input elements
    const inputs = await page.locator('input, textarea').all();
    console.log('Available inputs:', inputs.length);
    
    for (let i = 0; i < inputs.length; i++) {
      const placeholder = await inputs[i].getAttribute('placeholder');
      const type = await inputs[i].getAttribute('type');
      const tagName = await inputs[i].evaluate(el => el.tagName.toLowerCase());
      console.log(`Input ${i}: ${tagName}, type: ${type}, placeholder: "${placeholder}"`);
    }
  });
});