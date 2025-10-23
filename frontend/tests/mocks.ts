import { Page } from '@playwright/test';

// Mock data
export const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  user_metadata: { full_name: 'Test User' }
};

export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser
};

// Setup authentication mocks - much simpler approach
export async function setupAuthenticatedMocks(page: Page) {
  await page.addInitScript(() => {
    // Create a global mock object that will replace modules
    window.__MOCK_AUTH__ = {
      user: {
        id: 'test-user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      },
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' }
        }
      },
      isAuthenticated: true
    };

    // Mock Supabase module
    const mockSupabase = {
      auth: {
        getSession: async () => ({ 
          data: { session: window.__MOCK_AUTH__.session }, 
          error: null 
        }),
        getUser: async () => ({ 
          data: { user: window.__MOCK_AUTH__.user }, 
          error: null 
        }),
        signInWithPassword: async () => ({
          data: { session: window.__MOCK_AUTH__.session, user: window.__MOCK_AUTH__.user },
          error: null
        }),
        signUp: async () => ({
          data: { session: window.__MOCK_AUTH__.session, user: window.__MOCK_AUTH__.user },
          error: null
        }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: (callback) => {
          // Immediately call with authenticated state
          setTimeout(() => callback('SIGNED_IN', window.__MOCK_AUTH__.session), 10);
          return { data: { subscription: { unsubscribe: () => {} } } };
        }
      },
      from: () => ({
        select: () => ({
          eq: () => ({ 
            order: () => Promise.resolve({ data: [], error: null }),
            single: () => Promise.resolve({ data: null, error: null })
          }),
          order: () => Promise.resolve({ data: [], error: null })
        }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => ({ 
          eq: () => Promise.resolve({ data: [], error: null })
        })
      })
    };

    // Override the module before it's imported
    window.__supabaseMock__ = mockSupabase;
  });
}

export async function setupUnauthenticatedMocks(page: Page) {
  await page.addInitScript(() => {
    window.__MOCK_AUTH__ = {
      user: null,
      session: null,
      isAuthenticated: false
    };

    const mockSupabase = {
      auth: {
        getSession: async () => ({ 
          data: { session: null }, 
          error: null 
        }),
        getUser: async () => ({ 
          data: { user: null }, 
          error: null 
        }),
        signInWithPassword: async (credentials) => {
          // Update auth state to simulate successful login
          window.__MOCK_AUTH__.user = {
            id: 'test-user-123',
            email: credentials.email,
            user_metadata: { full_name: 'Test User' }
          };
          window.__MOCK_AUTH__.session = {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
            user: window.__MOCK_AUTH__.user
          };
          window.__MOCK_AUTH__.isAuthenticated = true;
          
          // Simulate redirect after successful login
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
          
          return {
            data: { session: window.__MOCK_AUTH__.session, user: window.__MOCK_AUTH__.user },
            error: null
          };
        },
        signUp: async (credentials) => {
          // Update auth state to simulate successful signup
          window.__MOCK_AUTH__.user = {
            id: 'test-user-123',
            email: credentials.email,
            user_metadata: { full_name: 'Test User' }
          };
          window.__MOCK_AUTH__.session = {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
            user: window.__MOCK_AUTH__.user
          };
          window.__MOCK_AUTH__.isAuthenticated = true;
          
          // Simulate redirect after successful signup
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
          
          return {
            data: { session: window.__MOCK_AUTH__.session, user: window.__MOCK_AUTH__.user },
            error: null
          };
        },
        signOut: async () => ({ error: null }),
        onAuthStateChange: (callback) => {
          setTimeout(() => callback('SIGNED_OUT', null), 10);
          return { data: { subscription: { unsubscribe: () => {} } } };
        }
      },
      from: () => ({
        select: () => ({
          eq: () => ({ 
            order: () => Promise.resolve({ data: [], error: null }),
            single: () => Promise.resolve({ data: null, error: null })
          }),
          order: () => Promise.resolve({ data: [], error: null })
        }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => ({ 
          eq: () => Promise.resolve({ data: [], error: null })
        })
      })
    };

    window.__supabaseMock__ = mockSupabase;
  });
}

// Mock the agent API with proper streaming format
export async function setupAgentAPIMocks(page: Page) {
  await page.route('**/api/pydantic-agent', async (route) => {
    // The streaming format expects individual JSON objects on separate lines
    const mockResponse = `{"text": "Hello! I'm a mock AI assistant."}
{"complete": true, "session_id": "session-new", "conversation_title": "New Chat"}`;

    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
      },
      body: mockResponse
    });
  });
}

// Override module imports with proper ES module mocking for Next.js
export async function setupModuleMocks(page: Page) {
  // Intercept all imports of the supabase lib for Next.js structure
  await page.route('**/src/lib/supabase.ts', async (route) => {
    const mockCode = `
      // Export the mock supabase client that was set up in __supabaseMock__
      export const supabase = window.__supabaseMock__;
      export default window.__supabaseMock__;
    `;
    
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: mockCode
    });
  });

  // Also intercept the compiled version that might be used in Next.js
  await page.route('**/lib/supabase*', async (route) => {
    const mockCode = `
      export const supabase = window.__supabaseMock__;
      export default window.__supabaseMock__;
    `;
    
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: mockCode
    });
  });

  // Intercept Next.js specific paths
  await page.route('**/_next/**/*supabase*', async (route) => {
    const mockCode = `
      export const supabase = window.__supabaseMock__;
      export default window.__supabaseMock__;
    `;
    
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: mockCode
    });
  });
}

// Setup all mocks for authenticated state
export async function setupAllMocks(page: Page) {
  await setupAuthenticatedMocks(page);
  await setupAgentAPIMocks(page);
  await setupModuleMocks(page);
}