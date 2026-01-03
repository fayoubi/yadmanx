import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Save
} from 'lucide-react';

import {
  BeneficiaryFormData,
  BeneficiariesFormState,
  BENEFICIARIES_CONFIG,
  BENEFICIARY_FIELD_LABELS,
  BENEFICIARY_ERROR_MESSAGES,
} from '../types/beneficiaries';

import { beneficiariesService } from '../services/BeneficiariesService';

import Input from './ui/Input';
import Button from './ui/Button';
import Card from './ui/Card';
import Label from './ui/Label';

const BeneficiariesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const enrollmentId = searchParams.get('enrollmentId');

  const [formState, setFormState] = useState<BeneficiariesFormState>({
    beneficiaries: [],
    totalPercentage: 0,
    isValid: false,
    isLoading: true,
    isSaving: false,
  });

  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load existing beneficiaries on mount
  useEffect(() => {
    loadBeneficiaries();
  }, [enrollmentId]);

  // Calculate total percentage and validation whenever beneficiaries change
  useEffect(() => {
    const validation = beneficiariesService.validateBeneficiariesForm(formState.beneficiaries);

    setFormState(prev => ({
      ...prev,
      totalPercentage: validation.totalPercentage,
      isValid: validation.isValid,
      globalError: validation.globalError || undefined,
    }));

    // Update individual errors
    const updatedBeneficiaries = formState.beneficiaries.map((b, index) => ({
      ...b,
      errors: validation.beneficiaryErrors[index]?.errors || {}
    }));

    if (JSON.stringify(updatedBeneficiaries) !== JSON.stringify(formState.beneficiaries)) {
      setFormState(prev => ({
        ...prev,
        beneficiaries: updatedBeneficiaries
      }));
    }
  }, [formState.beneficiaries.length, formState.beneficiaries.map(b =>
    `${b.last_name}-${b.first_name}-${b.date_of_birth}-${b.percentage}`
  ).join('|')]);

  const loadBeneficiaries = async () => {
    if (!enrollmentId) {
      setFormState(prev => ({ ...prev, isLoading: false, globalError: 'Enrollment ID is missing' }));
      return;
    }

    try {
      setFormState(prev => ({ ...prev, isLoading: true }));

      const beneficiaries = await beneficiariesService.getBeneficiariesForEnrollment(enrollmentId);

      if (beneficiaries.length === 0) {
        // Initialize with one empty beneficiary
        const emptyBeneficiary = beneficiariesService.createEmptyBeneficiary(1);
        setFormState(prev => ({
          ...prev,
          beneficiaries: [emptyBeneficiary],
          isLoading: false,
        }));
      } else {
        // Convert API data to form data
        const formData: BeneficiaryFormData[] = beneficiaries.map((b, index) => ({
          id: b.id,
          last_name: b.last_name,
          first_name: b.first_name,
          cin: b.cin || '',
          date_of_birth: b.date_of_birth,
          place_of_birth: b.place_of_birth || '',
          address: b.address || '',
          percentage: b.percentage,
          order_index: b.order_index || index + 1,
        }));

        setFormState(prev => ({
          ...prev,
          beneficiaries: formData,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Failed to load beneficiaries:', error);
      setFormState(prev => ({
        ...prev,
        isLoading: false,
        globalError: 'Erreur lors du chargement des bénéficiaires'
      }));
    }
  };

  const handleAddBeneficiary = () => {
    if (formState.beneficiaries.length >= BENEFICIARIES_CONFIG.MAX_BENEFICIARIES) {
      return;
    }

    const newBeneficiary = beneficiariesService.createEmptyBeneficiary(
      formState.beneficiaries.length + 1
    );

    setFormState(prev => ({
      ...prev,
      beneficiaries: [...prev.beneficiaries, newBeneficiary]
    }));

    setHasUnsavedChanges(true);
  };

  const handleRemoveBeneficiary = (index: number) => {
    if (formState.beneficiaries.length <= BENEFICIARIES_CONFIG.MIN_BENEFICIARIES) {
      return;
    }

    const updatedBeneficiaries = formState.beneficiaries
      .filter((_, i) => i !== index)
      .map((b, newIndex) => ({ ...b, order_index: newIndex + 1 }));

    setFormState(prev => ({
      ...prev,
      beneficiaries: updatedBeneficiaries
    }));

    setHasUnsavedChanges(true);
  };

  const handleFieldChange = (index: number, field: keyof BeneficiaryFormData, value: string | number) => {
    const updatedBeneficiaries = [...formState.beneficiaries];
    updatedBeneficiaries[index] = {
      ...updatedBeneficiaries[index],
      [field]: value
    };

    setFormState(prev => ({
      ...prev,
      beneficiaries: updatedBeneficiaries
    }));

    setHasUnsavedChanges(true);
  };

  const handleEqualDistribution = () => {
    const equalPercentages = beneficiariesService.calculateEqualDistribution(
      formState.beneficiaries.length
    );

    const updatedBeneficiaries = formState.beneficiaries.map((b, index) => ({
      ...b,
      percentage: equalPercentages[index] || 0
    }));

    setFormState(prev => ({
      ...prev,
      beneficiaries: updatedBeneficiaries
    }));

    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!enrollmentId) {
      setFormState(prev => ({
        ...prev,
        globalError: 'Enrollment ID is missing. Please start from the beginning.'
      }));
      return;
    }

    if (!formState.isValid) {
      return;
    }

    try {
      setFormState(prev => ({ ...prev, isSaving: true }));

      const result = await beneficiariesService.saveBeneficiaries(
        enrollmentId,
        formState.beneficiaries
      );

      if (result.success) {
        setHasUnsavedChanges(false);
        // Show success message briefly
        setFormState(prev => ({
          ...prev,
          isSaving: false,
          globalError: undefined
        }));

        // Auto-save success feedback
        setTimeout(() => {
          // Could add a success toast here
        }, 1000);
      } else {
        setFormState(prev => ({
          ...prev,
          isSaving: false,
          globalError: result.message
        }));
      }
    } catch (error) {
      console.error('Failed to save beneficiaries:', error);
      setFormState(prev => ({
        ...prev,
        isSaving: false,
        globalError: 'Erreur lors de la sauvegarde'
      }));
    }
  };

  const handleSubmit = async () => {
    if (!enrollmentId) {
      alert('Enrollment ID is missing. Please start from the beginning.');
      navigate('/enroll/start');
      return;
    }

    if (!formState.isValid) {
      return;
    }

    await handleSave();

    if (formState.isValid && !formState.globalError) {
      // Navigate to next step or confirmation page
      navigate(`/enroll/confirmation?enrollmentId=${enrollmentId}`);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      navigate(`/enroll/contribution?enrollmentId=${enrollmentId}`);
    }
  };

  const confirmBack = () => {
    setShowUnsavedWarning(false);
    navigate('/enroll/contribution');
  };

  if (formState.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg text-gray-600">Chargement des bénéficiaires...</span>
          </div>
        </div>
      </div>
    );
  }

  const canAddBeneficiary = formState.beneficiaries.length < BENEFICIARIES_CONFIG.MAX_BENEFICIARIES;
  const canRemoveBeneficiary = formState.beneficiaries.length > BENEFICIARIES_CONFIG.MIN_BENEFICIARIES;
  const isValidTotal = Math.abs(formState.totalPercentage - 100) < 0.01;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Bénéficiaires en cas de Décès
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">Instructions importantes</h3>
                <p className="text-sm text-blue-700 mb-2">
                  • Veuillez désigner jusqu'à {BENEFICIARIES_CONFIG.MAX_BENEFICIARIES} bénéficiaires
                </p>
                <p className="text-sm text-blue-700">
                  • Le total des pourcentages alloués doit être exactement de {BENEFICIARIES_CONFIG.REQUIRED_TOTAL_PERCENTAGE}%
                </p>
              </div>
            </div>
          </div>

          {/* Total Percentage Indicator */}
          <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
            isValidTotal
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {isValidTotal ? (
                <CheckCircle className="h-6 w-6 mr-2" />
              ) : (
                <AlertCircle className="h-6 w-6 mr-2" />
              )}
              <span className="text-lg font-bold">
                Total alloué: {beneficiariesService.formatPercentage(formState.totalPercentage)}% / 100%
              </span>
            </div>
            {formState.beneficiaries.length > 1 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleEqualDistribution}
                className="text-sm"
              >
                Distribution égale
              </Button>
            )}
          </div>

          {formState.globalError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-red-700">{formState.globalError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Beneficiaries List */}
        <div className="space-y-6 mb-8">
          {formState.beneficiaries.map((beneficiary, index) => (
            <BeneficiaryCard
              key={`beneficiary-${index}`}
              beneficiary={beneficiary}
              index={index}
              canRemove={canRemoveBeneficiary}
              onFieldChange={handleFieldChange}
              onRemove={handleRemoveBeneficiary}
            />
          ))}
        </div>

        {/* Add Beneficiary Button */}
        {canAddBeneficiary && (
          <div className="mb-8">
            <Button
              variant="secondary"
              onClick={handleAddBeneficiary}
              className="w-full md:w-auto"
              disabled={formState.isSaving}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un bénéficiaire ({formState.beneficiaries.length}/{BENEFICIARIES_CONFIG.MAX_BENEFICIARIES})
            </Button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col md:flex-row justify-between gap-4 pt-6 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={formState.isSaving}
            className="order-2 md:order-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <div className="flex gap-2 order-1 md:order-2">
            <Button
              variant="secondary"
              onClick={handleSave}
              disabled={!formState.isValid || formState.isSaving}
            >
              {formState.isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={!formState.isValid || formState.isSaving}
            >
              {formState.isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finalisation...
                </>
              ) : (
                <>
                  Confirmer et Continuer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Unsaved Changes Warning Modal */}
        {showUnsavedWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Modifications non enregistrées
              </h3>
              <p className="text-gray-600 mb-6">
                Vous avez des modifications non enregistrées. Voulez-vous vraiment continuer sans les sauvegarder ?
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowUnsavedWarning(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={confirmBack}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Continuer sans sauvegarder
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Individual Beneficiary Card Component
interface BeneficiaryCardProps {
  beneficiary: BeneficiaryFormData;
  index: number;
  canRemove: boolean;
  onFieldChange: (index: number, field: keyof BeneficiaryFormData, value: string | number) => void;
  onRemove: (index: number) => void;
}

const BeneficiaryCard: React.FC<BeneficiaryCardProps> = ({
  beneficiary,
  index,
  canRemove,
  onFieldChange,
  onRemove,
}) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Bénéficiaire {index + 1}
        </h3>
        {canRemove && (
          <Button
            size="sm"
            onClick={() => onRemove(index)}
            className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Supprimer
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name Fields */}
        <div>
          <Label htmlFor={`last-name-${index}`}>
            {BENEFICIARY_FIELD_LABELS.last_name} *
          </Label>
          <Input
            id={`last-name-${index}`}
            value={beneficiary.last_name}
            onChange={(e) => onFieldChange(index, 'last_name', e.target.value)}
            className={beneficiary.errors?.last_name ? 'border-red-500' : ''}
          />
          {beneficiary.errors?.last_name && (
            <p className="text-sm text-red-600 mt-1">{beneficiary.errors.last_name}</p>
          )}
        </div>

        <div>
          <Label htmlFor={`first-name-${index}`}>
            {BENEFICIARY_FIELD_LABELS.first_name} *
          </Label>
          <Input
            id={`first-name-${index}`}
            value={beneficiary.first_name}
            onChange={(e) => onFieldChange(index, 'first_name', e.target.value)}
            className={beneficiary.errors?.first_name ? 'border-red-500' : ''}
          />
          {beneficiary.errors?.first_name && (
            <p className="text-sm text-red-600 mt-1">{beneficiary.errors.first_name}</p>
          )}
        </div>

        {/* CIN - Optional */}
        <div>
          <Label htmlFor={`cin-${index}`}>
            {BENEFICIARY_FIELD_LABELS.cin}
          </Label>
          <Input
            id={`cin-${index}`}
            value={beneficiary.cin}
            onChange={(e) => onFieldChange(index, 'cin', e.target.value)}
            placeholder="CIN (Optionnel)"
          />
        </div>

        {/* Date of Birth */}
        <div>
          <Label htmlFor={`date-birth-${index}`}>
            {BENEFICIARY_FIELD_LABELS.date_of_birth} *
          </Label>
          <Input
            id={`date-birth-${index}`}
            type="date"
            value={beneficiary.date_of_birth}
            onChange={(e) => onFieldChange(index, 'date_of_birth', e.target.value)}
            className={beneficiary.errors?.date_of_birth ? 'border-red-500' : ''}
          />
          {beneficiary.errors?.date_of_birth && (
            <p className="text-sm text-red-600 mt-1">{beneficiary.errors.date_of_birth}</p>
          )}
        </div>

        {/* Place of Birth */}
        <div className="md:col-span-2">
          <Label htmlFor={`place-birth-${index}`}>
            {BENEFICIARY_FIELD_LABELS.place_of_birth} *
          </Label>
          <Input
            id={`place-birth-${index}`}
            value={beneficiary.place_of_birth}
            onChange={(e) => onFieldChange(index, 'place_of_birth', e.target.value)}
            placeholder="Ville de naissance"
            className={beneficiary.errors?.place_of_birth ? 'border-red-500' : ''}
          />
          {beneficiary.errors?.place_of_birth && (
            <p className="text-sm text-red-600 mt-1">{beneficiary.errors.place_of_birth}</p>
          )}
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <Label htmlFor={`address-${index}`}>
            {BENEFICIARY_FIELD_LABELS.address} *
          </Label>
          <textarea
            id={`address-${index}`}
            value={beneficiary.address}
            onChange={(e) => onFieldChange(index, 'address', e.target.value)}
            placeholder="Adresse complète"
            rows={3}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              beneficiary.errors?.address ? 'border-red-500' : ''
            }`}
          />
          {beneficiary.errors?.address && (
            <p className="text-sm text-red-600 mt-1">{beneficiary.errors.address}</p>
          )}
        </div>

        {/* Percentage */}
        <div>
          <Label htmlFor={`percentage-${index}`}>
            {BENEFICIARY_FIELD_LABELS.percentage} *
          </Label>
          <div className="relative">
            <Input
              id={`percentage-${index}`}
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={beneficiary.percentage}
              onChange={(e) => onFieldChange(index, 'percentage', parseFloat(e.target.value) || 0)}
              className={`pr-8 ${beneficiary.errors?.percentage ? 'border-red-500' : ''}`}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              %
            </span>
          </div>
          {beneficiary.errors?.percentage && (
            <p className="text-sm text-red-600 mt-1">{beneficiary.errors.percentage}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BeneficiariesPage;