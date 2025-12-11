import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Bot } from 'lucide-react';
import { useConversation } from '../../hooks/useConversation';
import { ConversationContainer } from './ConversationContainer';
import { InputField } from './InputField';
import { ProgressIndicator } from './ProgressIndicator';
import { AIQuoteDisplay } from './AIQuoteDisplay';
import PageLayout from '../common/PageLayout';

export default function AiQuotePage() {
  const navigate = useNavigate();
  const {
    messages,
    isLoading,
    status,
    progress,
    quote,
    sendMessage,
    resetConversation,
    error,
  } = useConversation();

  const handleApplyNow = () => {
    // Navigate to enrollment with quote data
    navigate('/enroll/start', { state: { quote } });
  };

  const handleEmailQuote = () => {
    // TODO: Implement email quote functionality
    alert('Email quote functionality coming soon!');
  };

  const handleStartOver = () => {
    resetConversation();
  };

  return (
    <PageLayout
      title="AI Quote Assistant"
      subtitle="Get Your Quote in Minutes with AI"
      description="Chat with our AI assistant to get a personalized life insurance quote. Natural conversation, instant results."
      showHeroButtons={false}
      contentClassName="py-0"
    >
      <div className="max-w-5xl mx-auto">
        {/* Progress Indicator - Only show when collecting */}
        {status === 'collecting' && progress.current > 0 && (
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
            <ProgressIndicator current={progress.current} total={progress.total} />
          </div>
        )}

        {/* Main Content */}
        {status === 'complete' && quote ? (
          <div className="py-8">
            <AIQuoteDisplay
              quote={quote}
              applicantSummary={{
                gender: quote.riskAssessment.age > 0 ? 'N/A' : 'N/A',
                age: quote.riskAssessment.age,
                city: 'N/A',
                healthFactors: quote.riskAssessment.riskFactors,
              }}
              onApplyNow={handleApplyNow}
              onEmailQuote={handleEmailQuote}
              onStartOver={handleStartOver}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Chat Header */}
            <div className="bg-primary-900 text-white px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-semibold">YadmanX AI Assistant</h2>
                <p className="text-sm text-primary-100">Online • Ready to help</p>
              </div>
            </div>

            {/* Conversation Container */}
            <div className="bg-gray-50">
              <ConversationContainer messages={messages} isLoading={isLoading} />
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border-t border-red-200 px-4 py-3">
                <div className="max-w-3xl mx-auto">
                  <p className="text-red-800 text-sm">{error}</p>
                  <button
                    onClick={resetConversation}
                    className="text-red-600 underline text-sm mt-1"
                  >
                    Start over
                  </button>
                </div>
              </div>
            )}

            {/* Input Field */}
            <div className="border-t border-gray-200 bg-white">
              <InputField
                onSend={sendMessage}
                disabled={isLoading || status === 'complete' || status === 'error'}
                placeholder={
                  status === 'calculating'
                    ? 'Calculating your quote...'
                    : 'Type your message...'
                }
              />
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Powered by Claude AI</p>
              <p className="text-blue-700">
                Our AI assistant will ask you a few simple questions to calculate your personalized quote.
                Your conversation is secure and encrypted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
