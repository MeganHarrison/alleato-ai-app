/**
 * Agent Builder Chat Component
 * Direct integration with OpenAI Agent Builder workflow
 * No ChatKit SDK needed - uses direct API calls
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Bot, User, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    step?: string;
    status?: string;
  };
}

export default function AgentBuilderChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Use Next.js API routes instead of direct backend calls
      
      // Create session if needed
      if (!clientSecret) {
        console.log('Creating new session...');
        const sessionRes = await fetch('/api/chatkit/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflow: { 
              id: "wf_68f9ed871f3881909581687179fba37f01b09bb8edcbabda" 
            }
          })
        });
        
        if (!sessionRes.ok) {
          throw new Error('Failed to create session');
        }
        
        const data = await sessionRes.json();
        console.log('Session created:', data);
        setSessionId(data.session_id);
        setClientSecret(data.client_secret);
      }

      // Use the current client secret for auth
      const currentClientSecret = clientSecret || sessionId || 'test-session';
      
      console.log('Sending message with auth:', currentClientSecret);
      
      // Send message and stream response via Next.js API route
      const response = await fetch('/api/chatkit/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentClientSecret}`
        },
        body: JSON.stringify({
          message: userMessage.content,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'step') {
                  // Add system message for workflow steps
                  setMessages(prev => [...prev, {
                    id: `system-${Date.now()}`,
                    role: 'system',
                    content: `${data.step}: ${data.status}`,
                    timestamp: new Date(),
                    metadata: { step: data.step, status: data.status }
                  }]);
                } else if (data.type === 'message') {
                  assistantMessage = data.content;
                } else if (data.type === 'done') {
                  // Add the complete assistant message
                  if (assistantMessage) {
                    setMessages(prev => [...prev, {
                      id: `assistant-${Date.now()}`,
                      role: 'assistant',
                      content: assistantMessage,
                      timestamp: new Date()
                    }]);
                  }
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      
      // Add error message
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        role: 'system',
        content: 'Failed to get response. Please check if the backend is running.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardContent className="flex-1 p-4 flex flex-col">
        {/* Messages Area */}
        <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation with your AI Agent</p>
                <p className="text-sm mt-2">Powered by OpenAI Agent Builder</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.role === 'system'
                        ? 'bg-muted/50 text-muted-foreground italic text-sm'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role !== 'system' && (
                      <div className="flex items-center gap-2 mb-1">
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                        <span className="text-xs font-semibold">
                          {message.role === 'user' ? 'You' : 'AI Agent'}
                        </span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <br />
              <span className="text-xs">Make sure the backend is running on port 8001</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Input Area */}
        <div className="border-t pt-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your knowledge base..."
              className="resize-none"
              rows={2}
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[72px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Workflow ID: wf_68f9ed871f3881909581687179fba37f01b09bb8edcbabda
          </p>
        </div>
      </CardContent>
    </Card>
  );
}