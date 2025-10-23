import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined, // Allow 2 workers in CI for better parallelization
  reporter: process.env.CI ? [['github'], ['html']] : 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  timeout: 30000, // Overall test timeout

  projects: [
    // Setup project
    { 
      name: 'setup', 
      testMatch: /.*\.setup\.ts/ 
    },
    
    // Authenticated tests
    {
      name: 'chromium-authenticated',
      use: { 
        ...devices['Desktop Chrome'],
        // Use auth state from setup
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /.*\.setup\.ts/,
    },
    
    // Unauthenticated tests (for testing login flow)
    {
      name: 'chromium-unauthenticated',
      use: {
        ...devices['Desktop Chrome'],
      },
      testMatch: /.*\.(auth|validate-tables-with-mock|validate-crud-no-auth|capture-real-screenshots)\.spec\.ts/,
    },
    
    // ChatKit tests
    {
      name: 'chatkit-tests',
      use: {
        ...devices['Desktop Chrome'],
        // Use auth state from setup
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /.*chatkit.*\.spec\.ts/,
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});