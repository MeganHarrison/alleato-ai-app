const { chromium } = require('playwright');
const path = require('path');

async function comprehensiveTest() {
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000 // Slow down actions for visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  const screenshotDir = '/Users/meganharrison/Documents/github/ai-agent-mastery3/6_Agent_Deployment/screenshots';
  
  try {
    console.log('🚀 Starting comprehensive E2E test...');
    
    // Test 1: Frontend loads
    console.log('📱 Testing frontend load...');
    await page.goto('http://localhost:3002');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '01-frontend-load.png') });
    
    // Test 2: Check for authentication
    console.log('🔐 Testing authentication flow...');
    
    // Look for login/signup elements
    const loginButton = await page.locator('text=Sign In').first();
    const signUpButton = await page.locator('text=Sign Up').first();
    
    if (await loginButton.isVisible() || await signUpButton.isVisible()) {
      console.log('✅ Authentication elements found');
      await page.screenshot({ path: path.join(screenshotDir, '02-auth-elements.png') });
      
      // Click sign up to test registration flow
      if (await signUpButton.isVisible()) {
        await signUpButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotDir, '03-signup-page.png') });
      }
    } else {
      console.log('⚠️ No auth elements found - might be already logged in');
    }
    
    // Test 3: Navigate to main dashboard/chat
    console.log('💬 Testing navigation to chat...');
    
    // Try different navigation options
    const chatLink = await page.locator('a[href="/chat"]').first();
    const dashboardLink = await page.locator('a[href="/dashboard"]').first();
    
    if (await chatLink.isVisible()) {
      await chatLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, '04-chat-page.png') });
    } else if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, '04-dashboard-page.png') });
    } else {
      // Try manual navigation
      await page.goto('http://localhost:3002/chat');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, '04-manual-chat.png') });
    }
    
    // Test 4: Test chat functionality
    console.log('🤖 Testing chat functionality...');
    
    // Look for chat input
    const chatInput = await page.locator('input[type="text"]').first();
    const textArea = await page.locator('textarea').first();
    
    let inputElement = null;
    if (await chatInput.isVisible()) {
      inputElement = chatInput;
    } else if (await textArea.isVisible()) {
      inputElement = textArea;
    }
    
    if (inputElement) {
      // Test with 2025-09-17 meeting query
      const testQuery = "What happened in the 2025-09-17 meetings? Tell me about any projects discussed.";
      await inputElement.fill(testQuery);
      await page.screenshot({ path: path.join(screenshotDir, '05-chat-input.png') });
      
      // Submit the message
      const sendButton = await page.locator('button[type="submit"]').first();
      if (await sendButton.isVisible()) {
        await sendButton.click();
      } else {
        await page.keyboard.press('Enter');
      }
      
      // Wait for response
      console.log('⏳ Waiting for AI response...');
      await page.waitForTimeout(5000);
      await page.screenshot({ path: path.join(screenshotDir, '06-chat-response.png') });
      
      // Check if response contains content
      const responseContent = await page.textContent('body');
      if (responseContent.includes('2025-09-17') || responseContent.includes('meeting') || responseContent.includes('project')) {
        console.log('✅ Chat response appears to contain relevant content');
      } else {
        console.log('⚠️ Chat response may not be working properly');
      }
    } else {
      console.log('❌ No chat input found');
    }
    
    // Test 5: Test API endpoints directly
    console.log('🔌 Testing API endpoints...');
    
    // Test health endpoint
    const healthResponse = await page.request.get('http://localhost:8001/health');
    console.log(`Health endpoint status: ${healthResponse.status()}`);
    
    // Test if we can reach any other endpoints
    try {
      const searchResponse = await page.request.post('http://localhost:8001/search', {
        data: {
          query: "2025-09-17 meetings",
          max_results: 5
        }
      });
      console.log(`Search endpoint status: ${searchResponse.status()}`);
      const searchData = await searchResponse.json();
      console.log('Search response:', searchData);
    } catch (error) {
      console.log('❌ Search endpoint error:', error.message);
    }
    
    // Test 6: Check console for errors
    console.log('🐛 Checking for JavaScript errors...');
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(`ERROR: ${msg.text()}`);
      }
    });
    
    await page.waitForTimeout(2000);
    if (consoleMessages.length > 0) {
      console.log('❌ JavaScript errors found:');
      consoleMessages.forEach(msg => console.log(msg));
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    // Take final screenshot
    await page.screenshot({ path: path.join(screenshotDir, '07-final-state.png') });
    
    console.log('✅ Comprehensive test completed!');
    console.log(`📸 Screenshots saved to: ${screenshotDir}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: path.join(screenshotDir, 'error-state.png') });
  } finally {
    await browser.close();
  }
}

// Run the test
comprehensiveTest();