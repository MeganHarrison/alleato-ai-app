# ChatKit Testing Guide

This guide covers the comprehensive test suite for the ChatKit integration, including unit tests, end-to-end tests, and visual regression tests using Playwright.

## Overview

The ChatKit test suite includes:

- **E2E Tests**: Full user journey testing including session creation, messaging, and UI interactions
- **API Integration Tests**: Testing the complete workflow execution and API responses
- **Visual Regression Tests**: Ensuring UI consistency across different states and viewports
- **Mock Server**: Simulating ChatKit backend for isolated testing

## Test Structure

```
frontend/tests/
├── chatkit/
│   ├── chatkit.spec.ts           # Main E2E tests
│   ├── chatkit-api.spec.ts       # API integration tests
│   └── chatkit-visual.spec.ts    # Visual regression tests
├── helpers/
│   ├── auth.ts                   # Authentication helpers
│   └── chatkit-mock-server.ts    # Mock server implementation
└── global-setup.ts               # Global test setup
```

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   npm install -D @playwright/test
   npx playwright install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.test
   # Configure test environment variables
   ```

### Test Commands

```bash
# Run all ChatKit tests
npm run test:chatkit

# Run tests with UI mode (interactive)
npm run test:chatkit:ui

# Run tests in headed mode (see browser)
npm run test:chatkit:headed

# Debug tests with Playwright inspector
npm run test:chatkit:debug

# Run specific test file
npx playwright test tests/chatkit/chatkit.spec.ts

# Run with specific browser
npx playwright test --project=chatkit-tests --browser=firefox

# Update visual regression snapshots
npx playwright test --update-snapshots
```

## Test Scenarios

### 1. Basic Functionality Tests

**Page Loading**
- Verify ChatKit page loads successfully
- Check all UI elements are present
- Validate feature badges and information sections

**ChatKit Initialization**
- Ensure ChatKit script loads
- Verify widget renders correctly
- Check initial configuration is applied

**Session Management**
- Test session creation with mock API
- Verify session refresh functionality
- Handle session expiration scenarios

### 2. Message Handling Tests

**Basic Messaging**
- Send user messages
- Receive assistant responses
- Verify message display in UI

**Workflow Execution**
- Test complete Q&A workflow
- Test fact-finding workflow
- Test general response workflow
- Verify workflow steps are tracked

**Streaming Responses**
- Handle Server-Sent Events
- Display progress indicators
- Stream message content

### 3. UI Interaction Tests

**Input Handling**
- Type and send messages
- Handle Enter key submission
- Clear input after sending

**Tab Navigation**
- Switch between example query tabs
- Verify content changes correctly

**Responsive Design**
- Test mobile viewport (375x812)
- Test tablet viewport (768x1024)
- Verify layout adjustments

### 4. Error Handling Tests

**API Errors**
- Handle 500 server errors
- Handle 401 authentication errors
- Handle 429 rate limiting
- Maintain UI functionality during errors

**Network Issues**
- Handle connection failures
- Test timeout scenarios
- Verify retry mechanisms

### 5. Visual Regression Tests

**Layout Consistency**
- Full page screenshots
- Widget appearance
- Dark mode styling
- Mobile/tablet layouts

**Component States**
- Empty chat state
- Active conversation
- Loading indicators
- Error states

**Feature Sections**
- Workflow visualization
- Features display
- Example queries tabs

## Mock Server

The test suite includes a mock ChatKit server that simulates:

- Session creation and management
- Message streaming with SSE
- Workflow progress events
- Error scenarios

### Mock Server Endpoints

```typescript
POST /api/chatkit/sessions    // Create new session
POST /api/chatkit/refresh     // Refresh session
POST /api/chatkit/message     // Handle messages
GET  /api/chatkit/health      // Health check
```

## Authentication

Tests use mock authentication to simulate logged-in users:

```typescript
// Mock Supabase auth
await mockSupabaseAuth(context);

// Setup authenticated session
await setupAuthenticatedSession(page);
```

## Best Practices

### 1. Test Isolation

- Each test should be independent
- Clean up state between tests
- Use fresh sessions for each test

### 2. Waiting Strategies

```typescript
// Wait for ChatKit to load
await page.waitForSelector('openai-chatkit', { timeout: 30000 });

// Wait for specific text
await page.waitForSelector('text=Response text', { timeout: 10000 });

// Wait for network idle
await page.waitForLoadState('networkidle');
```

### 3. Mock Data

- Use consistent mock responses
- Test edge cases with specific mocks
- Simulate real-world scenarios

### 4. Visual Testing

- Disable animations for consistency
- Use stable selectors
- Test across different themes

## Debugging Tests

### 1. Debug Mode

```bash
# Run with Playwright Inspector
PWDEBUG=1 npm run test:chatkit

# Slow down execution
PLAYWRIGHT_SLOWMO=1000 npm run test:chatkit
```

### 2. Screenshots and Videos

Failed tests automatically capture:
- Screenshots at point of failure
- Video recordings of test execution
- HTML reports with all artifacts

### 3. Trace Viewer

```bash
# View test traces
npx playwright show-trace trace.zip
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run ChatKit tests
  run: npm run test:chatkit

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Common Issues and Solutions

### 1. ChatKit Script Loading

**Issue**: ChatKit script fails to load
**Solution**: Check CSP headers, verify mock script is properly configured

### 2. Session Timeout

**Issue**: Tests fail due to session expiration
**Solution**: Use fresh sessions, increase timeout values

### 3. Visual Regression Failures

**Issue**: Screenshots don't match
**Solution**: Update snapshots if changes are intentional:
```bash
npx playwright test --update-snapshots
```

### 4. Flaky Tests

**Issue**: Tests pass/fail inconsistently
**Solution**: 
- Add proper wait conditions
- Increase timeouts for slow operations
- Use retry mechanisms

## Performance Testing

Monitor test performance:

```typescript
// Measure response times
const startTime = Date.now();
await page.click('button');
await page.waitForSelector('.response');
const responseTime = Date.now() - startTime;
expect(responseTime).toBeLessThan(3000);
```

## Accessibility Testing

Include accessibility checks:

```typescript
// Check ARIA attributes
await expect(chatInput).toHaveAttribute('aria-label', 'Chat input');

// Verify keyboard navigation
await page.keyboard.press('Tab');
await expect(sendButton).toBeFocused();
```

## Test Reports

After running tests, view reports:

```bash
# Open HTML report
npx playwright show-report

# View test results
cat test-results/junit.xml
```

Reports include:
- Test execution summary
- Screenshots and videos
- Error stack traces
- Performance metrics

## Extending Tests

To add new test scenarios:

1. Create new test file in `tests/chatkit/`
2. Import necessary helpers
3. Follow existing patterns
4. Update documentation

Example:

```typescript
test('new scenario', async ({ page }) => {
  await setupAuthenticatedSession(page);
  await page.goto('/chatkit');
  // Add test logic
});
```