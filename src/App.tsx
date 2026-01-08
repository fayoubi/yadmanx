import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import QuoteForm from './components/QuoteForm';
import QuoteDisplay from './components/QuoteDisplay';
import ContactPage from './components/ContactPage';
import InsuranceForm from './components/InsuranceForm';
import EnhancedContributionForm from './components/EnhancedContributionForm';
import BeneficiariesPage from './components/BeneficiariesPage';
import EnrollmentConfirmation from './components/EnrollmentConfirmation';
import EnrollmentSuccess from './components/EnrollmentSuccess';
import EnrollmentError from './components/EnrollmentError';
import AboutPage from './components/AboutPage';
import { QuoteProvider } from './context/QuoteContext';
import { AgentAuthProvider } from './context/AgentAuthContext';
import LoginForm from './components/agent/auth/LoginForm';
import RegisterForm from './components/agent/auth/RegisterForm';
import Dashboard from './components/agent/dashboard/Dashboard';
import ProtectedRoute from './components/common/ProtectedRoute';
import EnrollmentLayout from './components/common/EnrollmentLayout';
import AiQuotePage from './components/ai-quote/AiQuotePage';

function App() {
  return (
    <AgentAuthProvider>
      <QuoteProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Agent Routes */}
              <Route path="/agent/login" element={<LoginForm />} />
              <Route path="/agent/register" element={<RegisterForm />} />
              <Route
                path="/agent/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Public Routes - Now with standardized headers/footers */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/" element={<QuoteForm />} />
              <Route path="/quote" element={<QuoteDisplay />} />

              {/* AI Quote Route */}
              <Route path="/ai-quote" element={<AiQuotePage />} />

              {/* Enrollment Routes */}
              <Route path="/enroll/*" element={
                <EnrollmentLayout>
                  <Routes>
                    <Route path="/start" element={<InsuranceForm />} />
                    <Route path="/contribution" element={<EnhancedContributionForm />} />
                    <Route path="/beneficiaries" element={<BeneficiariesPage />} />
                    <Route path="/confirmation" element={<EnrollmentConfirmation />} />
                    <Route path="/success" element={<EnrollmentSuccess />} />
                    <Route path="/error" element={<EnrollmentError />} />
                  </Routes>
                </EnrollmentLayout>
              } />
            </Routes>
          </div>
        </Router>
      </QuoteProvider>
    </AgentAuthProvider>
  );
}

export default App;
