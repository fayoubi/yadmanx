import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
export class QuoteIntegration {
    client;
    constructor() {
        this.client = axios.create({
            baseURL: config.pricingService.url,
            timeout: config.pricingService.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    /**
     * Calculate quote by calling the pricing service
     */
    async calculateQuote(extractedData) {
        try {
            // Transform extracted data to pricing service format
            const request = this.transformToPricingRequest(extractedData);
            logger.info('Calling pricing service', { request });
            const response = await this.client.post('/api/v1/quotes/calculate', request);
            logger.info('Received quote from pricing service', {
                quoteId: response.data.quote.quoteId,
                monthlyPremium: response.data.quote.pricing.monthlyPremium
            });
            return response.data;
        }
        catch (error) {
            logger.error('Error calling pricing service', { error });
            if (axios.isAxiosError(error)) {
                throw new Error(`Pricing service error: ${error.response?.data?.message || error.message}`);
            }
            throw new Error('Failed to calculate quote');
        }
    }
    /**
     * Transform extracted conversation data to pricing service format
     */
    transformToPricingRequest(data) {
        if (!data.gender || !data.dateOfBirth || !data.height || !data.weight || !data.city || data.usesNicotine === undefined || !data.termLength) {
            throw new Error('Missing required fields for quote calculation');
        }
        return {
            productType: 'term_life',
            applicant: {
                gender: data.gender === 'male' ? 'Male' : 'Female',
                birthDate: data.dateOfBirth,
                height: data.height,
                weight: data.weight,
                city: data.city,
                usesNicotine: data.usesNicotine
            },
            policy: {
                termLength: data.termLength,
                coverageAmount: data.coverageAmount || config.conversation.defaultCoverageAmount
            }
        };
    }
    /**
     * Validate that pricing service is available
     */
    async healthCheck() {
        try {
            await this.client.get('/api/v1/health');
            return true;
        }
        catch (error) {
            logger.warn('Pricing service health check failed', { error });
            return false;
        }
    }
}
//# sourceMappingURL=QuoteIntegration.js.map