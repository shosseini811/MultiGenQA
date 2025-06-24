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
          gap: 16px;
          margin-bottom: 24px;
          padding: 20px;
          border-radius: 16px;
          max-width: 85%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .chat-message--user {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          margin-left: auto;
          flex-direction: row-reverse;
          border-left: 4px solid #3b82f6;
        }
        
        .chat-message--assistant {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          margin-right: auto;
          border-left: 4px solid #10b981;
        }
        
        .chat-message__avatar {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border: 2px solid #f8fafc;
        }
        
        .chat-message__content {
          flex: 1;
          min-width: 0;
        }
        
        .chat-message__header {
          margin-bottom: 8px;
        }
        
        .chat-message__sender {
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        
        .chat-message__text {
          font-size: 16px;
          line-height: 1.6;
          color: #1e293b;
          word-wrap: break-word;
          white-space: pre-wrap;
          font-weight: 400;
        }
      `}</style>
    </div>
  );
};

export default ChatMessage; 