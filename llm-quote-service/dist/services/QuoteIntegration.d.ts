import { ExtractedData, PricingServiceResponse } from '../models/types.js';
export declare class QuoteIntegration {
    private client;
    constructor();
    /**
     * Calculate quote by calling the pricing service
     */
    calculateQuote(extractedData: ExtractedData): Promise<PricingServiceResponse>;
    /**
     * Transform extracted conversation data to pricing service format
     */
    private transformToPricingRequest;
    /**
     * Validate that pricing service is available
     */
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=QuoteIntegration.d.ts.map