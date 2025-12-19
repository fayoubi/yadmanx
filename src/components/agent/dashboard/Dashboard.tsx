import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentAuth } from '../../../context/AgentAuthContext';
import EnrollmentTable from './EnrollmentTable';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { agent, logout, token } = useAgentAuth();

  const handleStartNewApplication = async () => {
    if (!token || !agent) return;

    try {
      // Create new enrollment via agent-service
      const response = await fetch('http://localhost:3003/api/v1/agents/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create enrollment');
      }

      const data = await response.json();
      const enrollmentId = data.enrollment?.id || data.data?.id || data.id;

      // Store enrollment ID and navigate to enrollment flow
      sessionStorage.setItem('current_enrollment_id', enrollmentId);
      navigate('/enroll/start');
    } catch (err: any) {
      console.error('Error creating enrollment:', err);
      alert(`Failed to start new application: ${err.message}`);
    }
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
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {agent.firstName} {agent.lastName}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {agent.agencyName} • License: {agent.licenseNumber}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Logout
            </button>
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
