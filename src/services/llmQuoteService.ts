// API client for LLM Quote Service

const LLM_QUOTE_SERVICE_URL = process.env.REACT_APP_LLM_QUOTE_SERVICE_URL || 'http://localhost:3004';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ExtractedData {
  gender?: 'male' | 'female';
  dateOfBirth?: string;
  height?: number;
  weight?: number;
  city?: string;
  usesNicotine?: boolean;
  termLength?: 10 | 20;
  coverageAmount?: number;
}

export interface ConversationResponse {
  success: boolean;
  sessionId: string;
  aiResponse: string;
  extractedData: ExtractedData;
  status: 'collecting' | 'confirming' | 'calculating' | 'complete' | 'error';
  progress: {
    current: number;
    total: number;
    fieldsCollected: string[];
  };
  inputType?: 'text' | 'date' | 'number' | 'dropdown' | 'quick_reply';
  options?: string[];
}

export interface CreateConversationResponse {
  success: boolean;
  sessionId: string;
  initialMessage: string;
  status: string;
}

export interface Quote {
  quoteId: string;
  productType: string;
  pricing: {
    monthlyPremium: number;
    annualPremium: number;
  };
  riskAssessment: {
    riskClass: string;
    bmi: number;
    age: number;
    riskFactors: string[];
  };
  eligibilityFlags: {
    wouldDeclinePostUnderwriting: boolean;
    requiresAdditionalUnderwriting: boolean;
    declineReasons?: string[];
  };
  createdAt: string;
  expiresAt: string;
}

export interface ConfirmAndCalculateResponse {
  success: boolean;
  sessionId: string;
  quote: Quote;
  applicantSummary: {
    gender: string;
    age: number;
    city: string;
    healthFactors: string[];
  };
}

class LLMQuoteService {
  private baseURL: string;

  constructor() {
    this.baseURL = LLM_QUOTE_SERVICE_URL;
  }

  /**
   * Create a new conversation
   */
  async createConversation(): Promise<CreateConversationResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }

    return response.json();
  }

  /**
   * Send a message in the conversation
   */
  async sendMessage(sessionId: string, message: string): Promise<ConversationResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/conversations/${sessionId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send message');
    }

    return response.json();
  }

  /**
   * Get conversation summary
   */
  async getSummary(sessionId: string) {
    const response = await fetch(`${this.baseURL}/api/v1/conversations/${sessionId}/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get summary');
    }

    return response.json();
  }

  /**
   * Confirm data and calculate quote
   */
  async confirmAndCalculate(sessionId: string): Promise<ConfirmAndCalculateResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/conversations/${sessionId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to calculate quote');
    }

    return response.json();
  }

  /**
   * Check if service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const llmQuoteService = new LLMQuoteService();
