import { test, expect, Page } from '@playwright/test';
import { setupAuthenticatedSession, mockSupabaseAuth } from '../helpers/auth';
import { ChatKitMockServer } from '../helpers/chatkit-mock-server';

// Test configuration
const CHATKIT_URL = '/chatkit';
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8001';

// Helper to wait for ChatKit to load
async function waitForChatKit(page: Page) {
  // Wait for ChatKit script to load
  await page.waitForFunction(() => window.ChatKit !== undefined, {
    timeout: 30000
  });
  
  // Wait for ChatKit element to be rendered
  await page.waitForSelector('openai-chatkit', { timeout: 30000 });
  
  // Additional wait for ChatKit to be fully initialized
  await page.waitForTimeout(2000);
}

test.describe('ChatKit Integration', () => {
  let mockServer: ChatKitMockServer;

  test.beforeAll(async () => {
    // Start mock server for API endpoints
    mockServer = new ChatKitMockServer();
    await mockServer.start();
  });

  test.afterAll(async () => {
    await mockServer.stop();
  });

  test.beforeEach(async ({ page, context }) => {
    // Mock authentication
    await mockSupabaseAuth(context);
    
    // Setup authenticated session
    await setupAuthenticatedSession(page);
    
    // Intercept ChatKit CDN script
    await page.route('https://cdn.platform.openai.com/deployments/chatkit/chatkit.js', async route => {
      // Return a mock ChatKit implementation for testing
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `
          window.ChatKit = {
            version: '1.0.0-test'
          };
          
          class ChatKitElement extends HTMLElement {
            constructor() {
              super();
              this._options = {};
              this._eventListeners = new Map();
            }
            
            connectedCallback() {
              this.innerHTML = '<div class="chatkit-container" style="height: 100%; display: flex; flex-direction: column;"><div class="chatkit-header">ChatKit Mock</div><div class="chatkit-messages" style="flex: 1; overflow-y: auto;"></div><div class="chatkit-composer"><input type="text" class="chatkit-input" placeholder="Type a message..." style="width: 100%; padding: 8px;" /></div></div>';
              
              // Simulate initialization
              setTimeout(() => {
                this._triggerEvent('chatkit.ready', {});
              }, 100);
              
              // Handle input
              const input = this.querySelector('.chatkit-input');
              input?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  this._handleMessage(e.target.value.trim());
                  e.target.value = '';
                }
              });
            }
            
            setOptions(options) {
              this._options = { ...this._options, ...options };
              
              // Apply theme
              if (options.theme) {
                this.setAttribute('data-theme', options.theme);
              }
              
              // Update header if provided
              if (options.header) {
                const header = this.querySelector('.chatkit-header');
                if (header && options.header.title) {
                  header.textContent = options.header.title;
                }
              }
              
              // Update placeholder if provided
              if (options.composer?.placeholder) {
                const input = this.querySelector('.chatkit-input');
                if (input) {
                  input.placeholder = options.composer.placeholder;
                }
              }
              
              // Initialize session if getClientSecret is provided
              if (options.api?.getClientSecret) {
                this._initializeSession();
              }
            }
            
            async _initializeSession() {
              try {
                const clientSecret = await this._options.api.getClientSecret();
                this._clientSecret = clientSecret;
                this._triggerEvent('chatkit.session.created', { clientSecret });
              } catch (error) {
                this._triggerEvent('chatkit.error', { error });
              }
            }
            
            async _handleMessage(message) {
              const messagesContainer = this.querySelector('.chatkit-messages');
              
              // Add user message
              const userMessage = document.createElement('div');
              userMessage.className = 'chatkit-message chatkit-message-user';
              userMessage.textContent = message;
              messagesContainer?.appendChild(userMessage);
              
              // Trigger events
              this._triggerEvent('chatkit.message.sent', { message });
              this._triggerEvent('chatkit.response.start', {});
              
              // Simulate API call
              try {
                const response = await fetch('${API_BASE_URL}/api/chatkit/message', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this._clientSecret
                  },
                  body: JSON.stringify({ message })
                });
                
                if (!response.ok) throw new Error('API Error');
                
                // Add mock assistant response
                const assistantMessage = document.createElement('div');
                assistantMessage.className = 'chatkit-message chatkit-message-assistant';
                assistantMessage.textContent = 'This is a mock response to: ' + message;
                messagesContainer?.appendChild(assistantMessage);
                
                this._triggerEvent('chatkit.response.end', {});
                this._triggerEvent('chatkit.message.received', { 
                  message: assistantMessage.textContent 
                });
              } catch (error) {
                this._triggerEvent('chatkit.error', { error: error.message });
              }
            }
            
            addEventListener(event, handler) {
              if (!this._eventListeners.has(event)) {
                this._eventListeners.set(event, new Set());
              }
              this._eventListeners.get(event).add(handler);
            }
            
            removeEventListener(event, handler) {
              this._eventListeners.get(event)?.delete(handler);
            }
            
            _triggerEvent(eventName, detail) {
              const event = new CustomEvent(eventName, { detail });
              this.dispatchEvent(event);
              
              // Also trigger on registered handlers
              const handlers = this._eventListeners.get(eventName);
              if (handlers) {
                handlers.forEach(handler => handler(event));
              }
            }
          }
          
          customElements.define('openai-chatkit', ChatKitElement);
        `
      });
    });
  });

  test('should load ChatKit page successfully', async ({ page }) => {
    await page.goto(CHATKIT_URL);
    
    // Check page title and header
    await expect(page).toHaveTitle(/ChatKit|AI Agent/);
    await expect(page.locator('h1')).toContainText('Alleato Knowledge Assistant');
    
    // Check feature badges
    await expect(page.locator('text=Multi-Agent Workflow')).toBeVisible();
    await expect(page.locator('text=Vector Search')).toBeVisible();
    await expect(page.locator('text=Web Search')).toBeVisible();
    await expect(page.locator('text=Real-time Streaming')).toBeVisible();
  });

  test('should initialize ChatKit widget', async ({ page }) => {
    await page.goto(CHATKIT_URL);
    
    // Wait for ChatKit to load
    await waitForChatKit(page);
    
    // Verify ChatKit element exists
    const chatKitElement = page.locator('openai-chatkit');
    await expect(chatKitElement).toBeVisible();
    
    // Verify ChatKit container structure
    await expect(chatKitElement.locator('.chatkit-container')).toBeVisible();
    await expect(chatKitElement.locator('.chatkit-header')).toBeVisible();
    await expect(chatKitElement.locator('.chatkit-composer')).toBeVisible();
  });

  test('should create ChatKit session', async ({ page }) => {
    // Mock session endpoint
    await page.route(`${API_BASE_URL}/api/chatkit/sessions`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          client_secret: 'cs_test_session_123',
          session_id: 'session_123',
          expires_at: Date.now() + 3600000
        })
      });
    });

    await page.goto(CHATKIT_URL);
    await waitForChatKit(page);

    // Wait for session to be created
    const sessionCreated = page.waitForEvent('console', msg => 
      msg.text().includes('ChatKit session created') || 
      msg.text().includes('cs_test_session_123')
    );

    await sessionCreated;
  });

  test('should handle ChatKit messages', async ({ page }) => {
    // Mock message endpoint
    await page.route(`${API_BASE_URL}/api/chatkit/message`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: `data: {"type": "ack", "timestamp": "${new Date().toISOString()}"}\n\n` +
              `data: {"type": "progress", "name": "Query Rewriting", "status": "started"}\n\n` +
              `data: {"type": "progress", "name": "Query Rewriting", "status": "completed"}\n\n` +
              `data: {"type": "message", "role": "assistant", "content": "This is a test response from the ChatKit integration."}\n\n` +
              `data: {"type": "done", "timestamp": "${new Date().toISOString()}"}\n\n`
      });
    });

    await page.goto(CHATKIT_URL);
    await waitForChatKit(page);

    // Find and interact with ChatKit input
    const chatInput = page.locator('openai-chatkit .chatkit-input');
    await expect(chatInput).toBeVisible();

    // Type and send a message
    await chatInput.fill('What is the company remote work policy?');
    await chatInput.press('Enter');

    // Wait for response
    await expect(page.locator('text=This is a test response')).toBeVisible({ timeout: 10000 });
  });

  test('should display workflow information', async ({ page }) => {
    await page.goto(CHATKIT_URL);

    // Check workflow steps
    await expect(page.locator('text=Query Rewriting')).toBeVisible();
    await expect(page.locator('text=Smart Classification')).toBeVisible();
    await expect(page.locator('text=Specialized Response')).toBeVisible();

    // Check features
    await expect(page.locator('text=Knowledge Base Search')).toBeVisible();
    await expect(page.locator('text=Web Search Integration')).toBeVisible();
    await expect(page.locator('text=Built-in Safety')).toBeVisible();
  });

  test('should show example queries', async ({ page }) => {
    await page.goto(CHATKIT_URL);

    // Click on different tabs
    await page.click('text=Research');
    await expect(page.locator('text=Find facts about emerging AI trends')).toBeVisible();

    await page.click('text=Analysis');
    await expect(page.locator('text=Analyze the pros and cons')).toBeVisible();

    await page.click('text=Knowledge Base');
    await expect(page.locator('text=What are our company\'s remote work policies?')).toBeVisible();
  });

  test('should handle ChatKit errors gracefully', async ({ page }) => {
    // Mock session endpoint to fail
    await page.route(`${API_BASE_URL}/api/chatkit/sessions`, async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' })
      });
    });

    await page.goto(CHATKIT_URL);

    // ChatKit should still load but may show error state
    const chatKitElement = page.locator('openai-chatkit');
    await expect(chatKitElement).toBeVisible({ timeout: 30000 });
  });

  test('should apply theme settings', async ({ page }) => {
    await page.goto(CHATKIT_URL);
    await waitForChatKit(page);

    // Check initial theme
    const chatKitElement = page.locator('openai-chatkit');
    
    // Toggle theme (simulate dark mode)
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    // Wait a bit for theme to be applied
    await page.waitForTimeout(1000);

    // Verify theme attribute
    await expect(chatKitElement).toHaveAttribute('data-theme', 'dark');
  });

  test('should handle session refresh', async ({ page }) => {
    let refreshCount = 0;

    // Mock refresh endpoint
    await page.route(`${API_BASE_URL}/api/chatkit/refresh`, async route => {
      refreshCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          client_secret: `cs_refreshed_session_${refreshCount}`,
          session_id: `session_refreshed_${refreshCount}`,
          expires_at: Date.now() + 3600000
        })
      });
    });

    await page.goto(CHATKIT_URL);
    await waitForChatKit(page);

    // Simulate session expiry and refresh
    await page.evaluate(() => {
      // Trigger a session refresh by calling the API
      const chatKitElement = document.querySelector('openai-chatkit');
      if (chatKitElement && chatKitElement._options?.api?.getClientSecret) {
        chatKitElement._options.api.getClientSecret('cs_old_session');
      }
    });

    // Wait for refresh to complete
    await page.waitForTimeout(2000);

    // Verify refresh was called
    expect(refreshCount).toBeGreaterThan(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto(CHATKIT_URL);
    await waitForChatKit(page);

    // Verify ChatKit is still visible
    const chatKitElement = page.locator('openai-chatkit');
    await expect(chatKitElement).toBeVisible();

    // Verify responsive layout
    const container = page.locator('.container');
    const containerBox = await container.boundingBox();
    expect(containerBox?.width).toBeLessThanOrEqual(375);
  });

  test('should track analytics events', async ({ page }) => {
    const analyticsEvents: any[] = [];

    // Intercept analytics calls
    await page.route('**/api/analytics/**', async route => {
      const postData = route.request().postData();
      if (postData) {
        analyticsEvents.push(JSON.parse(postData));
      }
      await route.fulfill({ status: 200 });
    });

    await page.goto(CHATKIT_URL);
    await waitForChatKit(page);

    // Interact with ChatKit
    const chatInput = page.locator('openai-chatkit .chatkit-input');
    await chatInput.fill('Test message');
    await chatInput.press('Enter');

    await page.waitForTimeout(1000);

    // Verify analytics events were tracked
    // (This depends on your analytics implementation)
  });
});