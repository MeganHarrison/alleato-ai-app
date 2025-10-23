import { test, expect } from '@playwright/test';
import { setupUnauthenticatedMocks, setupAgentAPIMocks, setupModuleMocks } from './mocks';

test('basic test - page loads', async ({ page }) => {
  await setupUnauthenticatedMocks(page);
  await setupAgentAPIMocks(page);
  await setupModuleMocks(page);
  
  await page.goto('/');
  
  // Just verify the page loads
  await expect(page).toHaveTitle(/Dynamous/);
});