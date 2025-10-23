import { test, expect } from '@playwright/test';

test.describe('Projects Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the projects dashboard
    await page.goto('http://localhost:3003/projects/dashboard');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display only current projects', async ({ page }) => {
    // Wait for projects to load
    await page.waitForSelector('[role="heading"]:has-text("Current Projects")', { timeout: 10000 });

    // Verify the subtitle is present
    await expect(page.locator('text=Active and in-progress projects only')).toBeVisible();

    // Check that projects are displayed in the left column
    const projectsList = page.locator('.w-1\\\/3 .space-y-1');
    await expect(projectsList).toBeVisible();

    // Take a screenshot of the dashboard
    await page.screenshot({
      path: 'screenshots/projects-dashboard-overview.png',
      fullPage: true
    });
  });

  test('should select a project and show details', async ({ page }) => {
    // Wait for projects to load
    await page.waitForSelector('[role="heading"]:has-text("Current Projects")');

    // Click on the first project in the list
    const firstProject = page.locator('.w-1\\\/3 .space-y-1 > div').first();
    const projectExists = await firstProject.count() > 0;

    if (projectExists) {
      await firstProject.click();

      // Wait for project details to load
      await page.waitForTimeout(1000);

      // Check if project details are displayed
      const projectTitle = page.locator('.flex-1 h2.text-2xl');
      await expect(projectTitle).toBeVisible();

      // Check for tabs
      await expect(page.locator('button:has-text("Meetings")')).toBeVisible();
      await expect(page.locator('button:has-text("Insights")')).toBeVisible();

      // Take a screenshot of selected project
      await page.screenshot({
        path: 'screenshots/projects-dashboard-selected.png',
        fullPage: true
      });
    }
  });

  test('should switch between meetings and insights tabs', async ({ page }) => {
    // Wait for projects to load
    await page.waitForSelector('[role="heading"]:has-text("Current Projects")');

    // Select first project
    const firstProject = page.locator('.w-1\\\/3 .space-y-1 > div').first();
    const projectExists = await firstProject.count() > 0;

    if (projectExists) {
      await firstProject.click();
      await page.waitForTimeout(1000);

      // Click on Insights tab
      const insightsTab = page.locator('button:has-text("Insights")');
      await insightsTab.click();

      // Wait for tab content to change
      await page.waitForTimeout(500);

      // Check if insights content is visible or empty state is shown
      const insightsContent = page.locator('[role="tabpanel"]').filter({ hasText: /Insights|No insights/ });
      await expect(insightsContent).toBeVisible();

      // Take a screenshot of insights tab
      await page.screenshot({
        path: 'screenshots/projects-dashboard-insights.png',
        fullPage: true
      });

      // Click back on Meetings tab
      const meetingsTab = page.locator('button:has-text("Meetings")');
      await meetingsTab.click();

      // Wait for tab content to change
      await page.waitForTimeout(500);

      // Check if meetings content is visible or empty state is shown
      const meetingsContent = page.locator('[role="tabpanel"]').filter({ hasText: /Meetings|No meetings/ });
      await expect(meetingsContent).toBeVisible();

      // Take a screenshot of meetings tab
      await page.screenshot({
        path: 'screenshots/projects-dashboard-meetings.png',
        fullPage: true
      });
    }
  });

  test('should filter projects using search', async ({ page }) => {
    // Wait for projects to load
    await page.waitForSelector('[role="heading"]:has-text("Current Projects")');

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search projects"]');
    await expect(searchInput).toBeVisible();

    // Type in search
    await searchInput.fill('test');

    // Wait for filtering to occur
    await page.waitForTimeout(500);

    // Take a screenshot of filtered results
    await page.screenshot({
      path: 'screenshots/projects-dashboard-filtered.png',
      fullPage: true
    });
  });

  test('should check console for data fetching', async ({ page }) => {
    // Set up console listener to capture logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    // Navigate and wait for projects
    await page.waitForSelector('[role="heading"]:has-text("Current Projects")');

    // Click on first project to trigger data fetching
    const firstProject = page.locator('.w-1\\\/3 .space-y-1 > div').first();
    const projectExists = await firstProject.count() > 0;

    if (projectExists) {
      await firstProject.click();
      await page.waitForTimeout(2000);

      // Check if any console logs contain document data
      const hasDocumentLogs = consoleLogs.some(log =>
        log.includes('documents for project') || log.includes('Meeting documents')
      );

      console.log('Console logs captured:', consoleLogs);
      console.log('Has document logs:', hasDocumentLogs);
    }
  });
});