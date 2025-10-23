import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession, mockSupabaseAuth } from '../helpers/auth';

const CHATKIT_URL = '/chatkit';

test.describe('ChatKit Visual Regression Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    await mockSupabaseAuth(context);
    await setupAuthenticatedSession(page);
    
    // Mock ChatKit CDN script
    await page.route('https://cdn.platform.openai.com/deployments/chatkit/chatkit.js', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: getMockChatKitScript()
      });
    });
  });

  test('should match ChatKit page layout', async ({ page }) => {
    await page.goto(CHATKIT_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot of full page
    await expect(page).toHaveScreenshot('chatkit-page-full.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should match ChatKit widget appearance', async ({ page }) => {
    await page.goto(CHATKIT_URL);
    await page.waitForSelector('openai-chatkit', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const chatKitWidget = page.locator('.card').filter({ has: page.locator('openai-chatkit') });
    
    await expect(chatKitWidget).toHaveScreenshot('chatkit-widget.png', {
      animations: 'disabled'
    });
  });

  test('should match dark mode appearance', async ({ page }) => {
    await page.goto(CHATKIT_URL);
    
    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    
    await page.waitForSelector('openai-chatkit', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('chatkit-dark-mode.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should match mobile layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    await page.goto(CHATKIT_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('chatkit-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should match tablet layout', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto(CHATKIT_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('chatkit-tablet.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should match workflow visualization', async ({ page }) => {
    await page.goto(CHATKIT_URL);
    await page.waitForLoadState('networkidle');
    
    const workflowSection = page.locator('text=Intelligent Workflow').locator('..');
    await expect(workflowSection).toHaveScreenshot('chatkit-workflow.png', {
      animations: 'disabled'
    });
  });

  test('should match features section', async ({ page }) => {
    await page.goto(CHATKIT_URL);
    await page.waitForLoadState('networkidle');
    
    const featuresSection = page.locator('text=Key Features').locator('..');
    await expect(featuresSection).toHaveScreenshot('chatkit-features.png', {
      animations: 'disabled'
    });
  });

  test('should match example queries tabs', async ({ page }) => {
    await page.goto(CHATKIT_URL);
    await page.waitForLoadState('networkidle');
    
    const exampleSection = page.locator('text=Example Queries').locator('..');
    
    // Knowledge Base tab
    await expect(exampleSection).toHaveScreenshot('chatkit-examples-knowledge.png', {
      animations: 'disabled'
    });
    
    // Research tab
    await page.click('text=Research');
    await page.waitForTimeout(500);
    await expect(exampleSection).toHaveScreenshot('chatkit-examples-research.png', {
      animations: 'disabled'
    });
    
    // Analysis tab
    await page.click('text=Analysis');
    await page.waitForTimeout(500);
    await expect(exampleSection).toHaveScreenshot('chatkit-examples-analysis.png', {
      animations: 'disabled'
    });
  });

  test('should match chat interface states', async ({ page }) => {
    await page.goto(CHATKIT_URL);
    await page.waitForSelector('openai-chatkit', { timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const chatKitElement = page.locator('openai-chatkit');
    
    // Empty state
    await expect(chatKitElement).toHaveScreenshot('chatkit-empty-state.png', {
      animations: 'disabled'
    });
    
    // With user message
    await page.evaluate(() => {
      const chatKit = document.querySelector('openai-chatkit');
      const messagesContainer = chatKit?.querySelector('.chatkit-messages');
      if (messagesContainer) {
        const userMsg = document.createElement('div');
        userMsg.className = 'chatkit-message chatkit-message-user';
        userMsg.textContent = 'What is the company remote work policy?';
        messagesContainer.appendChild(userMsg);
      }
    });
    
    await expect(chatKitElement).toHaveScreenshot('chatkit-with-user-message.png', {
      animations: 'disabled'
    });
    
    // With assistant response
    await page.evaluate(() => {
      const chatKit = document.querySelector('openai-chatkit');
      const messagesContainer = chatKit?.querySelector('.chatkit-messages');
      if (messagesContainer) {
        const assistantMsg = document.createElement('div');
        assistantMsg.className = 'chatkit-message chatkit-message-assistant';
        assistantMsg.textContent = 'Based on our company policy, employees are allowed to work remotely up to 3 days per week...';
        messagesContainer.appendChild(assistantMsg);
      }
    });
    
    await expect(chatKitElement).toHaveScreenshot('chatkit-with-conversation.png', {
      animations: 'disabled'
    });
  });

  test('should match loading states', async ({ page }) => {
    await page.goto(CHATKIT_URL);
    
    // Capture initial loading state
    const loadingCard = page.locator('.card').filter({ hasText: 'Loading ChatKit...' });
    if (await loadingCard.isVisible()) {
      await expect(loadingCard).toHaveScreenshot('chatkit-loading.png', {
        animations: 'disabled'
      });
    }
    
    // Wait for ChatKit to load
    await page.waitForSelector('openai-chatkit', { timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Simulate typing indicator
    await page.evaluate(() => {
      const chatKit = document.querySelector('openai-chatkit');
      const messagesContainer = chatKit?.querySelector('.chatkit-messages');
      if (messagesContainer) {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'chatkit-typing-indicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        messagesContainer.appendChild(typingIndicator);
      }
    });
    
    const chatKitElement = page.locator('openai-chatkit');
    await expect(chatKitElement).toHaveScreenshot('chatkit-typing-indicator.png', {
      animations: 'disabled'
    });
  });
});

// Helper function to get mock ChatKit script
function getMockChatKitScript(): string {
  return `
    window.ChatKit = { version: '1.0.0-test' };
    
    class ChatKitElement extends HTMLElement {
      constructor() {
        super();
        this._options = {};
      }
      
      connectedCallback() {
        this.innerHTML = \`
          <div class="chatkit-container" style="
            height: 100%;
            display: flex;
            flex-direction: column;
            background: var(--background, white);
            border-radius: 8px;
            overflow: hidden;
          ">
            <div class="chatkit-header" style="
              padding: 16px;
              border-bottom: 1px solid var(--border, #e5e5e5);
              font-weight: 600;
            ">ChatKit Assistant</div>
            
            <div class="chatkit-messages" style="
              flex: 1;
              overflow-y: auto;
              padding: 16px;
              display: flex;
              flex-direction: column;
              gap: 12px;
            "></div>
            
            <div class="chatkit-composer" style="
              padding: 16px;
              border-top: 1px solid var(--border, #e5e5e5);
            ">
              <input type="text" class="chatkit-input" placeholder="Type a message..." style="
                width: 100%;
                padding: 12px;
                border: 1px solid var(--border, #e5e5e5);
                border-radius: 6px;
                font-size: 14px;
                background: var(--input-background, white);
                color: var(--text, black);
              " />
            </div>
          </div>
        \`;
        
        // Apply styles for messages
        const style = document.createElement('style');
        style.textContent = \`
          .chatkit-message {
            padding: 12px 16px;
            border-radius: 8px;
            max-width: 70%;
            word-wrap: break-word;
          }
          
          .chatkit-message-user {
            background: var(--primary, #007bff);
            color: white;
            align-self: flex-end;
            margin-left: auto;
          }
          
          .chatkit-message-assistant {
            background: var(--muted, #f5f5f5);
            color: var(--text, black);
            align-self: flex-start;
          }
          
          .chatkit-typing-indicator {
            display: flex;
            gap: 4px;
            padding: 12px 16px;
            align-self: flex-start;
          }
          
          .chatkit-typing-indicator span {
            width: 8px;
            height: 8px;
            background: var(--muted-foreground, #999);
            border-radius: 50%;
            animation: typing 1.4s infinite;
          }
          
          .chatkit-typing-indicator span:nth-child(2) {
            animation-delay: 0.2s;
          }
          
          .chatkit-typing-indicator span:nth-child(3) {
            animation-delay: 0.4s;
          }
          
          @keyframes typing {
            0%, 60%, 100% {
              transform: translateY(0);
            }
            30% {
              transform: translateY(-10px);
            }
          }
          
          [data-theme="dark"] .chatkit-container {
            --background: #1a1a1a;
            --border: #333;
            --text: white;
            --input-background: #2a2a2a;
            --muted: #2a2a2a;
            --muted-foreground: #666;
          }
        \`;
        this.appendChild(style);
      }
      
      setOptions(options) {
        this._options = options;
        if (options.theme) {
          this.setAttribute('data-theme', options.theme);
        }
        if (options.header?.title) {
          const header = this.querySelector('.chatkit-header');
          if (header) header.textContent = options.header.title;
        }
        if (options.composer?.placeholder) {
          const input = this.querySelector('.chatkit-input');
          if (input) input.placeholder = options.composer.placeholder;
        }
      }
    }
    
    customElements.define('openai-chatkit', ChatKitElement);
  `;
}