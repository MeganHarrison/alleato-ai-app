import { test, expect } from '@playwright/test';

test.describe('ChatKit Page Tests', () => {
  test('ChatKit page loads with input functionality', async ({ page }) => {
    // Navigate to the ChatKit page
    await page.goto('/chatkit');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Alleato AI Agent');
    
    // Check if mode selector is visible
    const modeSelector = page.locator('button[role="tab"]');
    await expect(modeSelector.first()).toBeVisible();
    
    // Check which mode is active
    const activeMode = await page.locator('[role="tab"][aria-selected="true"]').textContent();
    console.log('Active mode:', activeMode);
    
    // If in Demo Chat mode, we should have a textarea
    if (activeMode === 'Demo Chat') {
      const textarea = page.locator('textarea');
      await expect(textarea).toBeVisible();
      await expect(textarea).toHaveAttribute('placeholder', 'Type your message here...');
      
      // Type a test message
      await textarea.fill('Test message: Can you help me?');
      
      // Find and click send button
      const sendButton = page.locator('button:has(svg)').filter({ hasText: '' }).last();
      await expect(sendButton).toBeVisible();
      await sendButton.click();
      
      // Wait for response
      await page.waitForTimeout(1000);
      
      // Check if message appears
      const messages = page.locator('[class*="message"]');
      await expect(messages).toHaveCount({ minimum: 1 });
    }
    
    // Try switching to Simple ChatKit mode
    const simpleChatKitTab = page.locator('button[role="tab"]:has-text("Simple ChatKit")');
    if (await simpleChatKitTab.count() > 0) {
      await simpleChatKitTab.click();
      await page.waitForTimeout(1000);
      
      // Check for openai-chatkit element
      const chatkitElement = page.locator('openai-chatkit');
      const hasElement = await chatkitElement.count() > 0;
      console.log('Has openai-chatkit element:', hasElement);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/chatkit-page.png', fullPage: true });
  });

  test('ChatKit custom implementation works', async ({ page }) => {
    await page.goto('/chatkit');
    
    // Ensure we're in Demo Chat mode
    const demoTab = page.locator('button[role="tab"]:has-text("Demo Chat")');
    if (await demoTab.count() > 0) {
      await demoTab.click();
      await page.waitForTimeout(500);
    }
    
    // Test message sending
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    
    await textarea.fill('Hello, this is a test!');
    
    const sendButton = page.locator('button:has(svg)').filter({ hasText: '' }).last();
    await sendButton.click();
    
    // Wait for the message to appear
    await expect(page.locator('text="Hello, this is a test!"')).toBeVisible();
    
    // Wait for response
    await expect(page.locator('text="demo ChatKit assistant"')).toBeVisible({ timeout: 5000 });
  });
});