import { Router } from 'express';
import { ConversationController } from '../controllers/ConversationController.js';
import { ConversationManager } from '../services/ConversationManager.js';
import { LLMProvider } from '../services/LLMProvider.js';
import { DataExtractor } from '../services/DataExtractor.js';
import { QuoteIntegration } from '../services/QuoteIntegration.js';
import { RedisService } from '../services/RedisService.js';
// Initialize services
const llmProvider = new LLMProvider();
const dataExtractor = new DataExtractor();
const quoteIntegration = new QuoteIntegration();
const redisService = new RedisService();
const conversationManager = new ConversationManager(llmProvider, dataExtractor, quoteIntegration, redisService);
const conversationController = new ConversationController(conversationManager);
const router = Router();
// Conversation routes
router.post('/conversations', conversationController.createConversation);
router.post('/conversations/:sessionId/message', conversationController.sendMessage);
router.get('/conversations/:sessionId/summary', conversationController.getSummary);
router.post('/conversations/:sessionId/confirm', conversationController.confirmAndCalculate);
// Health check
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'llm-quote-service',
        redis: redisService.isReady()
    });
});
export { router, redisService };
//# sourceMappingURL=index.js.map