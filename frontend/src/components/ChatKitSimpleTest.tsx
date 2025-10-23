import React, { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    ChatKit: any;
  }
}

export default function ChatKitSimpleTest() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load ChatKit script
    const script = document.createElement('script');
    script.src = 'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js';
    script.async = true;

    script.onload = () => {
      console.log('ChatKit script loaded');
      setIsLoading(false);
      
      // Initialize ChatKit after script loads
      setTimeout(() => {
        if (containerRef.current && window.ChatKit) {
          console.log('Initializing ChatKit...');
          
          // Create the ChatKit element
          const chatKitElement = document.createElement('openai-chatkit');
          chatKitElement.className = 'chatkit-element';
          
          // Clear container and add element
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(chatKitElement);
          
          // Try to initialize with minimal options
          try {
            const options = {
              api: {
                getClientSecret: async () => {
                  // Return a dummy token for testing
                  console.log('getClientSecret called');
                  return 'test-client-secret';
                }
              }
            };
            
            // Check if setOptions exists
            if (chatKitElement.setOptions) {
              chatKitElement.setOptions(options);
            } else {
              console.log('setOptions not found, trying direct assignment');
              Object.assign(chatKitElement, options);
            }
            
            console.log('ChatKit initialized');
          } catch (err) {
            console.error('Error initializing ChatKit:', err);
            setError('Failed to initialize ChatKit');
          }
        }
      }, 100);
    };

    script.onerror = () => {
      console.error('Failed to load ChatKit script');
      setError('Failed to load ChatKit script');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex items-center justify-center h-[600px]">
        <div className="text-red-500">{error}</div>
      </Card>
    );
  }

  return (
    <Card className="p-0 h-[600px] overflow-hidden">
      <div 
        ref={containerRef} 
        className="h-full w-full"
        style={{ minHeight: '600px' }}
      />
    </Card>
  );
}