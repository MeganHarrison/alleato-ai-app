'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { ConversationRow } from './conversations/ConversationRow';
import { ConversationsTableSkeleton } from './conversations/ConversationsTableSkeleton';
import { ConversationDialog } from './conversations/ConversationDialog';
import { SearchBar } from './conversations/SearchBar';
import { useConversations } from './conversations/useConversations';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ConversationsTable = () => {
  const {
    filteredConversations,
    loading,
    selectedConversation,
    openDialog,
    loadingMessages,
    searchQuery,
    setSearchQuery,
    copyToClipboard,
    viewConversation,
    handleDialogChange,
    sortOrder,
    toggleSortOrder,
  } = useConversations();

  return (
    <div>
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead width="18%" className="cursor-pointer" onClick={toggleSortOrder}>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created At</span>
                  <span className="ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                </div>
              </TableHead>
              <TableHead width="25%">Title</TableHead>
              <TableHead width="22%">User ID</TableHead>
              <TableHead width="22%">Session ID</TableHead>
              <TableHead width="13%">Langfuse</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <ConversationsTableSkeleton />
            ) : filteredConversations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  {searchQuery ? 'No conversations found matching your search' : 'No conversations found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredConversations.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  viewConversation={viewConversation}
                  copyToClipboard={copyToClipboard}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConversationDialog
        open={openDialog}
        onOpenChange={handleDialogChange}
        selectedConversation={selectedConversation}
        loadingMessages={loadingMessages}
      />
    </div>
  );
};