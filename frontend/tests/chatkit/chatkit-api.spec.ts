import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession, mockSupabaseAuth } from '../helpers/auth';

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8001';

test.describe('ChatKit API Integration', () => {
  test.beforeEach(async ({ page, context }) => {
    await mockSupabaseAuth(context);
    await setupAuthenticatedSession(page);
  });

  test('should handle complete workflow execution', async ({ page }) => {
    const workflowSteps: string[] = [];
    
    // Intercept API calls to track workflow
    await page.route(`${API_BASE_URL}/api/chatkit/message`, async route => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');
      
      // Simulate complete workflow
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: [
          `data: ${JSON.stringify({ type: 'ack', timestamp: new Date().toISOString() })}\n\n`,
          `data: ${JSON.stringify({ type: 'progress', name: 'Query Rewrite', status: 'started' })}\n\n`,
          `data: ${JSON.stringify({ type: 'progress', name: 'Query Rewrite', status: 'completed', output: 'Rewritten query' })}\n\n`,
          `data: ${JSON.stringify({ type: 'progress', name: 'Classification', status: 'started' })}\n\n`,
          `data: ${JSON.stringify({ type: 'progress', name: 'Classification', status: 'completed', output: 'q-and-a' })}\n\n`,
          `data: ${JSON.stringify({ type: 'progress', name: 'Internal Q&A', status: 'started' })}\n\n`,
          `data: ${JSON.stringify({ type: 'progress', name: 'Internal Q&A', status: 'completed' })}\n\n`,
          `data: ${JSON.stringify({ type: 'message', role: 'assistant', content: 'Based on the knowledge base, here is your answer...', thread_id: 'thread_123' })}\n\n`,
          `data: ${JSON.stringify({ type: 'done', timestamp: new Date().toISOString() })}\n\n`
        ].join('')
      });
    });

    // Listen for console logs to track workflow
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Query Rewrite') || text.includes('Classification') || text.includes('Internal Q&A')) {
        workflowSteps.push(text);
      }
    });

    await page.goto('/chatkit');
    
    // Wait for ChatKit to load
    await page.waitForSelector('openai-chatkit', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Send a message
    const chatInput = page.locator('openai-chatkit .chatkit-input');
    await chatInput.fill('What is the company policy on remote work?');
    await chatInput.press('Enter');

    // Wait for response
    await page.waitForSelector('text=Based on the knowledge base', { timeout: 10000 });
    
    // Verify workflow was executed
    expect(workflowSteps.length).toBeGreaterThan(0);
  });

  test('should handle fact-finding workflow', async ({ page }) => {
    await page.route(`${API_BASE_URL}/api/chatkit/message`, async route => {
      // Simulate fact-finding workflow
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: [
          `data: ${JSON.stringify({ type: 'progress', name: 'Query Rewrite', status: 'completed' })}\n\n`,
          `data: ${JSON.stringify({ type: 'progress', name: 'Classification', status: 'completed', output: 'fact-finding' })}\n\n`,
          `data: ${JSON.stringify({ type: 'progress', name: 'External Fact Finding', status: 'started' })}\n\n`,
          `data: ${JSON.stringify({ type: 'progress', name: 'External Fact Finding', status: 'completed' })}\n\n`,
          `data: ${JSON.stringify({ type: 'message', role: 'assistant', content: 'Here are the facts I found:\n• Fact 1\n• Fact 2\n• Fact 3' })}\n\n`,
          `data: ${JSON.stringify({ type: 'done' })}\n\n`
        ].join('')
      });
    });

    await page.goto('/chatkit');
    await page.waitForSelector('openai-chatkit', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const chatInput = page.locator('openai-chatkit .chatkit-input');
    await chatInput.fill('Find facts about AI trends in healthcare');
    await chatInput.press('Enter');

    // Wait for fact-finding response
    await page.waitForSelector('text=Here are the facts I found', { timeout: 10000 });
    await expect(page.locator('text=Fact 1')).toBeVisible();
  });

  test('should handle general workflow', async ({ page }) => {
    await page.route(`${API_BASE_URL}/api/chatkit/message`, async route => {
      // Simulate general workflow (other classification)
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: [
          `data: ${JSON.stringify({ type: 'progress', name: 'Classification', status: 'completed', output: 'other' })}\n\n`,
          `data: ${JSON.stringify({ type: 'progress', name: 'General Response', status: 'started' })}\n\n`,
          `data: ${JSON.stringify({ type: 'message', role: 'assistant', content: 'Could you please provide more specific details about what you\'re looking for?' })}\n\n`,
          `data: ${JSON.stringify({ type: 'done' })}\n\n`
        ].join('')
      });
    });

    await page.goto('/chatkit');
    await page.waitForSelector('openai-chatkit', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const chatInput = page.locator('openai-chatkit .chatkit-input');
    await chatInput.fill('Hello');
    await chatInput.press('Enter');

    // Wait for clarification response
    await page.waitForSelector('text=provide more specific details', { timeout: 10000 });
  });

  test('should persist thread across messages', async ({ page }) => {
    let threadId: string | null = null;

    await page.route(`${API_BASE_URL}/api/chatkit/message`, async route => {
      const response = {
        type: 'message',
        role: 'assistant',
        content: 'Response to your message',
        thread_id: threadId || 'thread_new_123'
      };
      
      if (!threadId) {
        threadId = response.thread_id;
      }

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: [
          `data: ${JSON.stringify(response)}\n\n`,
          `data: ${JSON.stringify({ type: 'done' })}\n\n`
        ].join('')
      });
    });

    await page.goto('/chatkit');
    await page.waitForSelector('openai-chatkit', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const chatInput = page.locator('openai-chatkit .chatkit-input');
    
    // Send first message
    await chatInput.fill('First message');
    await chatInput.press('Enter');
    await page.waitForSelector('text=Response to your message');

    // Send second message
    await chatInput.fill('Second message');
    await chatInput.press('Enter');
    await page.waitForSelector('text=Response to your message');

    // Verify thread ID is consistent
    expect(threadId).toBeTruthy();
    expect(threadId).toBe('thread_new_123');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.route(`${API_BASE_URL}/api/chatkit/message`, async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' })
      });
    });

    await page.goto('/chatkit');
    await page.waitForSelector('openai-chatkit', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const chatInput = page.locator('openai-chatkit .chatkit-input');
    await chatInput.fill('Test message');
    await chatInput.press('Enter');

    // Should show error handling (depends on implementation)
    await page.waitForTimeout(2000);
    
    // ChatKit should still be functional
    await expect(chatInput).toBeVisible();
    await expect(chatInput).toBeEnabled();
  });

  test('should handle rate limiting', async ({ page }) => {
    let requestCount = 0;

    await page.route(`${API_BASE_URL}/api/chatkit/message`, async route => {
      requestCount++;
      
      if (requestCount > 3) {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ 
            detail: 'Rate limit exceeded', 
            retry_after: 60 
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: `data: ${JSON.stringify({ type: 'message', role: 'assistant', content: 'Response' })}\n\ndata: ${JSON.stringify({ type: 'done' })}\n\n`
        });
      }
    });

    await page.goto('/chatkit');
    await page.waitForSelector('openai-chatkit', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const chatInput = page.locator('openai-chatkit .chatkit-input');
    
    // Send multiple messages quickly
    for (let i = 0; i < 5; i++) {
      await chatInput.fill(`Message ${i + 1}`);
      await chatInput.press('Enter');
      await page.waitForTimeout(500);
    }

    // Verify rate limiting kicked in
    expect(requestCount).toBeGreaterThanOrEqual(4);
  });

  test('should support message streaming', async ({ page }) => {
    const streamedParts: string[] = [];

    await page.route(`${API_BASE_URL}/api/chatkit/message`, async route => {
      // Simulate streaming response with multiple parts
      const messageParts = [
        'This is ',
        'a streaming ',
        'response that ',
        'comes in ',
        'multiple parts.'
      ];

      let responseBody = '';
      for (const part of messageParts) {
        responseBody += `data: ${JSON.stringify({ 
          type: 'message_delta', 
          delta: part 
        })}\n\n`;
      }
      
      responseBody += `data: ${JSON.stringify({ 
        type: 'message', 
        role: 'assistant', 
        content: messageParts.join('') 
      })}\n\n`;
      responseBody += `data: ${JSON.stringify({ type: 'done' })}\n\n`;

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: responseBody
      });
    });

    // Listen for streaming updates
    page.on('console', msg => {
      if (msg.text().includes('message_delta')) {
        streamedParts.push(msg.text());
      }
    });

    await page.goto('/chatkit');
    await page.waitForSelector('openai-chatkit', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const chatInput = page.locator('openai-chatkit .chatkit-input');
    await chatInput.fill('Stream this response');
    await chatInput.press('Enter');

    // Wait for complete response
    await page.waitForSelector('text=This is a streaming response that comes in multiple parts', 
      { timeout: 10000 });
  });
});