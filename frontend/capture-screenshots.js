const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to clients page
  console.log('Navigating to clients page...');
  await page.goto('http://localhost:3002/clients');
  await page.waitForTimeout(3000);
  
  const clientsTitle = await page.locator('h1').textContent().catch(() => 'Not found');
  console.log('Clients page title:', clientsTitle);
  
  await page.screenshot({ 
    path: 'test-results/actual-clients-page.png',
    fullPage: true 
  });
  console.log('✅ Clients screenshot saved');

  // Navigate to companies page
  console.log('Navigating to companies page...');
  await page.goto('http://localhost:3002/companies');
  await page.waitForTimeout(3000);
  
  const companiesTitle = await page.locator('h1').textContent().catch(() => 'Not found');
  console.log('Companies page title:', companiesTitle);
  
  await page.screenshot({ 
    path: 'test-results/actual-companies-page.png',
    fullPage: true 
  });
  console.log('✅ Companies screenshot saved');

  // Navigate to contacts page
  console.log('Navigating to contacts page...');
  await page.goto('http://localhost:3002/contacts');
  await page.waitForTimeout(3000);
  
  const contactsTitle = await page.locator('h1').textContent().catch(() => 'Not found');
  console.log('Contacts page title:', contactsTitle);
  
  await page.screenshot({ 
    path: 'test-results/actual-contacts-page.png',
    fullPage: true 
  });
  console.log('✅ Contacts screenshot saved');

  await browser.close();
  console.log('\n✅ All screenshots captured successfully!');
})();
