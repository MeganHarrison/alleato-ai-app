'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/types/database.types';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { useConversationManagement } from '@/components/chat/ConversationManagement';
import { useMessageHandling } from '@/components/chat/MessageHandling';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Chat() {
  const { user, session } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isMobile);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newConversationId, setNewConversationId] = useState<string | null>(null);
  
  // Update sidebar collapsed state when mobile status changes
  useEffect(() => {
    setIsSidebarCollapsed(isMobile);
  }, [isMobile]);
  
  // Ref to track if component is mounted
  const isMounted = useRef(false);
  
  useEffect(() => {
    isMounted.current = true;
    return () => {
      // When component unmounts
      isMounted.current = false;
    };
  }, []);
  
  // Use our extracted conversation management hook
  const {
    conversations,
    selectedConversation,
    setSelectedConversation,
    setConversations,
    loadConversations,
    handleNewChat,
    handleSelectConversation
  } = useConversationManagement({ user, isMounted });
  
  // Use our extracted message handling hook
  const { 
    handleSendMessage,
    loadMessages
  } = useMessageHandling({
    setNewConversationId,
    user,
    session, // Pass the session from useAuth
    selectedConversation,
    setMessages,
    setLoading,
    setError,
    isMounted,
    setSelectedConversation,
    setConversations,
    loadConversations
  });

  // Load messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    } else {
      setMessages([]);
    }
  }, [selectedConversation]); // Removed loadMessages from dependencies to prevent infinite loop
  
  // Display errors using toast notifications
  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error,
      });
    }
  }, [error, toast]);

  // Show loading while auth is resolving
  if (session === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // The middleware handles redirecting unauthenticated users
  // If we get here, we can assume the user is authenticated or will be redirected by middleware

  return (
    <ChatLayout
      conversations={conversations}
      messages={messages}
      selectedConversation={selectedConversation}
      loading={loading}
      error={error}
      isSidebarCollapsed={isSidebarCollapsed}
      onSendMessage={handleSendMessage}
      onNewChat={handleNewChat}
      onSelectConversation={handleSelectConversation}
      onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
      newConversationId={newConversationId}
    />
  );
}