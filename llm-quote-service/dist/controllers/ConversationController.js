import { logger } from '../utils/logger.js';
export class ConversationController {
    conversationManager;
    constructor(conversationManager) {
        this.conversationManager = conversationManager;
    }
    /**
     * POST /api/v1/conversations
     * Create a new conversation
     */
    createConversation = async (req, res) => {
        try {
            const result = await this.conversationManager.createConversation();
            res.status(201).json({
                success: true,
                ...result,
                status: 'collecting'
            });
        }
        catch (error) {
            logger.error('Error creating conversation', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to create conversation',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
    /**
     * POST /api/v1/conversations/:sessionId/message
     * Send a message in the conversation
     */
    sendMessage = async (req, res) => {
        try {
            const { sessionId } = req.params;
            const { message } = req.body;
            if (!message || typeof message !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'Invalid request',
                    message: 'Message is required and must be a string'
                });
                return;
            }
            const result = await this.conversationManager.processMessage(sessionId, message);
            res.status(200).json({
                success: true,
                ...result
            });
        }
        catch (error) {
            logger.error('Error sending message', { error, sessionId: req.params.sessionId });
            if (error instanceof Error && error.message.includes('expired')) {
                res.status(410).json({
                    success: false,
                    error: 'Session expired',
                    message: error.message
                });
                return;
            }
            res.status(500).json({
                success: false,
                error: 'Failed to process message',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
    /**
     * GET /api/v1/conversations/:sessionId/summary
     * Get conversation summary
     */
    getSummary = async (req, res) => {
        try {
            const { sessionId } = req.params;
            const summary = await this.conversationManager.getSummary(sessionId);
            res.status(200).json({
                success: true,
                ...summary
            });
        }
        catch (error) {
            logger.error('Error getting summary', { error, sessionId: req.params.sessionId });
            if (error instanceof Error && error.message.includes('expired')) {
                res.status(410).json({
                    success: false,
                    error: 'Session expired',
                    message: error.message
                });
                return;
            }
            res.status(500).json({
                success: false,
                error: 'Failed to get summary',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
    /**
     * POST /api/v1/conversations/:sessionId/confirm
     * Confirm data and calculate quote
     */
    confirmAndCalculate = async (req, res) => {
        try {
            const { sessionId } = req.params;
            const result = await this.conversationManager.confirmAndCalculate(sessionId);
            res.status(200).json({
                success: true,
                ...result
            });
        }
        catch (error) {
            logger.error('Error confirming and calculating', { error, sessionId: req.params.sessionId });
            if (error instanceof Error && error.message.includes('expired')) {
                res.status(410).json({
                    success: false,
                    error: 'Session expired',
                    message: error.message
                });
                return;
            }
            res.status(500).json({
                success: false,
                error: 'Failed to calculate quote',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
}
//# sourceMappingURL=ConversationController.js.map