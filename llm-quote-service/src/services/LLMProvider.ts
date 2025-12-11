import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';
import { LLMRequest, LLMResponse, Message, ConversationStatus } from '../models/types.js';
import { SYSTEM_PROMPT } from '../models/prompts.js';
import { logger } from '../utils/logger.js';

export class LLMProvider {
  private client: Anthropic;
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second

  constructor() {
    this.client = new Anthropic({
      apiKey: config.claude.apiKey
    });
  }

  /**
   * Process a user message and generate an AI response
   */
  async processMessage(request: LLMRequest): Promise<LLMResponse> {
    try {
      const { userMessage, conversationHistory, extractedData, currentField } = request;

      // Build the conversation context for Claude
      const messages = this.buildMessageHistory(conversationHistory, userMessage);

      // Create the system prompt with context
      const systemPrompt = this.buildSystemPrompt(extractedData, currentField);

      logger.info('Sending request to Claude API', {
        sessionId: request.sessionId,
        messageCount: messages.length,
        currentField
      });

      // Call Claude API with retry logic
      const response = await this.callClaudeWithRetry({
        model: config.claude.model,
        max_tokens: config.claude.maxTokens,
        temperature: config.claude.temperature,
        system: systemPrompt,
        messages
      }, request.sessionId);

      // Extract the AI's response text
      const aiMessage = this.extractTextFromResponse(response);

      // Parse the response to extract structured data
      const parsedResponse = this.parseAIResponse(aiMessage, extractedData);

      logger.info('Received response from Claude API', {
        sessionId: request.sessionId,
        responseLength: aiMessage.length,
        extractedFields: Object.keys(parsedResponse.extractedData).length
      });

      return parsedResponse;
    } catch (error: any) {
      logger.error('Error calling Claude API', {
        error: error.message,
        type: error.type,
        statusCode: error.status,
        sessionId: request.sessionId
      });

      // Provide user-friendly error messages
      if (error.status === 529 || error.type === 'overloaded_error') {
        throw new Error('Claude AI is temporarily overloaded. Please try again in a moment.');
      } else if (error.status === 429 || error.type === 'rate_limit_error') {
        throw new Error('Rate limit reached. Please wait a moment and try again.');
      } else if (error.status === 401 || error.type === 'authentication_error') {
        throw new Error('Authentication failed. Please check API credentials.');
      } else {
        throw new Error(`AI service error: ${error.message || 'Please try again'}`);
      }
    }
  }

  /**
   * Call Claude API with exponential backoff retry for transient errors
   */
  private async callClaudeWithRetry(
    params: Anthropic.MessageCreateParams,
    sessionId: string
  ): Promise<Anthropic.Message> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await this.client.messages.create({
          ...params,
          stream: false // Ensure we get a Message, not a Stream
        }) as Anthropic.Message;

        // Success - log if we had to retry
        if (attempt > 0) {
          logger.info('Claude API call succeeded after retry', {
            sessionId,
            attempt,
            totalAttempts: attempt + 1
          });
        }

        return response;
      } catch (error: any) {
        lastError = error;

        // Check if this is a retryable error
        const isRetryable = this.isRetryableError(error);
        const isLastAttempt = attempt === this.MAX_RETRIES;

        if (!isRetryable || isLastAttempt) {
          // Don't retry - throw immediately
          logger.error('Claude API call failed (non-retryable or max retries reached)', {
            sessionId,
            attempt: attempt + 1,
            errorType: error.type,
            status: error.status,
            isRetryable
          });
          throw error;
        }

        // Calculate exponential backoff delay: 1s, 2s, 4s
        const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, attempt);

        logger.warn('Claude API call failed - retrying', {
          sessionId,
          attempt: attempt + 1,
          maxRetries: this.MAX_RETRIES + 1,
          errorType: error.type,
          status: error.status,
          retryDelayMs: delay
        });

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // This should never be reached, but just in case
    throw lastError;
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Retry on server errors and rate limits
    const retryableStatuses = [429, 500, 502, 503, 504, 529];
    const retryableTypes = ['overloaded_error', 'rate_limit_error'];

    return (
      retryableStatuses.includes(error.status) ||
      retryableTypes.includes(error.type)
    );
  }

  /**
   * Sleep helper for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Build message history in Claude's format
   */
  private buildMessageHistory(history: Message[], newMessage: string): Anthropic.MessageParam[] {
    const messages: Anthropic.MessageParam[] = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Add the new user message
    messages.push({
      role: 'user',
      content: newMessage
    });

    return messages;
  }

  /**
   * Build system prompt with current context
   */
  private buildSystemPrompt(extractedData: any, currentField?: string): string {
    let prompt = SYSTEM_PROMPT;

    // Add context about what we've collected so far
    const collectedFields = Object.keys(extractedData).filter(key => extractedData[key] !== undefined);

    if (collectedFields.length > 0) {
      prompt += `\n\nCurrent Collected Data:\n${JSON.stringify(extractedData, null, 2)}`;
    }

    if (currentField) {
      prompt += `\n\nNext Field Needed: ${currentField}`;
    }

    prompt += `\n\nCRITICAL RESPONSE FORMAT:
Your response MUST have TWO parts:

1. FIRST: Your conversational message to the user (friendly, natural, 1-2 sentences)
2. SECOND: A JSON block for data extraction (this will be hidden from the user)

Example format:
Great! I have that recorded.

\`\`\`json
{
  "extractedData": {
    "gender": "male",
    "dateOfBirth": null,
    "height": null,
    "weight": null,
    "city": null,
    "usesNicotine": null,
    "termLength": null
  },
  "nextField": "dateOfBirth",
  "needsConfirmation": false
}
\`\`\`

IMPORTANT:
- The JSON block is ONLY for system processing
- Users will ONLY see your conversational message
- ALWAYS include the JSON block even if no new data is extracted
- Use null (NOT undefined) for missing fields
- Field names must be EXACT: gender, dateOfBirth, height, weight, city, usesNicotine, termLength`;

    return prompt;
  }

  /**
   * Extract text content from Claude's response
   */
  private extractTextFromResponse(response: Anthropic.Message): string {
    const textBlocks = response.content.filter(
      block => block.type === 'text'
    ) as Anthropic.TextBlock[];

    return textBlocks.map(block => block.text).join('\n');
  }

  /**
   * Parse AI response to extract structured data
   */
  private parseAIResponse(aiMessage: string, currentData: any): LLMResponse {
    try {
      let extractedData = { ...currentData };
      let nextField = undefined;
      let needsConfirmation = false;

      // Try multiple JSON extraction patterns
      let jsonString: string | null = null;

      // Pattern 1: Standard markdown code block
      let jsonMatch = aiMessage.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) jsonString = jsonMatch[1];

      // Pattern 2: Just backticks without 'json' label
      if (!jsonString) {
        jsonMatch = aiMessage.match(/```\s*\{[\s\S]*?\}\s*```/);
        if (jsonMatch) jsonString = jsonMatch[0].replace(/```/g, '');
      }

      // Pattern 3: Raw JSON object (no backticks)
      if (!jsonString) {
        jsonMatch = aiMessage.match(/\{\s*"extractedData"[\s\S]*?"needsConfirmation"[^}]*\}/);
        if (jsonMatch) jsonString = jsonMatch[0];
      }

      // Parse the JSON if found
      if (jsonString) {
        try {
          // Replace JavaScript undefined with JSON null for parsing
          const cleanedJson = jsonString
            .replace(/:\s*undefined\b/g, ': null')
            .replace(/"undefined"/g, 'null');

          const parsed = JSON.parse(cleanedJson.trim());
          if (parsed.extractedData) {
            // Merge extracted data, filtering out null values
            const newData = parsed.extractedData;
            Object.keys(newData).forEach(key => {
              if (newData[key] !== null && newData[key] !== undefined) {
                extractedData[key] = newData[key];
              }
            });
            nextField = parsed.nextField;
            needsConfirmation = parsed.needsConfirmation;
          }
        } catch (parseError) {
          logger.warn('Failed to parse JSON block', { jsonString, parseError });
        }
      }

      // Remove ALL JSON-like content from display message - VERY aggressive
      let displayMessage = aiMessage
        // Remove markdown code blocks (with or without json label)
        .replace(/```json[\s\S]*?```/gi, '')
        .replace(/```[\s\S]*?```/g, '')
        // Remove raw JSON objects
        .replace(/\{\s*"extractedData"[\s\S]*?\}/g, '')
        .replace(/\{[\s\S]*?"needsConfirmation"[\s\S]*?\}/g, '')
        // Remove any remaining curly brace blocks with quotes
        .replace(/\{[^{}]*"[^"]*"[^{}]*\}/g, '')
        .trim();

      // Clean up extra whitespace and newlines
      displayMessage = displayMessage
        .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
        .trim();

      // Fallback: extract just the first meaningful sentence
      if (!displayMessage || displayMessage.length < 10) {
        const lines = aiMessage
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.includes('{') && !l.includes('```') && l.length > 10);
        displayMessage = lines[0] || 'Thank you for that information.';
      }

      // Debug logging
      if (aiMessage.includes('{') || aiMessage.includes('```')) {
        logger.debug('JSON removal applied', {
          originalLength: aiMessage.length,
          cleanedLength: displayMessage.length,
          hadBackticks: aiMessage.includes('```'),
          hadBraces: aiMessage.includes('{')
        });
      }

      // Determine status - ONLY set to CONFIRMING when all fields are actually collected
      const allFieldsCollected = this.areAllFieldsCollected(extractedData);
      let status = ConversationStatus.COLLECTING;

      // Only move to CONFIRMING status if all 7 fields are present
      // Ignore AI's needsConfirmation flag if data is incomplete
      if (allFieldsCollected) {
        status = ConversationStatus.CONFIRMING;
        logger.info('All fields collected - ready for quote calculation', {
          extractedData
        });
      } else {
        // Log missing fields for debugging
        const requiredFields = ['gender', 'dateOfBirth', 'height', 'weight', 'city', 'usesNicotine', 'termLength'];
        const missingFields = requiredFields.filter(field => extractedData[field] === undefined);
        if (missingFields.length > 0) {
          logger.debug('Still collecting data', {
            collected: Object.keys(extractedData).filter(k => extractedData[k] !== undefined),
            missing: missingFields
          });
        }
      }

      return {
        aiMessage: displayMessage,
        extractedData,
        nextField,
        status,
        needsConfirmation: allFieldsCollected // Only confirm when actually ready
      };
    } catch (error) {
      logger.warn('Failed to parse structured data from AI response', { error, aiMessage });

      // Fallback: return the message as-is
      return {
        aiMessage,
        extractedData: currentData,
        status: ConversationStatus.COLLECTING,
        needsConfirmation: false
      };
    }
  }

  /**
   * Check if all required fields have been collected
   */
  private areAllFieldsCollected(data: any): boolean {
    const requiredFields = ['gender', 'dateOfBirth', 'height', 'weight', 'city', 'usesNicotine', 'termLength'];
    return requiredFields.every(field => data[field] !== undefined);
  }
}
