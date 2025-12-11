import { ConversationStatus, ConversationField, ExtractedData, SendMessageResponse, ConfirmAndCalculateResponse } from '../models/types.js';
import { LLMProvider } from './LLMProvider.js';
import { DataExtractor } from './DataExtractor.js';
import { QuoteIntegration } from './QuoteIntegration.js';
import { RedisService } from './RedisService.js';
export declare class ConversationManager {
    private llmProvider;
    private dataExtractor;
    private quoteIntegration;
    private redisService;
    constructor(llmProvider: LLMProvider, dataExtractor: DataExtractor, quoteIntegration: QuoteIntegration, redisService: RedisService);
    /**
     * Create a new conversation
     */
    createConversation(): Promise<{
        sessionId: string;
        initialMessage: string;
    }>;
    /**
     * Process user message
     */
    processMessage(sessionId: string, userMessage: string): Promise<SendMessageResponse>;
    /**
     * Confirm data and calculate quote
     */
    confirmAndCalculate(sessionId: string): Promise<ConfirmAndCalculateResponse>;
    /**
     * Get conversation summary
     */
    getSummary(sessionId: string): Promise<{
        sessionId: string;
        extractedData: ExtractedData;
        progress: {
            current: number;
            total: number;
            fieldsCollected: ConversationField[];
        };
        sessionExpiry: Date;
        status: ConversationStatus;
    }>;
    /**
     * Update collection progress
     */
    private updateCollectionProgress;
    /**
     * Validate extracted data
     */
    private validateExtractedData;
    /**
     * Check if all data is complete
     */
    private isDataComplete;
}
//# sourceMappingURL=ConversationManager.d.ts.map