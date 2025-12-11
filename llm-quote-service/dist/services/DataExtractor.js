import { ConversationField } from '../models/types.js';
import { MOROCCAN_CITIES } from '../models/prompts.js';
export class DataExtractor {
    /**
     * Validate a specific field value
     */
    validateField(field, value) {
        switch (field) {
            case ConversationField.GENDER:
                return this.validateGender(value);
            case ConversationField.DATE_OF_BIRTH:
                return this.validateDateOfBirth(value);
            case ConversationField.HEIGHT:
                return this.validateHeight(value);
            case ConversationField.WEIGHT:
                return this.validateWeight(value);
            case ConversationField.CITY:
                return this.validateCity(value);
            case ConversationField.USES_NICOTINE:
                return this.validateNicotine(value);
            case ConversationField.TERM_LENGTH:
                return this.validateTermLength(value);
            default:
                return { isValid: false, message: 'Unknown field' };
        }
    }
    validateGender(value) {
        if (value !== 'male' && value !== 'female') {
            return { isValid: false, message: 'Gender must be either male or female' };
        }
        return { isValid: true };
    }
    validateDateOfBirth(value) {
        if (typeof value !== 'string' || !value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return { isValid: false, message: 'Date of birth must be in YYYY-MM-DD format' };
        }
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18 || age > 80) {
            return { isValid: false, message: 'Age must be between 18 and 80 years' };
        }
        if (birthDate > today) {
            return { isValid: false, message: 'Birth date cannot be in the future' };
        }
        return { isValid: true };
    }
    validateHeight(value) {
        const height = Number(value);
        if (isNaN(height) || height < 140 || height > 230) {
            return { isValid: false, message: 'Height must be between 140cm and 230cm' };
        }
        return { isValid: true };
    }
    validateWeight(value) {
        const weight = Number(value);
        if (isNaN(weight) || weight < 40 || weight > 200) {
            return { isValid: false, message: 'Weight must be between 40kg and 200kg' };
        }
        return { isValid: true };
    }
    validateCity(value) {
        if (typeof value !== 'string' || value.trim().length === 0) {
            return { isValid: false, message: 'City name is required' };
        }
        // Check if city is in the list (case insensitive)
        const cityLower = value.toLowerCase();
        const found = MOROCCAN_CITIES.some(city => city.toLowerCase() === cityLower);
        if (!found) {
            // Try fuzzy match
            const fuzzyMatch = this.findClosestCity(value);
            if (fuzzyMatch) {
                return { isValid: false, message: `Did you mean ${fuzzyMatch}?` };
            }
            return { isValid: false, message: 'City not recognized. Please provide a major Moroccan city' };
        }
        return { isValid: true };
    }
    validateNicotine(value) {
        if (typeof value !== 'boolean') {
            return { isValid: false, message: 'Nicotine usage must be yes or no' };
        }
        return { isValid: true };
    }
    validateTermLength(value) {
        const term = Number(value);
        if (term !== 10 && term !== 20) {
            return { isValid: false, message: 'Term length must be either 10 or 20 years' };
        }
        return { isValid: true };
    }
    /**
     * Find closest matching city using basic string similarity
     */
    findClosestCity(input) {
        const inputLower = input.toLowerCase();
        for (const city of MOROCCAN_CITIES) {
            if (city.toLowerCase().includes(inputLower) || inputLower.includes(city.toLowerCase())) {
                return city;
            }
        }
        return null;
    }
    /**
     * Calculate age from date of birth
     */
    calculateAge(dateOfBirth) {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    /**
     * Normalize city name to match database
     */
    normalizeCity(city) {
        const cityLower = city.toLowerCase();
        const found = MOROCCAN_CITIES.find(c => c.toLowerCase() === cityLower);
        return found || city;
    }
}
//# sourceMappingURL=DataExtractor.js.map