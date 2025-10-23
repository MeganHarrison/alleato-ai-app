const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Navigating to ChatKit page...');
  await page.goto('http://localhost:3000/chatkit');
  
  console.log('Waiting for page to load...');
  await page.waitForLoadState('networkidle');
  
  // Check if the page loaded
  const title = await page.textContent('h1');
  console.log('Page title:', title);
  
  // Check which mode is active
  const activeTab = await page.locator('[role="tab"][aria-selected="true"]').textContent();
  console.log('Active mode:', activeTab);
  
  // Look for the chat input
  const hasTextarea = await page.locator('textarea').count() > 0;
  console.log('Has textarea:', hasTextarea);
  
  if (hasTextarea) {
    // Try to type a message
    console.log('Typing test message...');
    await page.fill('textarea', 'Hello, this is a test message!');
    
    // Check if send button exists
    const hasSendButton = await page.locator('button:has(svg[class*="send"])').count() > 0;
    console.log('Has send button:', hasSendButton);
    
    if (hasSendButton) {
      console.log('Clicking send button...');
      await page.locator('button:has(svg[class*="send"])').click();
      
      // Wait for response
      await page.waitForTimeout(2000);
      
      // Check for messages
      const messages = await page.locator('[class*="message"]').count();
      console.log('Number of messages:', messages);
    }
  } else {
    console.log('No textarea found - checking for ChatKit element...');
    
    // Check for openai-chatkit element
    const hasChatKit = await page.locator('openai-chatkit').count() > 0;
    console.log('Has openai-chatkit element:', hasChatKit);
    
    // Try switching to Simple ChatKit mode
    const simpleTab = await page.locator('button[role="tab"]:has-text("Simple ChatKit")');
    if (await simpleTab.count() > 0) {
      console.log('Clicking Simple ChatKit tab...');
      await simpleTab.click();
      await page.waitForTimeout(2000);
      
      const hasSimpleChatKit = await page.locator('openai-chatkit').count() > 0;
      console.log('Has openai-chatkit element after switching:', hasSimpleChatKit);
    }
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'chatkit-test.png', fullPage: true });
  console.log('Screenshot saved as chatkit-test.png');
  
  // Keep browser open for 5 seconds
  await page.waitForTimeout(5000);
  
  await browser.close();
})();