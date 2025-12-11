import { useState, useCallback, useEffect } from 'react';
import { llmQuoteService, Message, ExtractedData, Quote } from '../services/llmQuoteService';

interface ConversationState {
  sessionId: string | null;
  messages: Message[];
  extractedData: ExtractedData;
  status: 'idle' | 'collecting' | 'confirming' | 'calculating' | 'complete' | 'error';
  isLoading: boolean;
  error: string | null;
  progress: {
    current: number;
    total: number;
    fieldsCollected: string[];
  };
  quote: Quote | null;
}

export function useConversation() {
  const [state, setState] = useState<ConversationState>({
    sessionId: null,
    messages: [],
    extractedData: {},
    status: 'idle',
    isLoading: false,
    error: null,
    progress: {
      current: 0,
      total: 7,
      fieldsCollected: [],
    },
    quote: null,
  });

  /**
   * Start a new conversation
   */
  const startConversation = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await llmQuoteService.createConversation();

      setState((prev) => ({
        ...prev,
        sessionId: response.sessionId,
        messages: [
          {
            role: 'assistant',
            content: response.initialMessage,
            timestamp: new Date(),
          },
        ],
        status: 'collecting',
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start conversation',
        isLoading: false,
        status: 'error',
      }));
    }
  }, []);

  /**
   * Send a message
   */
  const sendMessage = useCallback(
    async (message: string) => {
      if (!state.sessionId) {
        console.error('No active session');
        return;
      }

      // Add user message immediately
      const userMessage: Message = {
        role: 'user',
        content: message,
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
        error: null,
      }));

      try {
        const response = await llmQuoteService.sendMessage(state.sessionId, message);

        // Add AI response
        const aiMessage: Message = {
          role: 'assistant',
          content: response.aiResponse,
          timestamp: new Date(),
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, aiMessage],
          extractedData: response.extractedData,
          status: response.status,
          progress: response.progress,
          isLoading: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to send message',
          isLoading: false,
          status: 'error',
        }));
      }
    },
    [state.sessionId]
  );

  /**
   * Confirm and calculate quote
   */
  const confirmAndCalculate = useCallback(async () => {
    if (!state.sessionId) {
      console.error('No active session');
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, status: 'calculating', error: null }));

    try {
      const response = await llmQuoteService.confirmAndCalculate(state.sessionId);

      setState((prev) => ({
        ...prev,
        quote: response.quote,
        status: 'complete',
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to calculate quote',
        isLoading: false,
        status: 'error',
      }));
    }
  }, [state.sessionId]);

  /**
   * Reset conversation
   */
  const resetConversation = useCallback(() => {
    setState({
      sessionId: null,
      messages: [],
      extractedData: {},
      status: 'idle',
      isLoading: false,
      error: null,
      progress: {
        current: 0,
        total: 7,
        fieldsCollected: [],
      },
      quote: null,
    });
  }, []);

  // Auto-start conversation on mount
  useEffect(() => {
    if (state.status === 'idle' && !state.sessionId) {
      startConversation();
    }
  }, [state.status, state.sessionId, startConversation]);

  // Auto-calculate quote when all data is collected
  useEffect(() => {
    if (
      state.status === 'confirming' &&
      state.sessionId &&
      !state.isLoading &&
      state.progress.current === state.progress.total // Ensure all fields collected
    ) {
      console.log('All data collected - triggering quote calculation', {
        progress: state.progress,
        extractedData: state.extractedData
      });
      confirmAndCalculate();
    }
  }, [state.status, state.sessionId, state.isLoading, state.progress, confirmAndCalculate]);

  return {
    ...state,
    sendMessage,
    confirmAndCalculate,
    resetConversation,
    startConversation,
  };
}
