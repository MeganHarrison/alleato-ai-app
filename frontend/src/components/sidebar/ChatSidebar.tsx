'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Search,
  LogOut,
  ChevronLeft,
  User,
  Menu,
  Settings,
  MessageSquare,
  Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Conversation } from '@/types/database.types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SettingsModal } from './SettingsModal';
import { TypewriterText } from '@/components/ui/TypewriterText';

interface ChatSidebarProps {
  conversations: Conversation[];
  isCollapsed: boolean;
  onNewChat: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId: string | null;
  onToggleSidebar: () => void;
  newConversationId?: string | null;
}

export const ChatSidebar = ({
  conversations,
  isCollapsed,
  onNewChat,
  onSelectConversation,
  selectedConversationId,
  onToggleSidebar,
  newConversationId,
}: ChatSidebarProps) => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const [search, setSearch] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(conversations);
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Filter conversations based on search input
  useEffect(() => {
    if (!search.trim()) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(
        (conversation) =>
          conversation.title?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [search, conversations]);

  if (isCollapsed) {
    return (
      <div className="bg-sidebar h-full w-16 border-r flex flex-col items-center py-4">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="mb-6">
          <Menu className="h-5 w-5" />
        </Button>
        {isAdmin && (
          <Button 
            variant="outline" 
            size="icon" 
            className="mb-2 text-blue-500 border-blue-500"
            asChild
          >
            <Link href="/admin">
              <Users className="h-5 w-5" />
            </Link>
          </Button>
        )}
        <Button variant="outline" size="icon" onClick={onNewChat} className="mb-6">
          <Plus className="h-5 w-5" />
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={() => signOut()}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-sidebar h-full w-72 border-r flex flex-col">
      <div className="flex items-center justify-between p-4">
        <div className="text-sidebar-foreground font-semibold flex items-center">
          <MessageSquare className="mr-2 h-5 w-5" />
          AI Chat
        </div>
        <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
      
      <Separator />
      
      <div className="px-4 pt-4">
        {isAdmin && (
          <div className="mb-3">
            <Button 
              variant="outline"
              className="w-full justify-start bg-blue-500 text-white hover:bg-blue-600"
              asChild
            >
              <Link href="/admin">
                <Users className="mr-2 h-5 w-5" />
                Admin Dashboard
              </Link>
            </Button>
          </div>
        )}
      
        <Button 
          onClick={onNewChat} 
          className="w-full justify-start bg-blue-500 text-white hover:bg-blue-600"
        >
          <Plus className="mr-2 h-5 w-5" />
          New Chat
        </Button>
      </div>
      
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search conversations..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 p-2">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <Button
                key={conversation.session_id}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start font-normal text-sm",
                  selectedConversationId === conversation.session_id && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
                onClick={() => onSelectConversation(conversation)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {newConversationId === conversation.session_id ? (
                  <TypewriterText 
                    text={conversation.title || ''} 
                    duration={300} 
                    className="truncate"
                  />
                ) : (
                  <span className="truncate">{conversation.title}</span>
                )}
              </Button>
            ))
          ) : (
            <div className="py-4 text-center text-sm text-muted-foreground">
              {search ? 'No conversations found' : 'No conversations yet'}
            </div>
          )}
        </div>
      </ScrollArea>
      
      <Separator />
      
      <div className="p-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {user?.app_metadata?.provider === 'google' && user?.user_metadata?.avatar_url ? (
              <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name || user.email || 'User'} />
            ) : null}
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <div className="text-sm font-medium truncate">
              {user?.user_metadata?.full_name || user?.email || 'User'}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentFullName={user?.user_metadata?.full_name || null}
      />
    </div>
  );
};