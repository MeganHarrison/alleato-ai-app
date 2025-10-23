import { Page, BrowserContext } from '@playwright/test';

/**
 * Mock Supabase authentication for tests
 */
export async function mockSupabaseAuth(context: BrowserContext) {
  // Add cookies and local storage for authenticated session
  await context.addCookies([
    {
      name: 'sb-auth-token',
      value: 'mock-auth-token',
      domain: 'localhost',
      path: '/',
      expires: Date.now() / 1000 + 3600,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    }
  ]);
}

/**
 * Setup authenticated session with required tokens
 */
export async function setupAuthenticatedSession(page: Page) {
  // Set up local storage with auth tokens
  await page.addInitScript(() => {
    // Mock Supabase auth data
    const mockUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2024-01-01T00:00:00Z'
    };

    const mockSession = {
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: mockUser,
      expires_at: Date.now() / 1000 + 3600
    };

    // Set auth data in local storage
    localStorage.setItem('supabase.auth.token', JSON.stringify({
      currentSession: mockSession,
      expiresAt: mockSession.expires_at
    }));
    
    localStorage.setItem('supabase_token', 'mock-access-token');
    localStorage.setItem('user_id', 'test-user-123');
    
    // Mock Supabase client
    window.supabase = {
      auth: {
        getSession: async () => ({ data: { session: mockSession }, error: null }),
        getUser: async () => ({ data: { user: mockUser }, error: null }),
        onAuthStateChange: (callback) => {
          callback('SIGNED_IN', mockSession);
          return { data: { subscription: { unsubscribe: () => {} } } };
        }
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: [], error: null }),
        update: () => ({ data: [], error: null }),
        delete: () => ({ data: [], error: null })
      })
    };
  });
}

/**
 * Login helper for test scenarios
 */
export async function loginUser(page: Page, email: string = 'test@example.com', password: string = 'testpassword') {
  // Navigate to login page
  await page.goto('/login');
  
  // Fill in credentials
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // Mock successful login response
  await page.route('**/auth/v1/token*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'test-user-123',
          email: email,
          role: 'authenticated'
        }
      })
    });
  });
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for redirect
  await page.waitForURL('/', { timeout: 5000 });
}

/**
 * Logout helper
 */
export async function logoutUser(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  await page.goto('/login');
}