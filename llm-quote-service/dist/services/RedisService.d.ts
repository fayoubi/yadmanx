import { ConversationState } from '../models/types.js';
export declare class RedisService {
    private client;
    private isConnected;
    constructor();
    /**
     * Connect to Redis
     */
    connect(): Promise<void>;
    /**
     * Disconnect from Redis
     */
    disconnect(): Promise<void>;
    /**
     * Save conversation state
     */
    saveConversation(state: ConversationState): Promise<void>;
    /**
     * Get conversation state
     */
    getConversation(sessionId: string): Promise<ConversationState | null>;
    /**
     * Delete conversation
     */
    deleteConversation(sessionId: string): Promise<void>;
    /**
     * Extend conversation TTL
     */
    extendConversation(sessionId: string): Promise<void>;
    /**
     * Check if connected
     */
    isReady(): boolean;
}
//# sourceMappingURL=RedisService.d.ts.map