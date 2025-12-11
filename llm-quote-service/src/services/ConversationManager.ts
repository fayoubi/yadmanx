import { v4 as uuidv4 } from 'uuid';
import {
  ConversationState,
  ConversationStatus,
  ConversationField,
  Message,
  ExtractedData,
  LLMRequest,
  SendMessageResponse,
  ConfirmAndCalculateResponse
} from '../models/types.js';
import { WELCOME_MESSAGE, CALCULATING_MESSAGE, CONFIRMATION_PROMPT, ERROR_MESSAGES } from '../models/prompts.js';
import { LLMProvider } from './LLMProvider.js';
import { DataExtractor } from './DataExtractor.js';
import { QuoteIntegration } from './QuoteIntegration.js';
import { RedisService } from './RedisService.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export class ConversationManager {
  private llmProvider: LLMProvider;
  private dataExtractor: DataExtractor;
  private quoteIntegration: QuoteIntegration;
  private redisService: RedisService;

  constructor(
    llmProvider: LLMProvider,
    dataExtractor: DataExtractor,
    quoteIntegration: QuoteIntegration,
    redisService: RedisService
  ) {
    this.llmProvider = llmProvider;
    this.dataExtractor = dataExtractor;
    this.quoteIntegration = quoteIntegration;
    this.redisService = redisService;
  }

  /**
   * Create a new conversation
   */
  async createConversation(): Promise<{ sessionId: string; initialMessage: string }> {
    const sessionId = uuidv4();

    const state: ConversationState = {
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
  async processMessage(sessionId: string, userMessage: string): Promise<SendMessageResponse> {
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
      const llmRequest: LLMRequest = {
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
    } catch (error) {
      logger.error('Error processing message', { error, sessionId });
      state.status = ConversationStatus.ERROR;
      await this.redisService.saveConversation(state);

      throw error;
    }
  }

  /**
   * Confirm data and calculate quote
   */
  async confirmAndCalculate(sessionId: string): Promise<ConfirmAndCalculateResponse> {
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
      const age = this.dataExtractor.calculateAge(state.extractedData.dateOfBirth!);

      return {
        sessionId,
        quote: quoteResponse.quote,
        applicantSummary: {
          gender: state.extractedData.gender!,
          age,
          city: state.extractedData.city!,
          healthFactors: quoteResponse.quote.riskAssessment.riskFactors
        }
      };
    } catch (error) {
      logger.error('Error calculating quote', { error, sessionId });
      state.status = ConversationStatus.ERROR;
      await this.redisService.saveConversation(state);

      throw new Error(ERROR_MESSAGES.PRICING_SERVICE_ERROR);
    }
  }

  /**
   * Get conversation summary
   */
  async getSummary(sessionId: string) {
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
  private updateCollectionProgress(state: ConversationState): void {
    const fields: ConversationField[] = [
      ConversationField.GENDER,
      ConversationField.DATE_OF_BIRTH,
      ConversationField.HEIGHT,
      ConversationField.WEIGHT,
      ConversationField.CITY,
      ConversationField.USES_NICOTINE,
      ConversationField.TERM_LENGTH
    ];

    state.collectionProgress = fields.filter(field => {
      const key = field as keyof ExtractedData;
      return state.extractedData[key] !== undefined;
    });
  }

  /**
   * Validate extracted data
   */
  private validateExtractedData(data: ExtractedData): string[] {
    const errors: string[] = [];

    for (const [field, value] of Object.entries(data)) {
      if (value !== undefined) {
        const validation = this.dataExtractor.validateField(field as ConversationField, value);
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
  private isDataComplete(data: ExtractedData): boolean {
    return !!(
      data.gender &&
      data.dateOfBirth &&
      data.height &&
      data.weight &&
      data.city &&
      data.usesNicotine !== undefined &&
      data.termLength
    );
  }
}
