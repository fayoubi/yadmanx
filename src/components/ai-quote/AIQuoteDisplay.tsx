import React from 'react';
import { Quote } from '../../services/llmQuoteService';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface AIQuoteDisplayProps {
  quote: Quote;
  applicantSummary: {
    gender: string;
    age: number;
    city: string;
    healthFactors: string[];
  };
  onApplyNow?: () => void;
  onEmailQuote?: () => void;
  onStartOver?: () => void;
}

export function AIQuoteDisplay({
  quote,
  applicantSummary,
  onApplyNow,
  onEmailQuote,
  onStartOver,
}: AIQuoteDisplayProps) {
  const expiryDate = new Date(quote.expiresAt);
  const isExpiringSoon = expiryDate.getTime() - Date.now() < 24 * 60 * 60 * 1000; // 24 hours

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 animate-fade-in">
      {/* Quote Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Your Quote is Ready!</h2>
        </div>
        <p className="text-blue-100">Quote ID: {quote.quoteId}</p>
      </div>

      {/* Premium Display */}
      <div className="bg-white rounded-lg shadow-lg p-8 text-center border border-gray-200">
        <p className="text-gray-600 text-sm uppercase tracking-wide mb-2">Monthly Premium</p>
        <p className="text-5xl font-bold text-blue-600 mb-1">
          {quote.pricing.monthlyPremium.toFixed(2)} MAD
        </p>
        <p className="text-gray-500 text-sm">
          or {quote.pricing.annualPremium.toFixed(2)} MAD per year
        </p>
      </div>

      {/* Coverage & Term */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Coverage Amount</p>
          <p className="text-2xl font-bold text-gray-900">$500,000</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Term Length</p>
          <p className="text-2xl font-bold text-gray-900">20 years</p>
        </div>
      </div>

      {/* Applicant Summary */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="font-semibold text-lg mb-4 text-gray-900">Applicant Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Gender</p>
            <p className="font-medium capitalize">{applicantSummary.gender}</p>
          </div>
          <div>
            <p className="text-gray-600">Age</p>
            <p className="font-medium">{applicantSummary.age} years</p>
          </div>
          <div>
            <p className="text-gray-600">City</p>
            <p className="font-medium">{applicantSummary.city}</p>
          </div>
          <div>
            <p className="text-gray-600">Health Status</p>
            <p className="font-medium">{quote.riskAssessment.riskClass}</p>
          </div>
        </div>
      </div>

      {/* Rate Factors */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="font-semibold text-lg mb-3 text-gray-900">Rate Factors</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Age Factor</span>
            <span className="font-medium">{quote.riskAssessment.age} years old</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">BMI</span>
            <span className="font-medium">{quote.riskAssessment.bmi.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Risk Class</span>
            <span className="font-medium">{quote.riskAssessment.riskClass}</span>
          </div>
        </div>
      </div>

      {/* Expiry Warning */}
      <div className={`flex items-start gap-2 p-4 rounded-lg ${isExpiringSoon ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
        <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isExpiringSoon ? 'text-amber-600' : 'text-blue-600'}`} />
        <p className={`text-sm ${isExpiringSoon ? 'text-amber-800' : 'text-blue-800'}`}>
          This quote is valid until {expiryDate.toLocaleDateString()} at {expiryDate.toLocaleTimeString()}
          {isExpiringSoon && ' (expires soon!)'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onApplyNow}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
        >
          Apply Now
        </button>
        <button
          onClick={onEmailQuote}
          className="flex-1 bg-white hover:bg-gray-50 text-blue-600 font-semibold py-4 px-6 rounded-lg border-2 border-blue-600 transition-colors"
        >
          Email Quote
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={onStartOver}
          className="text-gray-600 hover:text-gray-900 text-sm underline"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
