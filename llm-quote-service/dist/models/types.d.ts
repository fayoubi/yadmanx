export declare enum ConversationStatus {
    COLLECTING = "collecting",
    CONFIRMING = "confirming",
    CALCULATING = "calculating",
    COMPLETE = "complete",
    ERROR = "error"
}
export declare enum ConversationField {
    GENDER = "gender",
    DATE_OF_BIRTH = "dateOfBirth",
    HEIGHT = "height",
    WEIGHT = "weight",
    CITY = "city",
    USES_NICOTINE = "usesNicotine",
    TERM_LENGTH = "termLength"
}
export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    metadata?: Record<string, any>;
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
export interface ValidationError {
    field: ConversationField;
    message: string;
    attemptCount: number;
}
export interface ConversationState {
    sessionId: string;
    startedAt: Date;
    lastActivityAt: Date;
    extractedData: ExtractedData;
    collectionProgress: ConversationField[];
    conversationHistory: Message[];
    status: ConversationStatus;
    quoteId?: string;
    errors: ValidationError[];
    currentField?: ConversationField;
    retryCount: number;
}
export interface LLMRequest {
    sessionId: string;
    userMessage: string;
    conversationHistory: Message[];
    extractedData: ExtractedData;
    currentField?: ConversationField;
}
export interface LLMResponse {
    aiMessage: string;
    extractedData: ExtractedData;
    nextField?: ConversationField;
    status: ConversationStatus;
    needsConfirmation: boolean;
}
export interface PricingServiceRequest {
    productType: 'term_life';
    applicant: {
        gender: 'Male' | 'Female';
        birthDate: string;
        height: number;
        weight: number;
        city: string;
        usesNicotine: boolean;
    };
    policy: {
        termLength: number;
        coverageAmount: number;
    };
}
export interface PricingServiceResponse {
    quote: {
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
        createdAt: Date;
        expiresAt: Date;
    };
}
export interface CreateConversationRequest {
}
export interface CreateConversationResponse {
    sessionId: string;
    initialMessage: string;
    status: ConversationStatus;
}
export interface SendMessageRequest {
    message: string;
}
export interface SendMessageResponse {
    sessionId: string;
    aiResponse: string;
    extractedData: ExtractedData;
    status: ConversationStatus;
    progress: {
        current: number;
        total: number;
        fieldsCollected: ConversationField[];
    };
    inputType?: InputType;
    options?: string[];
}
export interface GetSummaryResponse {
    sessionId: string;
    extractedData: ExtractedData;
    progress: {
        current: number;
        total: number;
        fieldsCollected: ConversationField[];
    };
    sessionExpiry: Date;
    status: ConversationStatus;
}
export interface ConfirmAndCalculateResponse {
    sessionId: string;
    quote: PricingServiceResponse['quote'];
    applicantSummary: {
        gender: string;
        age: number;
        city: string;
        healthFactors: string[];
    };
}
export declare enum InputType {
    TEXT = "text",
    DATE = "date",
    NUMBER = "number",
    DROPDOWN = "dropdown",
    QUICK_REPLY = "quick_reply"
}
export interface QuickReplyOption {
    label: string;
    value: string;
}
export interface ConversationLog {
    id: string;
    session_id: string;
    message_role: 'user' | 'assistant';
    message_content: string;
    extracted_data: ExtractedData;
    status: ConversationStatus;
    created_at: Date;
}
export interface StoredQuote {
    quote_id: string;
    session_id: string;
    applicant_data: ExtractedData;
    pricing_result: PricingServiceResponse['quote']['pricing'];
    risk_assessment: PricingServiceResponse['quote']['riskAssessment'];
    eligibility_flags: PricingServiceResponse['quote']['eligibilityFlags'];
    source: 'llm_conversational';
    created_at: Date;
    expires_at: Date;
}
//# sourceMappingURL=types.d.ts.map