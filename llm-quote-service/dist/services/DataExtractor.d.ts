import { ConversationField } from '../models/types.js';
export declare class DataExtractor {
    /**
     * Validate a specific field value
     */
    validateField(field: ConversationField, value: any): {
        isValid: boolean;
        message?: string;
    };
    private validateGender;
    private validateDateOfBirth;
    private validateHeight;
    private validateWeight;
    private validateCity;
    private validateNicotine;
    private validateTermLength;
    /**
     * Find closest matching city using basic string similarity
     */
    private findClosestCity;
    /**
     * Calculate age from date of birth
     */
    calculateAge(dateOfBirth: string): number;
    /**
     * Normalize city name to match database
     */
    normalizeCity(city: string): string;
}
//# sourceMappingURL=DataExtractor.d.ts.map