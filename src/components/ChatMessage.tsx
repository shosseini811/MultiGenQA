import React from 'react';
import { Message } from '../types';
import { User, Bot } from 'lucide-react';

/*
Props interface for ChatMessage component

This component will display a single message in the chat.
It needs to know:
- message: the Message object containing role and content
- model: optional model name to display
*/
interface ChatMessageProps {
  message: Message;
  model?: string;
}

/*
ChatMessage Component

This component displays a single chat message with Claude.ai inspired colors.
It shows different styling for user messages vs AI assistant messages.

Key TypeScript concepts here:
- We use the Message interface to ensure type safety
- We use conditional rendering to show content only when conditions are met
- We use template literals to build CSS classes dynamically
*/
export default function ChatMessage({ message, model }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] rounded-lg p-4 ${
        isUser 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-card text-card-foreground border border-border'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-primary-foreground/20' 
              : 'bg-primary/10'
          }`}>
            {isUser ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium opacity-70">
                {isUser ? 'You' : (model || 'Assistant')}
              </span>
              <span className="text-xs opacity-50">
                {new Date().toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 