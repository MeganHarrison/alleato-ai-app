/**
 * Real ChatKit Integration Component
 * Uses the proper OpenAI ChatKit SDK integration method
 */

import React, { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'openai-chatkit': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        workflow?: string;
        'client-secret'?: string;
      }, HTMLElement>;
    }
  }
}

interface ChatKitRealProps {
  className?: string;
}

export default function ChatKitReal({ className = "" }: ChatKitRealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Load ChatKit script
  useEffect(() => {
    const loadScript = async () => {
      try {
        // Check if already loaded
        const existingScript = document.querySelector('script[src*="chatkit.js"]');
        if (existingScript) {
          setIsLoading(false);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.platform.openai.com/chatkit.js';
        script.async = true;

        script.onload = () => {
          console.log('ChatKit script loaded');
          setIsLoading(false);
        };

        script.onerror = () => {
          console.error('Failed to load ChatKit script');
          setError('Failed to load ChatKit SDK');
          setIsLoading(false);
        };

        document.head.appendChild(script);

      } catch (err) {
        console.error('Error loading ChatKit:', err);
        setError('Failed to initialize ChatKit');
        setIsLoading(false);
      }
    };

    loadScript();
  }, []);

  // Create session
  useEffect(() => {
    const createSession = async () => {
      try {
        console.log('Creating ChatKit session...');
        const response = await fetch('/api/chatkit/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workflow: { 
              id: "wf_68f9ed871f3881909581687179fba37f01b09bb8edcbabda" 
            }
          })
        });

        console.log('Session response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Session creation failed:', errorText);
          throw new Error(`Failed to create session: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        setClientSecret(data.client_secret);
        console.log('ChatKit session created:', data.session_id);
      } catch (err) {
        console.error('Error creating session:', err);
        setError('Failed to create ChatKit session');
      }
    };

    if (!isLoading && !clientSecret && !error) {
      createSession();
    }
  }, [isLoading, clientSecret, error]);

  // Initialize ChatKit element
  useEffect(() => {
    if (!isLoading && clientSecret && containerRef.current) {
      const existingChatKit = containerRef.current.querySelector('openai-chatkit');
      if (existingChatKit) {
        existingChatKit.remove();
      }

      // Create ChatKit element
      const chatKitElement = document.createElement('openai-chatkit');
      chatKitElement.setAttribute('workflow', 'wf_68f9ed871f3881909581687179fba37f01b09bb8edcbabda');
      
      // Set configuration as a property
      (chatKitElement as any).setOptions = async function(options: any) {
        console.log('ChatKit options:', options);
      };

      // Configure the element
      (chatKitElement as any).api = {
        getClientSecret: async (currentSecret?: string) => {
          if (currentSecret) {
            // Refresh session
            try {
              const response = await fetch('/api/chatkit/refresh', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  currentClientSecret: currentSecret
                })
              });

              if (!response.ok) {
                throw new Error('Failed to refresh session');
              }

              const data = await response.json();
              return data.client_secret;
            } catch (err) {
              console.error('Error refreshing session:', err);
              throw err;
            }
          }
          return clientSecret;
        }
      };

      // Add to container
      containerRef.current.appendChild(chatKitElement);
      console.log('ChatKit element added to DOM');

      // Listen for events
      chatKitElement.addEventListener('chatkit.error', (event: any) => {
        console.error('ChatKit error:', event.detail);
      });

      chatKitElement.addEventListener('chatkit.ready', () => {
        console.log('ChatKit ready');
      });
    }
  }, [isLoading, clientSecret]);

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
        <div className="text-center max-w-md">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-destructive mb-4">{error}</p>
          <Alert className="mb-4">
            <AlertDescription className="text-left">
              <strong>Troubleshooting:</strong>
              <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                <li>Ensure the backend is running on port 8001</li>
                <li>Check browser console for errors</li>
                <li>Verify your workflow ID is correct</li>
                <li>Try refreshing the page</li>
              </ul>
            </AlertDescription>
          </Alert>
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
    <div className={`${className}`}>
      <div 
        ref={containerRef}
        className="h-[600px] w-full rounded-lg overflow-hidden bg-background border"
        style={{ minHeight: '600px' }}
      >
        {/* ChatKit element will be inserted here */}
      </div>
      {!clientSecret && (
        <div className="mt-4 text-center">
          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
          <span className="text-sm text-muted-foreground">Creating session...</span>
        </div>
      )}
    </div>
  );
}