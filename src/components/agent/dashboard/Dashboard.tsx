import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAgentAuth } from '../../../context/AgentAuthContext';
import { Shield } from 'lucide-react';
import EnrollmentTable from './EnrollmentTable';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { agent, logout } = useAgentAuth();

  const handleStartNewApplication = () => {
    // Simply navigate to enrollment start page
    // Enrollment will be created when user submits personal info
    sessionStorage.removeItem('current_enrollment_id'); // Clear any existing ID
    navigate('/enroll/start');
  };

  const handleLogout = () => {
    logout();
    navigate('/agent/login');
  };

  if (!agent) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Blue with navigation matching mockup */}
      <header className="bg-primary-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-white" />
                <span className="text-xl font-bold text-white">YadmanX</span>
              </Link>
              <nav className="flex items-center space-x-6">
                <Link
                  to="/agent/dashboard"
                  className="text-white font-medium hover:text-white/90 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/about"
                  className="text-white hover:text-white/90 transition-colors"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className="text-white hover:text-white/90 transition-colors"
                >
                  Contact
                </Link>
              </nav>
            </div>

            {/* Right side - Agent Info and Logout */}
            <div className="flex items-center space-x-4">
              <div className="text-white text-sm font-medium">
                {agent.firstName} {agent.lastName} | Lic# {agent.licenseNumber}
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white border-2 border-white rounded-md hover:bg-white hover:text-primary-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Start New Application Button */}
        <div className="mb-8">
          <button
            onClick={handleStartNewApplication}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="-ml-1 mr-3 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Start New Application
          </button>
        </div>

        {/* Enrollments Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">My Applications</h2>
          </div>
          <EnrollmentTable />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
