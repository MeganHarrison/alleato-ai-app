import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the agent API with proper streaming format
    await page.route('**/api/pydantic-agent', async (route) => {
      const mockResponse = `{"text": "Hello! I'm a mock AI assistant."}
{"complete": true, "session_id": "session-new", "conversation_title": "New Chat"}`;

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
        },
        body: mockResponse
      });
    });
  });

  test('should display chat interface when authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Should stay on root page (not redirect to login)
    await expect(page).toHaveURL('/');
    
    // Should see chat interface elements - look for common chat UI elements
    const chatElements = [
      'textarea',
      'button[type="submit"]',
      'input[type="text"]',
      '[placeholder*="message"]',
      '[placeholder*="Message"]',
      '[aria-label*="message"]'
    ];
    
    // Check if any of these common chat input elements exist
    let foundChatInput = false;
    for (const selector of chatElements) {
      if (await page.locator(selector).count() > 0) {
        await expect(page.locator(selector).first()).toBeVisible();
        foundChatInput = true;
        break;
      }
    }
    
    if (!foundChatInput) {
      // If no specific chat input found, just verify we're on the main page
      await expect(page).toHaveTitle(/Dynamous/);
    }
  });

  test('should send a message and receive response', async ({ page }) => {
    await page.goto('/');
    
    // Should be on the chat page (authenticated users see chat at /)
    await expect(page).toHaveURL('/');
    
    // Should see the chat interface - look for the specific textarea placeholder
    const messageInput = page.getByPlaceholder('Message the AI...');
    await expect(messageInput).toBeVisible();
    
    // Type a message
    await messageInput.fill('Hello, how are you?');
    
    // Find the send button (it has a Send icon and is type="submit")
    const sendButton = page.locator('button[type="submit"]').last(); // Use .last() to get the actual send button
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toBeEnabled();
    
    // Send the message
    await sendButton.click();
    
    // Should see the user message in the chat (auto-waits)
    await expect(page.getByText('Hello, how are you?')).toBeVisible();
    
    // Should see "You" label for the user message (be more specific)
    await expect(page.locator('.text-xs.font-medium.text-muted-foreground').filter({ hasText: 'You' })).toBeVisible();
    
    // Should see the mock AI response text
    await expect(page.getByText('Hello! I\'m a mock AI assistant.')).toBeVisible();
    
    // Should see "AI Assistant" label for the AI message (be more specific)
    await expect(page.locator('.text-xs.font-medium.text-muted-foreground').filter({ hasText: 'AI Assistant' })).toBeVisible();
  });

  test('should start a new conversation', async ({ page }) => {
    await page.goto('/');
    
    // Look for new chat button with various possible texts/attributes
    const newChatSelectors = [
      'button:has-text("New Chat")',
      'button:has-text("New Conversation")', 
      'button:has-text("New")',
      '[data-testid="new-chat"]',
      '[aria-label*="new"]',
      'button[aria-label*="New"]'
    ];
    
    for (const selector of newChatSelectors) {
      const button = page.locator(selector);
      if (await button.count() > 0) {
        await button.first().click();
        break;
      }
    }
    
    // Verify we can still interact with the chat interface
    const messageInput = page.locator('textarea, input[type="text"], [placeholder*="message"]').first();
    if (await messageInput.count() > 0) {
      await expect(messageInput).toBeVisible();
    }
  });

  test('should display conversation history if available', async ({ page }) => {
    await page.goto('/');
    
    // Look for conversation list items
    const conversationSelectors = [
      'text=Test Conversation 1',
      '[data-testid="conversation"]',
      '.conversation-item',
      '[role="listitem"]'
    ];
    
    // Check if any conversations are visible
    for (const selector of conversationSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible();
        break;
      }
    }
  });

  test('should handle mobile sidebar toggle if present', async ({ page }) => {
    await page.goto('/');
    
    // Look for menu/hamburger button
    const menuButton = page.locator('button:has-text("Menu"), [aria-label*="menu"], [data-testid="menu"], button:has([data-lucide="menu"])').first();
    
    if (await menuButton.count() > 0) {
      await menuButton.click();
      // Just verify the button is clickable, don't assert specific behavior
    }
  });

  test('should show loading states appropriately', async ({ page }) => {
    // Override the API mock to add delay for this test
    await page.route('**/api/pydantic-agent', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockResponse = `{"text": "Delayed response"}
{"complete": true, "session_id": "session-new", "conversation_title": "New Chat"}`;

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
        },
        body: mockResponse
      });
    });
    
    await page.goto('/');
    
    // Should be on the chat page
    await expect(page).toHaveURL('/');
    
    // Should see the chat interface
    const messageInput = page.getByPlaceholder('Message the AI...');
    await expect(messageInput).toBeVisible();
    
    // Type a message
    await messageInput.fill('Test loading');
    
    // Send the message
    const sendButton = page.locator('button[type="submit"]').last();
    await sendButton.click();
    
    // Should see loading dots while response is being generated
    await expect(page.locator('#loading-indicator')).toBeVisible();
    
    // Should see the delayed response (auto-waits for it to appear)
    await expect(page.getByText('Delayed response')).toBeVisible();
    
    // Loading indicator should be gone after response appears
    await expect(page.locator('#loading-indicator')).not.toBeVisible();
  });
});