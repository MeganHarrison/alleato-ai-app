import { useState, useEffect, useCallback } from 'react';
import { fetchConversations } from '@/lib/api';
import { Conversation, Profile } from '@/types/database.types';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

interface ConversationManagementProps {
  user: User | null;
  isMounted: React.MutableRefObject<boolean>;
}

export const useConversationManagement = ({
  user,
  isMounted
}: ConversationManagementProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { toast } = useToast();
  
  // Fetch user's conversations
  const loadConversations = useCallback(async () => {
    if (!user) return [];
    
    try {
      const data = await fetchConversations(user.id);
      if (isMounted.current) {
        setConversations(data);
      }
      return data;
    } catch (err) {
      if (isMounted.current) {
        toast({
          title: 'Error loading conversations',
          description: 'Could not load your conversations. Please try again later.',
          variant: 'destructive',
        });
      }
      return [];
    }
  }, [user, toast, isMounted]);

  const handleNewChat = () => {
    setSelectedConversation(null);
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  // Initial load of conversations
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    selectedConversation,
    setSelectedConversation,
    setConversations,
    loadConversations,
    handleNewChat,
    handleSelectConversation
  };
};