'use client';

import React from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import { Conversation } from '@/types/database.types';
import { format, parseISO } from 'date-fns';

interface ConversationRowProps {
  conversation: Conversation;
  viewConversation: (conversation: Conversation) => void;
  copyToClipboard: (text: string) => void;
}

export const ConversationRow = ({
  conversation,
  viewConversation,
  copyToClipboard,
}: ConversationRowProps) => {
  // Parse the timestamp and format it with date-fns
  const formattedDate = React.useMemo(() => {
    try {
      return format(parseISO(conversation.created_at), 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return conversation.created_at;
    }
  }, [conversation.created_at]);

  // Get LangFuse host with project from environment variable
  const langfuseHost = process.env.NEXT_PUBLIC_LANGFUSE_HOST_WITH_PROJECT;
  const langfuseUrl = langfuseHost ? `${langfuseHost}/sessions/${conversation.session_id}` : null;

  return (
    <TableRow key={conversation.id}>
      <TableCell width="18%" className="whitespace-nowrap">
        {formattedDate}
      </TableCell>
      <TableCell width="25%">
        <Button 
          variant="link" 
          className="p-0 h-auto text-blue-500 hover:text-blue-700 font-normal text-left truncate max-w-full"
          onClick={() => viewConversation(conversation)}
        >
          <span className="truncate block">{conversation.title || 'Untitled conversation'}</span>
        </Button>
      </TableCell>
      <TableCell width="22%">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs truncate max-w-[120px]">{conversation.user_id}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => copyToClipboard(conversation.user_id)}
            className="h-6 w-6 flex-shrink-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
      <TableCell width="22%">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs truncate max-w-[120px]">{conversation.session_id}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => copyToClipboard(conversation.session_id)}
            className="h-6 w-6 flex-shrink-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
      <TableCell width="13%">
        {langfuseUrl ? (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => window.open(langfuseUrl, '_blank')}
            className="h-6 w-6 flex-shrink-0"
            title="Open in LangFuse"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )}
      </TableCell>
    </TableRow>
  );
};