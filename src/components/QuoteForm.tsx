import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, ChevronDown, Loader2, Sparkles, MessageCircle } from 'lucide-react';
import { useQuote } from '../context/QuoteContext';
import { pricingService, PricingService } from '../services/PricingService';
import PageLayout from './common/PageLayout';

interface QuoteFormData {
  gender: 'male' | 'female';
  birthdate: string; // stored as DD/MM/YYYY
  heightCm: string;
  weightKg: string;
  city: string;
  usesNicotine: boolean;
}

const QuoteForm: React.FC = () => {
  const navigate = useNavigate();
  const {
    setFormData: setQuoteFormData,
    setCurrentQuote,
    isCalculatingQuote,
    setIsCalculatingQuote,
    quoteError,
    setQuoteError
  } = useQuote();

  const [formData, setFormData] = useState<QuoteFormData>({
    gender: 'male',
    birthdate: '',
    heightCm: '',
    weightKg: '',
    city: '',
    usesNicotine: false,
  });

  // Top 10 Moroccan cities by population (ordered alphabetically for display)
  const moroccanCities = [
    'Agadir',
    'Casablanca', 
    'Fez',
    'Kenitra',
    'Marrakech',
    'Meknes',
    'Oujda',
    'Rabat',
    'Tangier',
    'Tetouan'
  ];

  const handleInputChange = (field: keyof QuoteFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Force DD/MM/YYYY formatting as the user types
  const handleBirthdateChange = (raw: string) => {
    // keep only digits, max 8 (ddmmyyyy)
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 8);
    const parts = [digitsOnly.slice(0, 2), digitsOnly.slice(2, 4), digitsOnly.slice(4, 8)].filter(Boolean);
    const formatted = parts.join('/');
    handleInputChange('birthdate', formatted);
  };

  const validateForm = (): string | null => {
    if (!formData.birthdate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return 'Please enter a valid birth date in DD/MM/YYYY format';
    }

    if (!formData.heightCm) {
      return 'Please select your height';
    }

    if (!formData.weightKg || parseInt(formData.weightKg) < 35 || parseInt(formData.weightKg) > 200) {
      return 'Please enter a valid weight between 35-200 kg';
    }

    if (!formData.city) {
      return 'Please select your city';
    }

    // Check if age is within valid range (18-75)
    const [day, month, year] = formData.birthdate.split('/').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    if (age < 18) {
      return 'You must be at least 18 years old to get a quote';
    }

    if (age > 75) {
      return 'Unfortunately, we cannot provide quotes for applicants over 75 years old';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear any previous errors
    setQuoteError(null);

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setQuoteError(validationError);
      return;
    }

    try {
      setIsCalculatingQuote(true);

      // Convert form data to pricing request format
      const pricingRequest = PricingService.convertFormDataToPricingRequest(formData, {
        termLength: 20, // Default to 20 years initially
        coverageAmount: 500000 // Default to $500K initially
      });

      // Call pricing service
      const quoteResponse = await pricingService.calculateQuote(pricingRequest);

      // Store the form data and quote in context
      setQuoteFormData(formData);
      setCurrentQuote(quoteResponse.quote);

      // Navigate to quote display
      navigate('/quote');

    } catch (error) {
      console.error('Error calculating quote:', error);
      setQuoteError(
        error instanceof Error
          ? error.message
          : 'Unable to calculate quote. Please try again.'
      );
    } finally {
      setIsCalculatingQuote(false);
    }
  };

  return (
    <PageLayout
      title="YadmanX"
      subtitle="Get Your Quote in Minutes"
      description="No exam required. Instant online quotes. Simple application process. Get term life insurance coverage for you and your family."
    >
      <div className="max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Section - Marketing Content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-primary-900 mb-4">
                Get a No Exam Term Life Insurance Quote
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Apply online in minutes. Get an instant decision. Then personalize your coverage.
              </p>
            </div>

            <div className="bg-gray-100 rounded-lg p-6">
              <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                <img
                  src="/term-image.png"
                  alt="Family term life insurance"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm text-gray-600">
                Secure, fast, and reliable term life insurance coverage for you and your family.
              </p>
            </div>
          </div>

        {/* Right Section - Form */}
        <div className="bg-primary-900 rounded-xl p-6">
          {/* Error Message */}
          {quoteError && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {quoteError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Gender Selection */}
            <div>
              <div className="flex space-x-2 mb-2">
                <button
                  type="button"
                  onClick={() => handleInputChange('gender', 'male')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    formData.gender === 'male'
                      ? 'bg-white text-gray-900'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('gender', 'female')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    formData.gender === 'female'
                      ? 'bg-white text-gray-900'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Female
                </button>
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Birthdate */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Date of Birth (DD/MM/YYYY)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={formData.birthdate}
                onChange={(e) => handleBirthdateChange(e.target.value)}
                placeholder="dd/mm/yyyy"
                className="w-full px-4 py-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white/50"
                required
              />
              <p className="text-xs text-white/70 mt-1">European format: Day/Month/Year</p>
            </div>

            {/* Height in Centimeters */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Height (cm)
              </label>
              <div className="relative">
                <select
                  value={formData.heightCm}
                  onChange={(e) => handleInputChange('heightCm', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white/50 appearance-none"
                  required
                >
                  <option value="">Select height</option>
                  <option value="120">120 cm (3'11")</option>
                  <option value="125">125 cm (4'1")</option>
                  <option value="130">130 cm (4'3")</option>
                  <option value="135">135 cm (4'5")</option>
                  <option value="140">140 cm (4'7")</option>
                  <option value="145">145 cm (4'9")</option>
                  <option value="150">150 cm (4'11")</option>
                  <option value="155">155 cm (5'1")</option>
                  <option value="160">160 cm (5'3")</option>
                  <option value="165">165 cm (5'5")</option>
                  <option value="170">170 cm (5'7")</option>
                  <option value="175">175 cm (5'9")</option>
                  <option value="180">180 cm (5'11")</option>
                  <option value="185">185 cm (6'1")</option>
                  <option value="190">190 cm (6'3")</option>
                  <option value="195">195 cm (6'5")</option>
                  <option value="200">200 cm (6'7")</option>
                  <option value="205">205 cm (6'9")</option>
                  <option value="210">210 cm (6'11")</option>
                  <option value="215">215 cm (7'1")</option>
                  <option value="220">220 cm (7'3")</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Weight in Kilograms */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                value={formData.weightKg}
                onChange={(e) => handleInputChange('weightKg', e.target.value)}
                placeholder="Enter weight in kilograms"
                className="w-full px-4 py-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white/50"
                required
              />
            </div>

            {/* Moroccan Cities */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                City
              </label>
              <div className="relative">
                <select
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white/50 appearance-none"
                  required
                >
                  <option value="">Select your city</option>
                  {moroccanCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Nicotine Checkbox */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="nicotine"
                checked={formData.usesNicotine}
                onChange={(e) => handleInputChange('usesNicotine', e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <label htmlFor="nicotine" className="text-white text-sm">
                I currently use nicotine products
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCalculatingQuote}
              className="w-full bg-accent-500 hover:bg-accent-600 disabled:bg-accent-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {isCalculatingQuote ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Calculating your quote...
                </>
              ) : (
                'Continue for no exam quote'
              )}
            </button>

            {/* OR Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-primary-900 text-white/60 font-medium">OR</span>
              </div>
            </div>

            {/* AI Assistant Option */}
            <button
              type="button"
              onClick={() => navigate('/ai-quote')}
              className="w-full bg-white/10 hover:bg-white/20 border-2 border-white/30 hover:border-white/50 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 group"
            >
              <div className="relative">
                <MessageCircle className="w-5 h-5" />
                <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
              </div>
              <span>Try AI Assistant</span>
              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">NEW</span>
            </button>

            {/* AI Assistant Info */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-white/70">
                  <span className="font-semibold text-white">Prefer to chat?</span> Our AI assistant will guide you through the process with a natural conversation.
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
    </PageLayout>
  );
};

export default QuoteForm;
