import {
  Beneficiary,
  BeneficiaryFormData,
  BeneficiariesResponse,
  CreateBeneficiariesRequest,
  UpdateBeneficiariesRequest,
  DeleteBeneficiaryResponse,
  ValidateBeneficiariesRequest,
  ValidateBeneficiariesResponse,
  BeneficiaryValidationResult,
  BeneficiariesValidationResult,
  BENEFICIARIES_CONFIG,
  BENEFICIARY_ERROR_MESSAGES,
} from '../types/beneficiaries';

export class BeneficiariesService {
  private baseUrl: string;

  constructor() {
    // For now, we'll simulate API calls since the backend doesn't exist yet
    // In production, this would point to the actual API
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  }

  /**
   * Get all beneficiaries for an enrollment
   */
  async getBeneficiariesForEnrollment(enrollmentId: string): Promise<Beneficiary[]> {
    try {
      // Fetch enrollment data from API
      const enrollmentUrl = process.env.REACT_APP_ENROLLMENT_SERVICE_URL || 'http://localhost:3002';
      const response = await fetch(`${enrollmentUrl}/api/v1/enrollments/${enrollmentId}`, {
        headers: {
          'x-agent-id': '11111111-1111-1111-1111-111111111111'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch enrollment data, status:', response.status);
        return [];
      }

      const data = await response.json();
      const enrollment = data.enrollment;

      if (!enrollment) {
        console.log('No enrollment found in response');
        return [];
      }

      // Extract beneficiaries from enrollment.data.beneficiaries (JSONB structure)
      const beneficiariesData = enrollment.data?.beneficiaries || [];

      if (beneficiariesData.length === 0) {
        return [];
      }

      // Map API response to Beneficiary interface
      // Handle both camelCase and snake_case, and nested address structure
      return beneficiariesData.map((b: any, index: number) => {
        // Handle nested address object structure
        const addressObj = typeof b.address === 'object' && b.address !== null ? b.address : {};
        const addressString = typeof b.address === 'string' ? b.address : (addressObj.address || '');
        
        return {
          id: b.id,
          enrollment_id: enrollmentId,
          last_name: b.lastName || b.last_name || '',
          first_name: b.firstName || b.first_name || '',
          cin: b.cin || addressObj.cin || '',
          date_of_birth: b.birthDate || b.date_of_birth || '',
          place_of_birth: b.placeOfBirth || b.place_of_birth || addressObj.place_of_birth || b.birthPlace || '',
          address: addressString,
          percentage: b.percentage || 0,
          order_index: index + 1, // Simple index-based ordering
          created_at: b.created_at,
          updated_at: b.updated_at,
          deleted_at: b.deleted_at
        };
      });
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
      return [];
    }
  }

  /**
   * Save beneficiaries for an enrollment (batch create/update)
   */
  async saveBeneficiaries(
    enrollmentId: string,
    beneficiaries: BeneficiaryFormData[]
  ): Promise<BeneficiariesResponse> {
    try {
      // Validate before saving
      const validation = this.validateBeneficiariesForm(beneficiaries);
      if (!validation.isValid) {
        return {
          success: false,
          data: [],
          totalPercentage: validation.totalPercentage,
          message: validation.globalError || 'Validation failed'
        };
      }

      // Convert form data to beneficiaries
      const beneficiaryData = beneficiaries.map((b, index) => ({
        type: 'primary', // Default to primary beneficiary
        first_name: b.first_name.trim(),
        last_name: b.last_name.trim(),
        relationship: 'other', // Default relationship, can be enhanced later
        date_of_birth: b.date_of_birth,
        percentage: parseFloat(b.percentage.toString()),
        address: {
          place_of_birth: b.place_of_birth.trim(),
          address: b.address.trim(),
          cin: b.cin?.trim() || null,
        },
        display_order: index + 1,
      }));

      // Save beneficiaries using V2 PUT endpoint
      const agentId = sessionStorage.getItem('agent_id') || '11111111-1111-1111-1111-111111111111';

      const response = await fetch(`http://localhost:3002/api/v1/enrollments/${enrollmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-agent-id': agentId
        },
        body: JSON.stringify({
          beneficiaries: beneficiaryData
        })
      });

      if (!response.ok) {
        const apiResult = await response.json();
        throw new Error(apiResult.error || `HTTP error! status: ${response.status}`);
      }

      const apiResult = await response.json();

      const result: BeneficiariesResponse = {
        success: true,
        data: apiResult.data || [],
        totalPercentage: validation.totalPercentage,
        message: 'Beneficiaries saved successfully'
      };

      return result;
    } catch (error) {
      console.error('Error saving beneficiaries:', error);
      return {
        success: false,
        data: [],
        totalPercentage: 0,
        message: error instanceof Error ? error.message : 'Failed to save beneficiaries'
      };
    }
  }

  /**
   * Soft delete a beneficiary
   */
  async deleteBeneficiary(beneficiaryId: string): Promise<DeleteBeneficiaryResponse> {
    try {
      // TODO: Replace with actual API call
      /*
      const response = await fetch(`${this.baseUrl}/api/v1/beneficiaries/${beneficiaryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
      */

      // Simulate soft delete by marking in localStorage
      // In real implementation, this would update deleted_at timestamp
      return {
        success: true,
        message: 'Beneficiary deleted successfully',
        deletedId: beneficiaryId
      };
    } catch (error) {
      console.error('Error deleting beneficiary:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete beneficiary',
        deletedId: beneficiaryId
      };
    }
  }

  /**
   * Validate percentage allocation
   */
  async validatePercentageAllocation(
    enrollmentId: string,
    beneficiaries: { id?: string; percentage: number }[]
  ): Promise<ValidateBeneficiariesResponse> {
    try {
      const totalPercentage = beneficiaries.reduce((sum, b) => sum + b.percentage, 0);
      const isValid = Math.abs(totalPercentage - 100) < 0.01; // Allow for floating point precision

      return {
        valid: isValid,
        totalPercentage: Math.round(totalPercentage * 100) / 100, // Round to 2 decimals
        errors: isValid ? undefined : [`Total percentage is ${totalPercentage.toFixed(2)}%, must be exactly 100%`],
        details: {
          isValidTotal: isValid,
          individualErrors: {}
        }
      };
    } catch (error) {
      console.error('Error validating percentage allocation:', error);
      return {
        valid: false,
        totalPercentage: 0,
        errors: ['Validation failed'],
      };
    }
  }

  /**
   * Validate individual beneficiary data
   */
  validateBeneficiary(beneficiary: BeneficiaryFormData): BeneficiaryValidationResult {
    const errors: any = {};

    // Required field validations
    if (!beneficiary.last_name?.trim()) {
      errors.last_name = BENEFICIARY_ERROR_MESSAGES.REQUIRED_FIELD;
    }

    if (!beneficiary.first_name?.trim()) {
      errors.first_name = BENEFICIARY_ERROR_MESSAGES.REQUIRED_FIELD;
    }

    if (!beneficiary.date_of_birth) {
      errors.date_of_birth = BENEFICIARY_ERROR_MESSAGES.REQUIRED_FIELD;
    } else {
      const birthDate = new Date(beneficiary.date_of_birth);
      const today = new Date();
      if (isNaN(birthDate.getTime())) {
        errors.date_of_birth = BENEFICIARY_ERROR_MESSAGES.INVALID_DATE;
      } else if (birthDate > today) {
        errors.date_of_birth = BENEFICIARY_ERROR_MESSAGES.FUTURE_DATE;
      }
    }

    if (!beneficiary.place_of_birth?.trim()) {
      errors.place_of_birth = BENEFICIARY_ERROR_MESSAGES.REQUIRED_FIELD;
    }

    if (!beneficiary.address?.trim()) {
      errors.address = BENEFICIARY_ERROR_MESSAGES.REQUIRED_FIELD;
    }

    // Percentage validation
    const percentage = parseFloat(beneficiary.percentage.toString());
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      errors.percentage = BENEFICIARY_ERROR_MESSAGES.INVALID_PERCENTAGE;
    }

    // CIN is optional, so no validation needed

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate all beneficiaries and total percentage
   */
  validateBeneficiariesForm(beneficiaries: BeneficiaryFormData[]): BeneficiariesValidationResult {
    // Validate individual beneficiaries
    const validations = beneficiaries.map(b => this.validateBeneficiary(b));

    // Calculate total percentage
    const totalPercentage = beneficiaries.reduce((sum, b) => {
      const percentage = parseFloat(b.percentage.toString());
      return sum + (isNaN(percentage) ? 0 : percentage);
    }, 0);

    // Round to 2 decimal places for comparison
    const roundedTotal = Math.round(totalPercentage * 100) / 100;

    // Check if all individual validations pass
    const allIndividualValid = validations.every(v => v.isValid);

    // Check if total is exactly 100%
    const isTotalValid = Math.abs(roundedTotal - BENEFICIARIES_CONFIG.REQUIRED_TOTAL_PERCENTAGE) < 0.01;

    // Check beneficiary count
    const countValid = beneficiaries.length >= BENEFICIARIES_CONFIG.MIN_BENEFICIARIES &&
                      beneficiaries.length <= BENEFICIARIES_CONFIG.MAX_BENEFICIARIES;

    const isValid = allIndividualValid && isTotalValid && countValid;

    let globalError: string | null = null;
    if (!countValid) {
      if (beneficiaries.length === 0) {
        globalError = BENEFICIARY_ERROR_MESSAGES.MIN_BENEFICIARIES;
      } else if (beneficiaries.length > BENEFICIARIES_CONFIG.MAX_BENEFICIARIES) {
        globalError = BENEFICIARY_ERROR_MESSAGES.MAX_BENEFICIARIES;
      }
    } else if (!isTotalValid) {
      globalError = `Le total doit être exactement de 100%. Actuellement: ${roundedTotal.toFixed(2)}%`;
    }

    return {
      isValid,
      beneficiaryErrors: validations,
      totalPercentage: roundedTotal,
      globalError
    };
  }

  /**
   * Create a new empty beneficiary form data
   */
  createEmptyBeneficiary(orderIndex: number): BeneficiaryFormData {
    return {
      last_name: '',
      first_name: '',
      cin: '',
      date_of_birth: '',
      place_of_birth: '',
      address: '',
      percentage: '',
      order_index: orderIndex,
    };
  }

  /**
   * Calculate percentage suggestions for equal distribution
   */
  calculateEqualDistribution(beneficiaryCount: number): number[] {
    if (beneficiaryCount === 0) return [];

    const basePercentage = 100 / beneficiaryCount;
    const rounded = Math.floor(basePercentage * 100) / 100; // Round down to 2 decimals
    const remainder = 100 - (rounded * beneficiaryCount);

    const percentages = new Array(beneficiaryCount).fill(rounded);

    // Add remainder to first beneficiary to ensure total is 100%
    if (remainder > 0) {
      percentages[0] += remainder;
    }

    return percentages;
  }

  /**
   * Format percentage for display
   */
  formatPercentage(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  }
}

// Create singleton instance
export const beneficiariesService = new BeneficiariesService();