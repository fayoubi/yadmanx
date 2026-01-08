import React from 'react';
import { useAgentAuth } from '../../context/AgentAuthContext';
import AuthenticatedHeader from './AuthenticatedHeader';
import Header from '../Header';
import PageFooter from './PageFooter';

interface EnrollmentLayoutProps {
  children: React.ReactNode;
}

const EnrollmentLayout: React.FC<EnrollmentLayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAgentAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Conditional Header based on authentication state */}
      {isAuthenticated ? (
        <AuthenticatedHeader context="enrollment" />
      ) : (
        <Header />
      )}

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <PageFooter />
    </div>
  );
};

export default EnrollmentLayout;
