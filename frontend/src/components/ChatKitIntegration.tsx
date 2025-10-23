/**
 * ChatKit Integration Component
 * This component provides a ChatKit-powered chat interface using the OpenAI Agent Builder workflow
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, MessageSquare } from "lucide-react";

// Define ChatKit types
interface ChatKitOptions {
  api: {
    getClientSecret: (currentSecret?: string) => Promise<string>;
  };
  theme?: 'light' | 'dark';
  header?: {
    title?: string;
    subtitle?: string;
  };
  composer?: {
    placeholder?: string;
  };
  messages?: {
    showFeedback?: boolean;
    showCopyButton?: boolean;
  };
  widgets?: {
    onAction?: (action: any, item: any) => Promise<void>;
  };
}

declare global {
  interface Window {
    ChatKit: any;
  }
}

interface ChatKitIntegrationProps {
  className?: string;
  apiUrl?: string;
}

export default function ChatKitIntegration({ 
  className = "", 
  apiUrl = process.env.NEXT_PUBLIC_AGENT_ENDPOINT || "http://localhost:8001" 
}: ChatKitIntegrationProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Function to create a new ChatKit session
  const createSession = async (): Promise<string> => {
    try {
      const response = await fetch('/api/chatkit/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase_token') || ''}`
        },
        body: JSON.stringify({
          workflow: { 
            id: "wf_68f9ed871f3881909581687179fba37f01b09bb8edcbabda" 
          },
          user: localStorage.getItem('user_id') || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const data = await response.json();
      return data.client_secret;
    } catch (err) {
      console.error('Error creating ChatKit session:', err);
      throw err;
    }
  };

  // Function to refresh an existing session
  const refreshSession = async (currentSecret: string): Promise<string> => {
    try {
      const response = await fetch('/api/chatkit/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase_token') || ''}`
        },
        body: JSON.stringify({
          currentClientSecret: currentSecret
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh session: ${response.statusText}`);
      }

      const data = await response.json();
      return data.client_secret;
    } catch (err) {
      console.error('Error refreshing ChatKit session:', err);
      throw err;
    }
  };

  // Load ChatKit script
  useEffect(() => {
    const loadChatKit = async () => {
      try {
        console.log('Loading ChatKit script...');
        // Check if script is already loaded
        if (window.ChatKit) {
          console.log('ChatKit already loaded');
          setIsLoading(false);
          return;
        }

        // Create script element
        const script = document.createElement('script');
        script.src = 'https://cdn.platform.openai.com/chatkit.js';
        script.async = true;

        // Handle script load
        script.onload = () => {
          console.log('ChatKit script loaded successfully');
          setIsLoading(false);
        };

        // Handle script error
        script.onerror = () => {
          console.error('Failed to load ChatKit script');
          setError('Failed to load ChatKit');
          setIsLoading(false);
        };

        // Add script to document
        document.head.appendChild(script);

        // Cleanup
        return () => {
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
        };
      } catch (err) {
        console.error('Error loading ChatKit:', err);
        setError('Failed to initialize ChatKit');
        setIsLoading(false);
      }
    };

    loadChatKit();
  }, []);

  // Initialize ChatKit once script is loaded
  useEffect(() => {
    console.log('ChatKit initialization check:', {
      hasWindow: !!window.ChatKit,
      hasContainer: !!chatContainerRef.current,
      isLoading
    });
    
    if (!window.ChatKit || !chatContainerRef.current || isLoading) {
      return;
    }

    const initializeChatKit = async () => {
      try {
        console.log('Initializing ChatKit...');
        
        // Clear container
        if (chatContainerRef.current) {
          chatContainerRef.current.innerHTML = '';
        }

        // Configure ChatKit options
        const options: ChatKitOptions = {
          api: {
            getClientSecret: async (currentSecret?: string) => {
              if (!currentSecret) {
                const secret = await createSession();
                setSessionToken(secret);
                return secret;
              }
              const secret = await refreshSession(currentSecret);
              setSessionToken(secret);
              return secret;
            }
          },
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
          header: {
            title: "Alleato Knowledge Assistant",
            subtitle: "Powered by OpenAI Agent Builder"
          },
          composer: {
            placeholder: "Ask me anything about your knowledge base..."
          },
          messages: {
            showFeedback: true,
            showCopyButton: true
          },
          widgets: {
            onAction: async (action: any, item: any) => {
              console.log('Widget action:', action, item);
              // Handle widget actions here if needed
            }
          }
        };

        // Use ChatKit.render method if available
        if (window.ChatKit && window.ChatKit.render) {
          console.log('Using ChatKit.render method...');
          const chatkit = window.ChatKit.render(chatContainerRef.current, options);
          
          // Store reference if needed
          (window as any).chatkitInstance = chatkit;
        } else {
          // Fallback: Create ChatKit element
          console.log('Using ChatKit element method...');
          const chatKitElement = document.createElement('openai-chatkit');
          chatKitElement.className = 'h-full w-full';
          
          if (chatContainerRef.current) {
            chatContainerRef.current.appendChild(chatKitElement);
          }
          
          // Try to set options
          if (typeof chatKitElement.setOptions === 'function') {
            chatKitElement.setOptions(options);
          } else {
            // Apply as attributes
            Object.assign(chatKitElement, options);
          }
        }

        // Listen for ChatKit events on the container
        if (chatContainerRef.current) {
          const container = chatContainerRef.current;
          
          container.addEventListener('chatkit.error', (event: any) => {
            console.error('ChatKit error:', event.detail);
            setError('ChatKit encountered an error');
          });

          container.addEventListener('chatkit.response.start', () => {
            console.log('ChatKit response started');
          });

          container.addEventListener('chatkit.response.end', () => {
            console.log('ChatKit response ended');
          });

          container.addEventListener('chatkit.thread.change', (event: any) => {
            console.log('ChatKit thread changed:', event.detail);
          });
        }

      } catch (err) {
        console.error('Error initializing ChatKit:', err);
        setError('Failed to initialize ChatKit');
      }
    };

    initializeChatKit();
  }, [isLoading, apiUrl]);

  // Handle theme changes
  useEffect(() => {
    if (!window.ChatKit || !chatContainerRef.current) return;

    const chatKitElement = chatContainerRef.current.querySelector('openai-chatkit');
    if (chatKitElement && chatKitElement.setOptions) {
      chatKitElement.setOptions({
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      });
    }
  }, []);

  if (isLoading) {
    return (
      <Card className={`flex items-center justify-center h-[600px] ${className}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading ChatKit...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`flex items-center justify-center h-[600px] ${className}`}>
        <div className="text-center">
          <MessageSquare className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-destructive mb-4">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div 
      ref={chatContainerRef}
      className={`h-[600px] w-full rounded-lg overflow-hidden ${className}`}
      style={{ minHeight: '600px' }}
    />
  );
}