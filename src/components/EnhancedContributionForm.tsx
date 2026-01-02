import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAgentAuth } from '../context/AgentAuthContext';
import {
  Calculator,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Settings,
  DollarSign,
  CreditCard,
  Building2,
  Loader2
} from 'lucide-react';

import {
  EnhancedContributionFormData,
  PaymentConfiguration,
  ContributionValidationResult,
  FundOrigin,
  PaymentMode,
  FREQUENCY_LABELS,
  CONTRIBUTION_MINIMUMS,
  FUND_ORIGIN_LABELS,
  PAYMENT_MODE_LABELS,
  RIBValidationResponse
} from '../types/contribution';

import { contributionService, ContributionService } from '../services/ContributionService';
import { RIBValidationService } from '../services/RIBValidationService';
import { formatFrenchCurrency } from '../utils/numberToFrench';

import Input from './ui/Input';
import Button from './ui/Button';
import Card from './ui/Card';
import Label from './ui/Label';
import Select from './ui/Select';

const EnhancedContributionForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const enrollmentId = searchParams.get('enrollmentId');
  const { token } = useAgentAuth();

  // Section 1: Contribution Details (existing functionality)
  const [formData, setFormData] = useState<EnhancedContributionFormData>({
    amount: 0,
    frequency: 'monthly'
  });
  const [validation, setValidation] = useState<ContributionValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);

  // UI State
  const [section1Collapsed, setSection1Collapsed] = useState(false);
  const [showSection2, setShowSection2] = useState(false);

  // Section 2: Payment Configuration
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfiguration>({
    initialPayment: {
      amount: 100,
      amountInText: ''
    },
    fundOrigins: {
      selected: []
    },
    paymentMode: {
      mode: 'check',
      bankName: '',
      agencyName: '',
      checkNumber: '',
      accountNumber: ''
    }
  });

  // Validation states for Section 2
  const [section2Errors, setSection2Errors] = useState<Record<string, string>>({});
  const [ribValidation, setRibValidation] = useState<RIBValidationResponse | null>(null);
  const [isValidatingRIB, setIsValidatingRIB] = useState(false);

  // Update amount in text whenever initial payment amount changes
  useEffect(() => {
    if (paymentConfig.initialPayment.amount > 0) {
      const amountInText = formatFrenchCurrency(paymentConfig.initialPayment.amount);
      setPaymentConfig(prev => ({
        ...prev,
        initialPayment: {
          ...prev.initialPayment,
          amountInText
        }
      }));
    }
  }, [paymentConfig.initialPayment.amount]);

  // Section 1: Original contribution validation logic
  const validateContribution = useCallback(async () => {
    if (formData.amount <= 0) return;

    setIsValidating(true);
    try {
      const result = await contributionService.validateContribution({
        amount: formData.amount,
        frequency: formData.frequency
      });
      setValidation(result);
    } catch (error) {
      console.error('Validation error:', error);
      setValidation({
        isValid: false,
        errorMessage: 'Erreur lors de la validation. Veuillez réessayer.',
        monthlyEquivalent: 0,
        annualTotal: 0
      });
    } finally {
      setIsValidating(false);
    }
  }, [formData.amount, formData.frequency]);

  useEffect(() => {
    if (formData.amount > 0 && hasValidated) {
      validateContribution();
    }
  }, [formData.amount, formData.frequency, hasValidated, validateContribution]);

  // Section 1: Event handlers
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => ({ ...prev, amount: value }));
    if (!hasValidated && value > 0) {
      setHasValidated(true);
    }
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const frequency = e.target.value as any;
    setFormData(prev => ({ ...prev, frequency }));
  };

  const handleValidateClick = () => {
    setHasValidated(true);
    validateContribution();
  };

  const handleConfigurePayments = () => {
    if (validation?.isValid) {
      setSection1Collapsed(true);
      setShowSection2(true);
    }
  };

  // Section 2: Event handlers
  const handleInitialPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(e.target.value) || 0;
    setPaymentConfig(prev => ({
      ...prev,
      initialPayment: {
        ...prev.initialPayment,
        amount
      }
    }));

    // Clear validation error for this field
    if (section2Errors.initialPayment) {
      setSection2Errors(prev => ({ ...prev, initialPayment: '' }));
    }
  };

  const handleFundOriginChange = (origin: FundOrigin, checked: boolean) => {
    setPaymentConfig(prev => ({
      ...prev,
      fundOrigins: {
        ...prev.fundOrigins,
        selected: checked
          ? [...prev.fundOrigins.selected, origin]
          : prev.fundOrigins.selected.filter(o => o !== origin)
      }
    }));

    // Clear validation error for fund origins
    if (section2Errors.fundOrigins) {
      setSection2Errors(prev => ({ ...prev, fundOrigins: '' }));
    }
  };

  const handleOtherDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentConfig(prev => ({
      ...prev,
      fundOrigins: {
        ...prev.fundOrigins,
        otherDescription: e.target.value
      }
    }));
  };

  const handlePaymentModeChange = (mode: PaymentMode) => {
    setPaymentConfig(prev => ({
      ...prev,
      paymentMode: {
        ...prev.paymentMode,
        mode,
        // Clear mode-specific fields when switching
        checkNumber: '',
        accountNumber: ''
      }
    }));

    // Clear validation errors for payment mode
    setSection2Errors(prev => ({
      ...prev,
      paymentMode: '',
      bankName: '',
      agencyName: '',
      checkNumber: '',
      accountNumber: ''
    }));
    setRibValidation(null);
  };

  const handlePaymentFieldChange = (field: string, value: string) => {
    setPaymentConfig(prev => ({
      ...prev,
      paymentMode: {
        ...prev.paymentMode,
        [field]: value
      }
    }));

    // Clear validation error for this field
    if (section2Errors[field]) {
      setSection2Errors(prev => ({ ...prev, [field]: '' }));
    }

    // Handle RIB validation
    if (field === 'accountNumber' && paymentConfig.paymentMode.mode === 'bank_draft') {
      handleRIBValidation(value);
    }
  };

  // RIB validation with debouncing
  const debouncedRIBValidation = useCallback(() => {
    return RIBValidationService.debounceValidation((result: RIBValidationResponse) => {
      setRibValidation(result);
      setIsValidatingRIB(false);
    }, 500);
  }, []);

  const handleRIBValidation = (rib: string) => {
    if (rib.length > 0) {
      setIsValidatingRIB(true);
      setRibValidation(null);
      const debounced = debouncedRIBValidation();
      debounced(rib);
    } else {
      setRibValidation(null);
      setIsValidatingRIB(false);
    }
  };

  // Section 2: Form validation
  const validateSection2 = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate initial payment
    if (paymentConfig.initialPayment.amount < 100) {
      errors.initialPayment = 'Le montant minimum est de 100 dirhams';
    }

    // Validate fund origins
    if (paymentConfig.fundOrigins.selected.length === 0) {
      errors.fundOrigins = 'Veuillez sélectionner au moins une origine des fonds';
    } else if (paymentConfig.fundOrigins.selected.includes('other') && !paymentConfig.fundOrigins.otherDescription?.trim()) {
      errors.otherDescription = 'Veuillez préciser l\'origine des fonds';
    }

    // Validate payment mode fields
    if (!paymentConfig.paymentMode.bankName.trim()) {
      errors.bankName = 'Le nom de la banque est requis';
    }

    if (!paymentConfig.paymentMode.agencyName.trim()) {
      errors.agencyName = 'Le nom de l\'agence est requis';
    }

    if (paymentConfig.paymentMode.mode === 'check') {
      if (!paymentConfig.paymentMode.checkNumber?.trim()) {
        errors.checkNumber = 'Le numéro de chèque est requis';
      }
    } else if (paymentConfig.paymentMode.mode === 'bank_draft') {
      if (!paymentConfig.paymentMode.accountNumber?.trim()) {
        errors.accountNumber = 'Le numéro de compte (RIB) est requis';
      } else if (!RIBValidationService.isValidRIBFormat(paymentConfig.paymentMode.accountNumber)) {
        errors.accountNumber = 'Le RIB doit contenir exactement 24 chiffres';
      } else if (ribValidation && !ribValidation.valid) {
        errors.accountNumber = ribValidation.message || 'Le RIB saisi est invalide. Veuillez vérifier et réessayer.';
      }
    }

    setSection2Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFinalSubmit = async () => {
    if (!enrollmentId) {
      alert('Enrollment ID is missing. Please start from the beginning.');
      navigate('/enroll/start');
      return;
    }

    if (validateSection2()) {
      try {
        // Save contribution data using V2 PUT endpoint
        const agentId = sessionStorage.getItem('agent_id') || '11111111-1111-1111-1111-111111111111';

        const updateResponse = await fetch(`http://localhost:3002/api/v1/enrollments/${enrollmentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-agent-id': agentId
          },
          body: JSON.stringify({
            contribution: {
              amount: formData.amount,
              frequency: formData.frequency,
              initialPayment: {
                amount: paymentConfig.initialPayment.amount
              },
              fundOrigins: {
                selected: paymentConfig.fundOrigins.selected,
                otherDescription: paymentConfig.fundOrigins.otherDescription || null
              },
              paymentMode: {
                mode: paymentConfig.paymentMode.mode,
                bankName: paymentConfig.paymentMode.bankName,
                agencyName: paymentConfig.paymentMode.agencyName,
                checkNumber: paymentConfig.paymentMode.mode === 'check' ? paymentConfig.paymentMode.checkNumber : null,
                accountNumber: paymentConfig.paymentMode.mode === 'bank_draft' ? paymentConfig.paymentMode.accountNumber : null
              },
              effectiveDate: new Date().toISOString().split('T')[0]
            }
          })
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to save contribution information');
        }

        // Navigate to beneficiaries page with enrollment ID
        navigate(`/enroll/beneficiaries?enrollmentId=${enrollmentId}`);
      } catch (error) {
        console.error('Failed to save billing data:', error);
        alert('Une erreur s\'est produite lors de l\'enregistrement. Veuillez réessayer.');
      }
    }
  };

  const getMinimumForCurrentFrequency = () => {
    return CONTRIBUTION_MINIMUMS[formData.frequency];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contribution Financière</h1>
          <p className="text-gray-600">Définissez votre montant et configurez vos paiements</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800">Étape 2 sur 3 - Contribution et paiement</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Section 1: Contribution Details */}
          <Card className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Calculator className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Détails de la Contribution</h2>
                </div>
                {showSection2 && (
                  <button
                    onClick={() => setSection1Collapsed(!section1Collapsed)}
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {section1Collapsed ? <ChevronDown /> : <ChevronUp />}
                  </button>
                )}
              </div>

              {!section1Collapsed && (
                <div className="space-y-6">
                  {/* Annual amount in French text */}
                  {validation?.isValid && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">Confirmation de la Contribution</h3>
                      <p className="text-green-700 text-lg">
                        {formatFrenchCurrency(validation.annualTotal)}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="amount">Montant de la cotisation (MAD) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        step="50"
                        value={formData.amount || ''}
                        onChange={handleAmountChange}
                        placeholder="Entrez le montant"
                        className={validation && !validation.isValid ? 'border-red-500' : ''}
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Minimum: {getMinimumForCurrentFrequency().toLocaleString('fr-MA')} MAD pour la fréquence {FREQUENCY_LABELS[formData.frequency].toLowerCase()}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="frequency">Fréquence de paiement *</Label>
                      <Select
                        id="frequency"
                        value={formData.frequency}
                        onChange={handleFrequencyChange}
                      >
                        {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {!showSection2 && (
                    <div className="mt-6 flex justify-center">
                      <Button
                        onClick={handleValidateClick}
                        disabled={isValidating || formData.amount <= 0}
                        className="flex items-center gap-2"
                      >
                        {isValidating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Validation...
                          </>
                        ) : (
                          <>
                            <Calculator className="h-4 w-4" />
                            Valider la Contribution
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Validation Result */}
                  {validation && (
                    <Card className={`p-6 ${validation.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-start gap-3">
                        {validation.isValid ? (
                          <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold mb-2 ${validation.isValid ? 'text-green-800' : 'text-red-800'}`}>
                            {validation.isValid ? 'Contribution Validée' : 'Erreur de Validation'}
                          </h3>

                          {validation.isValid ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg border border-green-200">
                                <div className="text-center">
                                  <p className="text-sm text-gray-600">Montant Annuel:</p>
                                  <p className="text-lg font-semibold text-green-800">
                                    {ContributionService.formatCurrency(validation.annualTotal)}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm text-gray-600">Périodicité:</p>
                                  <p className="text-lg font-semibold text-green-800">
                                    {FREQUENCY_LABELS[formData.frequency]}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm text-gray-600">Prochain Paiement:</p>
                                  <p className="text-lg font-semibold text-green-800">
                                    {ContributionService.formatCurrency(validation.monthlyEquivalent)}
                                  </p>
                                </div>
                              </div>
                              {!showSection2 && (
                                <Button
                                  onClick={handleConfigurePayments}
                                  className="w-full flex items-center justify-center gap-2"
                                >
                                  <Settings className="h-4 w-4" />
                                  Configurer mes paiements
                                </Button>
                              )}
                            </div>
                          ) : (
                            <p className="text-red-700">{validation.errorMessage}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {section1Collapsed && validation?.isValid && (
                <div className="text-center py-4 text-gray-600">
                  <p>Contribution Annuelle: <strong>{ContributionService.formatCurrency(validation.annualTotal)}</strong></p>
                  <p className="text-sm">({formatFrenchCurrency(validation.annualTotal)})</p>
                </div>
              )}
            </div>
          </Card>

          {/* Section 2: Payment Configuration */}
          {showSection2 && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">Configuration des Paiements</h2>
              </div>

              <div className="space-y-8">
                {/* Initial Payment */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Versement Initial
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="initial-amount">Montant en chiffres (MAD) *</Label>
                      <Input
                        id="initial-amount"
                        type="number"
                        min="100"
                        step="50"
                        value={paymentConfig.initialPayment.amount || ''}
                        onChange={handleInitialPaymentChange}
                        className={section2Errors.initialPayment ? 'border-red-500' : ''}
                      />
                      {section2Errors.initialPayment && (
                        <p className="text-sm text-red-600 mt-1">{section2Errors.initialPayment}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="initial-amount-text">Montant en lettres</Label>
                      <Input
                        id="initial-amount-text"
                        value={paymentConfig.initialPayment.amountInText}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Fund Origins */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Origine des Fonds *</h3>
                  <div className="space-y-3">
                    {Object.entries(FUND_ORIGIN_LABELS).map(([origin, label]) => (
                      <div key={origin} className="space-y-2">
                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={paymentConfig.fundOrigins.selected.includes(origin as FundOrigin)}
                            onChange={(e) => handleFundOriginChange(origin as FundOrigin, e.target.checked)}
                            className="mt-1"
                          />
                          <span className="text-gray-700">{label}</span>
                        </label>
                        {origin === 'other' && paymentConfig.fundOrigins.selected.includes('other') && (
                          <div className="ml-6">
                            <Input
                              placeholder="Précisez l'origine des fonds"
                              value={paymentConfig.fundOrigins.otherDescription || ''}
                              onChange={handleOtherDescriptionChange}
                              className={section2Errors.otherDescription ? 'border-red-500' : ''}
                            />
                            {section2Errors.otherDescription && (
                              <p className="text-sm text-red-600 mt-1">{section2Errors.otherDescription}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {section2Errors.fundOrigins && (
                    <p className="text-sm text-red-600 mt-2">{section2Errors.fundOrigins}</p>
                  )}
                </div>

                {/* Payment Mode */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Mode de Paiement *
                  </h3>

                  <div className="space-y-4">
                    {/* Payment Mode Selection */}
                    <div className="space-y-2">
                      {Object.entries(PAYMENT_MODE_LABELS).map(([mode, label]) => (
                        <label key={mode} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment-mode"
                            checked={paymentConfig.paymentMode.mode === mode}
                            onChange={() => handlePaymentModeChange(mode as PaymentMode)}
                          />
                          <span className="text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>

                    {/* Payment Mode Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bank-name">Banque *</Label>
                        <Input
                          id="bank-name"
                          value={paymentConfig.paymentMode.bankName}
                          onChange={(e) => handlePaymentFieldChange('bankName', e.target.value)}
                          className={section2Errors.bankName ? 'border-red-500' : ''}
                        />
                        {section2Errors.bankName && (
                          <p className="text-sm text-red-600 mt-1">{section2Errors.bankName}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="agency-name">Agence *</Label>
                        <Input
                          id="agency-name"
                          value={paymentConfig.paymentMode.agencyName}
                          onChange={(e) => handlePaymentFieldChange('agencyName', e.target.value)}
                          className={section2Errors.agencyName ? 'border-red-500' : ''}
                        />
                        {section2Errors.agencyName && (
                          <p className="text-sm text-red-600 mt-1">{section2Errors.agencyName}</p>
                        )}
                      </div>

                      {paymentConfig.paymentMode.mode === 'check' && (
                        <div>
                          <Label htmlFor="check-number">Numéro de chèque *</Label>
                          <Input
                            id="check-number"
                            value={paymentConfig.paymentMode.checkNumber || ''}
                            onChange={(e) => handlePaymentFieldChange('checkNumber', e.target.value)}
                            className={section2Errors.checkNumber ? 'border-red-500' : ''}
                          />
                          {section2Errors.checkNumber && (
                            <p className="text-sm text-red-600 mt-1">{section2Errors.checkNumber}</p>
                          )}
                        </div>
                      )}

                      {paymentConfig.paymentMode.mode === 'bank_draft' && (
                        <div>
                          <Label htmlFor="account-number">Numéro de compte (RIB) *</Label>
                          <div className="relative">
                            <Input
                              id="account-number"
                              value={paymentConfig.paymentMode.accountNumber || ''}
                              onChange={(e) => handlePaymentFieldChange('accountNumber', e.target.value)}
                              placeholder="24 chiffres"
                              className={section2Errors.accountNumber ? 'border-red-500' : ''}
                            />
                            {isValidatingRIB && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                              </div>
                            )}
                            {ribValidation && !isValidatingRIB && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                {ribValidation.valid ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                            )}
                          </div>
                          {section2Errors.accountNumber && (
                            <p className="text-sm text-red-600 mt-1">{section2Errors.accountNumber}</p>
                          )}
                          {ribValidation && ribValidation.valid && !section2Errors.accountNumber && (
                            <p className="text-sm text-green-600 mt-1">
                              ✓ {ribValidation.message || 'RIB valide'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t border-gray-200">
                  <Button
                    onClick={handleFinalSubmit}
                    className="w-full flex items-center justify-center gap-2"
                    disabled={isValidatingRIB}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Finaliser la Configuration
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={async () => {
                // Save current contribution data before navigating back
                if (enrollmentId && formData.amount) {
                  const agentId = sessionStorage.getItem('agent_id') || '11111111-1111-1111-1111-111111111111';
                  try {
                    await fetch(`http://localhost:3002/api/v1/enrollments/${enrollmentId}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-agent-id': agentId
                      },
                      body: JSON.stringify({
                        contribution: {
                          amount: formData.amount,
                          frequency: formData.frequency,
                          initialPayment: {
                            amount: paymentConfig.initialPayment.amount
                          },
                          fundOrigins: {
                            selected: paymentConfig.fundOrigins.selected,
                            otherDescription: paymentConfig.fundOrigins.otherDescription || null
                          },
                          paymentMode: {
                            mode: paymentConfig.paymentMode.mode,
                            bankName: paymentConfig.paymentMode.bankName,
                            agencyName: paymentConfig.paymentMode.agencyName,
                            checkNumber: paymentConfig.paymentMode.mode === 'check' ? paymentConfig.paymentMode.checkNumber : null,
                            accountNumber: paymentConfig.paymentMode.mode === 'bank_draft' ? paymentConfig.paymentMode.accountNumber : null
                          },
                          effectiveDate: new Date().toISOString().split('T')[0]
                        }
                      })
                    });
                  } catch (error) {
                    console.error('Failed to save before navigation:', error);
                  }
                }
                navigate('/enroll/start');
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            {showSection2 && (
              <Button
                onClick={handleFinalSubmit}
                className="flex items-center gap-2"
                disabled={isValidatingRIB}
              >
                Suivant
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedContributionForm;