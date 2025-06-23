import React from 'react';
import { Message } from '../types';
import { User, Bot } from 'lucide-react';

/*
Props interface for ChatMessage component

This component will display a single message in the chat.
It needs to know:
- message: the Message object containing role and content
- model: which AI model sent this message (if it's from assistant)
*/
interface ChatMessageProps {
  message: Message;
  model?: string;
}

/*
ChatMessage Component

This component displays a single chat message.
It shows different styling for user messages vs AI assistant messages.

Key TypeScript concepts here:
- We use the Message interface to ensure type safety
- We use conditional rendering (&&) to show content only when conditions are met
- We use template literals (`${variable}`) to build CSS classes dynamically
*/
const ChatMessage: React.FC<ChatMessageProps> = ({ message, model }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}`}>
      <div className="chat-message__avatar">
        {isUser ? (
          <User size={20} color="#667eea" />
        ) : (
          <Bot size={20} color="#10b981" />
        )}
      </div>
      
      <div className="chat-message__content">
        <div className="chat-message__header">
          <span className="chat-message__sender">
            {isUser ? 'You' : (model || 'AI')}
          </span>
        </div>
        
        <div className="chat-message__text">
          {message.content}
        </div>
      </div>
      
      <style>{`
        .chat-message {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          padding: 16px;
          border-radius: 12px;
          max-width: 80%;
        }
        
        .chat-message--user {
          background-color: #f0f4ff;
          margin-left: auto;
          flex-direction: row-reverse;
        }
        
        .chat-message--assistant {
          background-color: #f0fdf4;
          margin-right: auto;
        }
        
        .chat-message__avatar {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .chat-message__content {
          flex: 1;
          min-width: 0;
        }
        
        .chat-message__header {
          margin-bottom: 4px;
        }
        
        .chat-message__sender {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .chat-message__text {
          font-size: 16px;
          line-height: 1.5;
          color: #333;
          word-wrap: break-word;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
};

export default ChatMessage; 