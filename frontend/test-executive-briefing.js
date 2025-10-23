const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Opening project dashboard...');
  await page.goto('http://localhost:3000/projects/dashboard');
  
  // Wait for the page to load
  await page.waitForTimeout(3000);
  
  // Take a screenshot
  await page.screenshot({ path: 'screenshots/executive-briefing.png', fullPage: true });
  console.log('Screenshot saved to screenshots/executive-briefing.png');
  
  // Check if redirected to login
  const currentURL = page.url();
  if (currentURL.includes('/auth/login')) {
    console.log('Redirected to login page - authentication required');
  } else {
    console.log('Page loaded successfully:', currentURL);
    
    // Try to get page content
    const title = await page.textContent('h1');
    console.log('Page title:', title);
  }
  
  await browser.close();
})();
