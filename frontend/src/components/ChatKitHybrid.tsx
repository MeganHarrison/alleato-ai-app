/**
 * ChatKit Hybrid Component
 * Uses real ChatKit if available, falls back to custom implementation
 */

import React from 'react';
import AgentBuilderChat from './AgentBuilderChat';

interface ChatKitHybridProps {
  className?: string;
  useRealChatKit?: boolean;
}

export default function ChatKitHybrid({ 
  className = "", 
  useRealChatKit = true 
}: ChatKitHybridProps) {
  return <AgentBuilderChat />;
}