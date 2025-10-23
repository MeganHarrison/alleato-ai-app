/**
 * Mock server for ChatKit API endpoints
 * Used for testing ChatKit integration without real API calls
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';

export class ChatKitMockServer {
  private server: any;
  private port: number = 8002; // Different from main API port
  
  // Store sessions for testing
  private sessions: Map<string, any> = new Map();
  
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
        const { pathname, query } = parse(req.url || '', true);
        
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        // Handle preflight
        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }
        
        // Route handlers
        if (pathname === '/api/chatkit/sessions' && req.method === 'POST') {
          this.handleCreateSession(req, res);
        } else if (pathname === '/api/chatkit/refresh' && req.method === 'POST') {
          this.handleRefreshSession(req, res);
        } else if (pathname === '/api/chatkit/message' && req.method === 'POST') {
          this.handleMessage(req, res);
        } else if (pathname === '/api/chatkit/health' && req.method === 'GET') {
          this.handleHealth(req, res);
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      });
      
      this.server.listen(this.port, () => {
        console.log(`ChatKit mock server running on port ${this.port}`);
        resolve();
      });
    });
  }
  
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('ChatKit mock server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
  
  private handleCreateSession(req: IncomingMessage, res: ServerResponse) {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        // Generate mock session
        const sessionId = `session_${Date.now()}`;
        const clientSecret = `cs_${sessionId}_${Math.random().toString(36).substr(2, 9)}`;
        
        const session = {
          session_id: sessionId,
          client_secret: clientSecret,
          workflow_id: data.workflow?.id || 'wf_default',
          user_id: data.user || 'test_user',
          created_at: new Date().toISOString(),
          expires_at: Date.now() + 3600000 // 1 hour
        };
        
        this.sessions.set(clientSecret, session);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          client_secret: clientSecret,
          session_id: sessionId,
          expires_at: session.expires_at
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'Invalid request' }));
      }
    });
  }
  
  private handleRefreshSession(req: IncomingMessage, res: ServerResponse) {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const oldSession = this.sessions.get(data.currentClientSecret);
        
        if (!oldSession) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ detail: 'Invalid session' }));
          return;
        }
        
        // Create new session
        const sessionId = `session_refreshed_${Date.now()}`;
        const clientSecret = `cs_${sessionId}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newSession = {
          ...oldSession,
          session_id: sessionId,
          client_secret: clientSecret,
          created_at: new Date().toISOString(),
          expires_at: Date.now() + 3600000
        };
        
        // Delete old session
        this.sessions.delete(data.currentClientSecret);
        this.sessions.set(clientSecret, newSession);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          client_secret: clientSecret,
          session_id: sessionId,
          expires_at: newSession.expires_at
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'Invalid request' }));
      }
    });
  }
  
  private handleMessage(req: IncomingMessage, res: ServerResponse) {
    // Extract authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ detail: 'Unauthorized' }));
      return;
    }
    
    const clientSecret = authHeader.substring(7);
    const session = this.sessions.get(clientSecret);
    
    if (!session) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ detail: 'Invalid session' }));
      return;
    }
    
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        // Set SSE headers
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no'
        });
        
        // Simulate streaming response
        const events = [
          { type: 'ack', timestamp: new Date().toISOString() },
          { type: 'progress', name: 'Query Rewrite', status: 'started' },
          { type: 'progress', name: 'Query Rewrite', status: 'completed', output: `Rewritten: ${data.message}` },
          { type: 'progress', name: 'Classification', status: 'started' },
          { type: 'progress', name: 'Classification', status: 'completed', output: 'q-and-a' },
          { type: 'progress', name: 'Internal Q&A', status: 'started' },
          { type: 'message', role: 'assistant', content: `Mock response to: "${data.message}"\n\nThis is a simulated response from the ChatKit integration test server.`, thread_id: 'thread_test' },
          { type: 'done', timestamp: new Date().toISOString() }
        ];
        
        // Send events with delay
        let index = 0;
        const sendEvent = () => {
          if (index < events.length) {
            res.write(`data: ${JSON.stringify(events[index])}\n\n`);
            index++;
            setTimeout(sendEvent, 100); // 100ms between events
          } else {
            res.end();
          }
        };
        
        sendEvent();
        
      } catch (error) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Invalid request' })}\n\n`);
        res.end();
      }
    });
  }
  
  private handleHealth(req: IncomingMessage, res: ServerResponse) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      sessions_count: this.sessions.size
    }));
  }
  
  // Helper methods for testing
  public getSessionCount(): number {
    return this.sessions.size;
  }
  
  public clearSessions(): void {
    this.sessions.clear();
  }
  
  public getSession(clientSecret: string): any {
    return this.sessions.get(clientSecret);
  }
}