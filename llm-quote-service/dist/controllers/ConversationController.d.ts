import { Request, Response } from 'express';
import { ConversationManager } from '../services/ConversationManager.js';
export declare class ConversationController {
    private conversationManager;
    constructor(conversationManager: ConversationManager);
    /**
     * POST /api/v1/conversations
     * Create a new conversation
     */
    createConversation: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/v1/conversations/:sessionId/message
     * Send a message in the conversation
     */
    sendMessage: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/v1/conversations/:sessionId/summary
     * Get conversation summary
     */
    getSummary: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/v1/conversations/:sessionId/confirm
     * Confirm data and calculate quote
     */
    confirmAndCalculate: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=ConversationController.d.ts.map