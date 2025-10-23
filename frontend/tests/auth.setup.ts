import { test as setup, expect } from '@playwright/test';

const authFile = '.auth/user.json';

// Test credentials - these should be consistent across all tests
const TEST_EMAIL = 'playwright.test@example.com';
const TEST_PASSWORD = 'TestPassword123!';

setup('authenticate', async ({ page }) => {
  // First, try to log in with existing test account
  await page.goto('/auth/login');

  // Wait for the login form to be visible
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });

  // Fill in the login form with test credentials
  await page.locator('input[type="email"]').fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);

  // Submit the form
  await page.locator('button[type="submit"]').click();

  // Wait for response - either successful login or error
  await page.waitForTimeout(2000);

  // Check if we successfully logged in or need to create account
  const currentUrl = page.url();

  if (currentUrl.includes('/auth/login')) {
    // Login failed, might need to create account
    console.log('Login failed, attempting to create test account...');

    // Navigate to sign up page
    await page.click('a[href="/auth/sign-up"]');
    await page.waitForURL('**/auth/sign-up');

    // Fill sign up form - be specific about which password field
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);

    // Fill repeat password field if it exists
    const repeatPasswordField = page.locator('input[type="password"]').nth(1);
    if (await repeatPasswordField.isVisible()) {
      await repeatPasswordField.fill(TEST_PASSWORD);
    }

    // Submit sign up form
    await page.locator('button[type="submit"]').click();

    // Wait for sign up to complete
    await page.waitForTimeout(3000);

    // Now try to log in again if we're back at login
    if (page.url().includes('/auth/login')) {
      await page.locator('input[type="email"]').fill(TEST_EMAIL);
      await page.locator('input[type="password"]').fill(TEST_PASSWORD);
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);
    }
  }

  // Verify we're logged in by checking we're not on auth pages anymore
  await expect(page).not.toHaveURL(/\/auth\/(login|sign-up)/);

  // Save the authentication state to file
  await page.context().storageState({ path: authFile });

  console.log('Authentication setup completed and state saved to', authFile);
});