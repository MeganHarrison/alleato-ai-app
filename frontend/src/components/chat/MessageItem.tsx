'use client';

import { useState, useMemo } from 'react';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import breaks from 'remark-breaks';
import { Message, FileAttachment } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, Copy, User, FileText, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

interface MessageItemProps {
  message: Message;
  isLastMessage?: boolean;
}

interface CodeProps {
  node?: Element;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const MessageItem = ({ message, isLastMessage = false }: MessageItemProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Properly check if the message is from AI (lowercase 'ai') or user
  const isAI = message.message.type.toLowerCase() === 'ai';
  const isUser = !isAI;

  // Process the message content to properly handle double newlines
  const processedContent = useMemo(() => {
    if (!message.message.content) return '';
    return message.message.content;
  }, [message.message.content]);
  
  // Check if the message has file attachments
  const hasFiles = useMemo(() => {
    return message.message.files && message.message.files.length > 0;
  }, [message.message.files]);
  
  // Function to download a file
  const downloadFile = (file: FileAttachment) => {
    // Convert base64 to blob
    const byteCharacters = atob(file.content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: file.mimeType });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Memoize the markdown content to prevent unnecessary re-renders
  // This is especially important for the first AI response
  const memoizedMarkdown = useMemo(() => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, breaks]} // Add GFM support and preserve line breaks
        rehypePlugins={[rehypeRaw]} // Allow HTML in markdown
        components={{
          // Enhanced paragraph handling with better spacing
          p: ({children}) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
          // Enhanced headers with better typography and spacing
          h1: ({children}) => <h1 className="text-2xl font-bold mt-8 mb-4 first:mt-0 text-foreground border-b border-border pb-2">{children}</h1>,
          h2: ({children}) => <h2 className="text-xl font-bold mt-6 mb-3 first:mt-0 text-foreground">{children}</h2>,
          h3: ({children}) => <h3 className="text-lg font-semibold mt-5 mb-3 first:mt-0 text-foreground">{children}</h3>,
          h4: ({children}) => <h4 className="text-base font-semibold mt-4 mb-2 first:mt-0 text-foreground">{children}</h4>,
          h5: ({children}) => <h5 className="text-sm font-semibold mt-3 mb-2 first:mt-0 text-foreground">{children}</h5>,
          h6: ({children}) => <h6 className="text-xs font-semibold mt-3 mb-2 first:mt-0 text-muted-foreground uppercase tracking-wide">{children}</h6>,
          // Enhanced link styling
          a: ({href, children}) => <a href={href} className="text-blue-500 hover:text-blue-600 hover:underline underline-offset-2 font-medium transition-colors" target="_blank" rel="noopener noreferrer">{children}</a>,
          // Enhanced list styling
          ul: ({children}) => <ul className="mb-4 ml-4 space-y-1 list-disc marker:text-muted-foreground">{children}</ul>,
          ol: ({children}) => <ol className="mb-4 ml-4 space-y-1 list-decimal marker:text-muted-foreground">{children}</ol>,
          li: ({children}) => <li className="leading-relaxed pl-1">{children}</li>,
          // Enhanced blockquote styling
          blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-muted-foreground bg-muted/30 py-2 rounded-r">{children}</blockquote>,
          // Enhanced strong and emphasis
          strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({children}) => <em className="italic text-foreground">{children}</em>,
          // Enhanced horizontal rule
          hr: () => <hr className="my-6 border-border" />,
          // Ensure proper line break handling
          br: () => <br className="mb-2" />,
          // Handle code blocks with syntax highlighting
          code({node, inline, className, children, ...props}: CodeProps) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="my-4 relative">
                <div className="absolute top-0 right-0 bg-muted px-2 py-1 text-xs text-muted-foreground rounded-bl">
                  {match[1]}
                </div>
                <SyntaxHighlighter
                  style={atomDark}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-lg !bg-gray-900 border border-border overflow-hidden"
                  customStyle={{
                    margin: 0,
                    padding: '16px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={cn("bg-muted px-2 py-1 rounded font-mono text-sm border", className)} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    );
  }, [processedContent]);

  return (
    <div 
      className={cn(
        "flex w-full",
        isLastMessage && isAI && "animate-fade-in"
      )}
    >
      <div className={cn(
        "flex items-start gap-3 w-full max-w-4xl mx-auto px-4",
        isUser ? "justify-end" : "justify-start",
        "group"
      )}>
        {!isUser && (
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 mt-1">
            AI
          </div>
        )}
        
        <div className={cn(
          "flex flex-col space-y-1",
          "max-w-[calc(100%-64px)]",
        )}>
          <div className="text-xs font-medium text-muted-foreground">
            {isUser ? 'You' : 'AI Assistant'}
          </div>
          
          <div className={cn(
            "rounded-xl px-5 py-4 break-words shadow-sm",
            "overflow-x-auto", // Add horizontal scrolling for code blocks if needed
            isUser 
              ? "bg-chat-user text-white ml-auto max-w-[85%]" 
              : "bg-chat-assistant text-foreground border border-border/50 max-w-full"
          )}>
            {/* File attachments */}
            {hasFiles && (
              <div className="mb-3 flex flex-wrap gap-2">
                {message.message.files?.map((file, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="flex items-center gap-1 py-1 cursor-pointer hover:bg-secondary"
                    onClick={() => downloadFile(file)}
                  >
                    <FileText className="h-3 w-3" />
                    <span className="max-w-[150px] truncate">{file.fileName}</span>
                    <Download className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
            <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              {memoizedMarkdown}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            
            {!isUser && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span className="sr-only">Copy message</span>
              </Button>
            )}
          </div>
        </div>
        
        {isUser && (
          <Avatar className="h-8 w-8 bg-secondary text-secondary-foreground shrink-0 mt-1">
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
};