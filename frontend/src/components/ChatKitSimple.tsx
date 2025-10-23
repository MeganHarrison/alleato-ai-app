/**
 * Simple ChatKit Integration
 * Minimal implementation following OpenAI's documentation
 */

import React, { useEffect, useRef } from 'react';

export default function ChatKitSimple() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Load ChatKit script
    const script = document.createElement('script');
    script.src = 'https://cdn.platform.openai.com/chatkit.js';
    script.async = true;
    
    script.onload = () => {
      // Create ChatKit element
      const chatkit = document.createElement('openai-chatkit');
      
      // Set the workflow ID directly as an attribute
      chatkit.setAttribute('workflow', 'wf_68f9ed871f3881909581687179fba37f01b09bb8edcbabda');
      
      // Add to container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(chatkit);
      }
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="h-[600px] w-full"
      style={{ minHeight: '600px' }}
    />
  );
}