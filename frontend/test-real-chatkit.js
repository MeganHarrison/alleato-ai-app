const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true 
  });
  const page = await browser.newPage();
  
  // Log console messages
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  
  // Log errors
  page.on('error', err => {
    console.error('Page error:', err);
  });
  
  page.on('pageerror', err => {
    console.error('Page error:', err);
  });
  
  console.log('Navigating to ChatKit page...');
  await page.goto('http://localhost:3000/chatkit', { waitUntil: 'networkidle2' });
  
  console.log('Page loaded. Waiting for ChatKit to initialize...');
  await page.waitForTimeout(5000);
  
  // Check if ChatKit loaded
  const hasOpenAIChatKit = await page.evaluate(() => {
    return document.querySelector('openai-chatkit') !== null;
  });
  console.log('Has openai-chatkit element:', hasOpenAIChatKit);
  
  // Check if window.ChatKit exists
  const hasChatKitGlobal = await page.evaluate(() => {
    return typeof window.ChatKit !== 'undefined';
  });
  console.log('Has window.ChatKit:', hasChatKitGlobal);
  
  // Check for error messages
  const errorElement = await page.$('[class*="destructive"]');
  if (errorElement) {
    const errorText = await errorElement.textContent();
    console.log('Error on page:', errorText);
  }
  
  // Take screenshot
  await page.screenshot({ path: 'real-chatkit-test.png', fullPage: true });
  console.log('Screenshot saved');
  
  // Keep open for manual inspection
  console.log('Browser will stay open for manual inspection...');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();