import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentAuth } from '../../../context/AgentAuthContext';
import AuthenticatedHeader from '../../common/AuthenticatedHeader';
import EnrollmentTable from './EnrollmentTable';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { agent } = useAgentAuth();

  const handleStartNewApplication = () => {
    // Simply navigate to enrollment start page
    // Enrollment will be created when user submits personal info
    sessionStorage.removeItem('current_enrollment_id'); // Clear any existing ID
    navigate('/enroll/start');
  };

  if (!agent) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Authenticated Header */}
      <AuthenticatedHeader context="dashboard" />

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
