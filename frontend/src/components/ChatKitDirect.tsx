/**
 * Direct ChatKit Integration
 * Minimal implementation that talks directly to the backend
 */

import React, { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'openai-chatkit': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export default function ChatKitDirect() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const init = async () => {
      try {
        // Load ChatKit script
        const script = document.createElement('script');
        script.src = 'https://cdn.platform.openai.com/chatkit.js';
        
        console.log("ChatKit script src:", script.src);
        
        await new Promise((resolve, reject) => {
          script.onload = () => {
            console.log("ChatKit script loaded successfully");
            resolve(true);
          };
          script.onerror = (error) => {
            console.error("Failed to load ChatKit script from:", script.src);
            console.error("Error details:", error);
            reject(error);
          };
          document.head.appendChild(script);
        });

        setStatus('loaded');

        // Create session directly with backend
        const backendUrl = process.env.NEXT_PUBLIC_AGENT_ENDPOINT || 'http://localhost:8001';
        const response = await fetch(`${backendUrl}/api/chatkit/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflow: { 
              id: "wf_68f9ed871f3881909581687179fba37f01b09bb8edcbabda" 
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create session');
        }

        const { client_secret } = await response.json();
        console.log('Got client secret:', client_secret);

        // Create ChatKit element
        const chatkit = document.createElement('openai-chatkit');
        
        // Set attributes
        chatkit.setAttribute('data-api-key', client_secret);
        chatkit.setAttribute('data-workflow', 'wf_68f9ed871f3881909581687179fba37f01b09bb8edcbabda');
        
        // Try different configuration methods
        (chatkit as any).clientSecret = client_secret;
        (chatkit as any).workflow = 'wf_68f9ed871f3881909581687179fba37f01b09bb8edcbabda';
        
        // Add custom styles
        chatkit.style.width = '100%';
        chatkit.style.height = '100%';
        chatkit.style.display = 'block';
        
        // Add to container
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(chatkit);
        }

        setStatus('ready');
        console.log('ChatKit element added to page');

      } catch (error) {
        console.error('Failed to initialize ChatKit:', error);
        setStatus('error');
      }
    };

    init();
  }, []);

  if (status === 'loading') {
    return (
      <Card className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading ChatKit...</p>
        </div>
      </Card>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-[600px] w-full rounded-lg overflow-hidden bg-background border"
    />
  );
}