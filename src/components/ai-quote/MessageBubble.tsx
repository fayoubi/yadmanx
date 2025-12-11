import React from 'react';
import { Message } from '../../services/llmQuoteService';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAI = message.role === 'assistant';

  return (
    <div
      className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4 animate-fade-in`}
    >
      <div
        className={`max-w-[80%] md:max-w-[70%] rounded-lg px-4 py-3 ${
          isAI
            ? 'bg-gray-100 text-gray-900'
            : 'bg-blue-600 text-white'
        } shadow-sm`}
      >
        {isAI && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              AI
            </div>
            <span className="text-xs text-gray-500">YadmanX Assistant</span>
          </div>
        )}
        <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">
          {message.content}
        </p>
        <div className={`text-xs mt-1 ${isAI ? 'text-gray-500' : 'text-blue-100'} opacity-75`}>
          {new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
