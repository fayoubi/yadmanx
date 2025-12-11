import { v4 as uuidv4 } from 'uuid';
import { ConversationStatus, ConversationField } from '../models/types.js';
import { WELCOME_MESSAGE, CALCULATING_MESSAGE, ERROR_MESSAGES } from '../models/prompts.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
export class ConversationManager {
    llmProvider;
    dataExtractor;
    quoteIntegration;
    redisService;
    constructor(llmProvider, dataExtractor, quoteIntegration, redisService) {
        this.llmProvider = llmProvider;
        this.dataExtractor = dataExtractor;
        this.quoteIntegration = quoteIntegration;
        this.redisService = redisService;
    }
    /**
     * Create a new conversation
     */
    async createConversation() {
        const sessionId = uuidv4();
        const state = {
            sessionId,
            startedAt: new Date(),
            lastActivityAt: new Date(),
            extractedData: {},
            collectionProgress: [],
            conversationHistory: [
                {
                    role: 'assistant',
                    content: WELCOME_MESSAGE,
                    timestamp: new Date()
                }
            ],
            status: ConversationStatus.COLLECTING,
            errors: [],
            retryCount: 0
        };
        await this.redisService.saveConversation(state);
        logger.info('New conversation created', { sessionId });
        return {
            sessionId,
            initialMessage: WELCOME_MESSAGE
        };
    }
    /**
     * Process user message
     */
    async processMessage(sessionId, userMessage) {
        // Get conversation state
        const state = await this.redisService.getConversation(sessionId);
        if (!state) {
            throw new Error(ERROR_MESSAGES.SESSION_EXPIRED);
        }
        // Add user message to history
        state.conversationHistory.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        });
        state.lastActivityAt = new Date();
        try {
            // Process with LLM
            const llmRequest = {
                sessionId,
                userMessage,
                conversationHistory: state.conversationHistory,
                extractedData: state.extractedData,
                currentField: state.currentField
            };
            const llmResponse = await this.llmProvider.processMessage(llmRequest);
            // Update extracted data
            state.extractedData = { ...state.extractedData, ...llmResponse.extractedData };
            // Update collection progress
            this.updateCollectionProgress(state);
            // Update status
            state.status = llmResponse.status;
            // Add AI response to history
            state.conversationHistory.push({
                role: 'assistant',
                content: llmResponse.aiMessage,
                timestamp: new Date()
            });
            // Validate newly extracted fields
            const validationErrors = this.validateExtractedData(state.extractedData);
            if (validationErrors.length > 0) {
                logger.warn('Validation errors found', { sessionId, errors: validationErrors });
                // Could handle validation errors here
            }
            // Save updated state
            await this.redisService.saveConversation(state);
            logger.info('Message processed', {
                sessionId,
                status: state.status,
                fieldsCollected: state.collectionProgress.length
            });
            return {
                sessionId,
                aiResponse: llmResponse.aiMessage,
                extractedData: state.extractedData,
                status: state.status,
                progress: {
                    current: state.collectionProgress.length,
                    total: 7,
                    fieldsCollected: state.collectionProgress
                }
            };
        }
        catch (error) {
            logger.error('Error processing message', { error, sessionId });
            state.status = ConversationStatus.ERROR;
            await this.redisService.saveConversation(state);
            throw error;
        }
    }
    /**
     * Confirm data and calculate quote
     */
    async confirmAndCalculate(sessionId) {
        const state = await this.redisService.getConversation(sessionId);
        if (!state) {
            throw new Error(ERROR_MESSAGES.SESSION_EXPIRED);
        }
        // Validate all fields are present
        if (!this.isDataComplete(state.extractedData)) {
            throw new Error('Not all required fields have been collected');
        }
        // Update status to calculating
        state.status = ConversationStatus.CALCULATING;
        await this.redisService.saveConversation(state);
        try {
            // Call pricing service
            const quoteResponse = await this.quoteIntegration.calculateQuote(state.extractedData);
            // Update state
            state.status = ConversationStatus.COMPLETE;
            state.quoteId = quoteResponse.quote.quoteId;
            // Add calculating message to history
            state.conversationHistory.push({
                role: 'assistant',
                content: CALCULATING_MESSAGE,
                timestamp: new Date()
            });
            await this.redisService.saveConversation(state);
            logger.info('Quote calculated successfully', {
                sessionId,
                quoteId: quoteResponse.quote.quoteId
            });
            // Build applicant summary
            const age = this.dataExtractor.calculateAge(state.extractedData.dateOfBirth);
            return {
                sessionId,
                quote: quoteResponse.quote,
                applicantSummary: {
                    gender: state.extractedData.gender,
                    age,
                    city: state.extractedData.city,
                    healthFactors: quoteResponse.quote.riskAssessment.riskFactors
                }
            };
        }
        catch (error) {
            logger.error('Error calculating quote', { error, sessionId });
            state.status = ConversationStatus.ERROR;
            await this.redisService.saveConversation(state);
            throw new Error(ERROR_MESSAGES.PRICING_SERVICE_ERROR);
        }
    }
    /**
     * Get conversation summary
     */
    async getSummary(sessionId) {
        const state = await this.redisService.getConversation(sessionId);
        if (!state) {
            throw new Error(ERROR_MESSAGES.SESSION_EXPIRED);
        }
        const sessionExpiry = new Date(state.lastActivityAt.getTime() + config.redis.sessionTTL * 1000);
        return {
            sessionId,
            extractedData: state.extractedData,
            progress: {
                current: state.collectionProgress.length,
                total: 7,
                fieldsCollected: state.collectionProgress
            },
            sessionExpiry,
            status: state.status
        };
    }
    /**
     * Update collection progress
     */
    updateCollectionProgress(state) {
        const fields = [
            ConversationField.GENDER,
            ConversationField.DATE_OF_BIRTH,
            ConversationField.HEIGHT,
            ConversationField.WEIGHT,
            ConversationField.CITY,
            ConversationField.USES_NICOTINE,
            ConversationField.TERM_LENGTH
        ];
        state.collectionProgress = fields.filter(field => {
            const key = field;
            return state.extractedData[key] !== undefined;
        });
    }
    /**
     * Validate extracted data
     */
    validateExtractedData(data) {
        const errors = [];
        for (const [field, value] of Object.entries(data)) {
            if (value !== undefined) {
                const validation = this.dataExtractor.validateField(field, value);
                if (!validation.isValid && validation.message) {
                    errors.push(validation.message);
                }
            }
        }
        return errors;
    }
    /**
     * Check if all data is complete
     */
    isDataComplete(data) {
        return !!(data.gender &&
            data.dateOfBirth &&
            data.height &&
            data.weight &&
            data.city &&
            data.usesNicotine !== undefined &&
            data.termLength);
    }
}
//# sourceMappingURL=ConversationManager.js.map