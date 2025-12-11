import { LLMRequest, LLMResponse } from '../models/types.js';
export declare class LLMProvider {
    private client;
    private readonly MAX_RETRIES;
    private readonly INITIAL_RETRY_DELAY;
    constructor();
    /**
     * Process a user message and generate an AI response
     */
    processMessage(request: LLMRequest): Promise<LLMResponse>;
    /**
     * Call Claude API with exponential backoff retry for transient errors
     */
    private callClaudeWithRetry;
    /**
     * Check if an error is retryable
     */
    private isRetryableError;
    /**
     * Sleep helper for retry delays
     */
    private sleep;
    /**
     * Build message history in Claude's format
     */
    private buildMessageHistory;
    /**
     * Build system prompt with current context
     */
    private buildSystemPrompt;
    /**
     * Extract text content from Claude's response
     */
    private extractTextFromResponse;
    /**
     * Parse AI response to extract structured data
     */
    private parseAIResponse;
    /**
     * Check if all required fields have been collected
     */
    private areAllFieldsCollected;
}
//# sourceMappingURL=LLMProvider.d.ts.map