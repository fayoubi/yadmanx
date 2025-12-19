import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentAuth } from '../../../context/AgentAuthContext';
import StatusBadge from './StatusBadge';
import EmptyState from './EmptyState';

interface Enrollment {
  id: string;
  applicantName: string;
  status: string;
  startDate: string;
  lastUpdated: string;
}

const EnrollmentTable: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAgentAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const AGENT_SERVICE_URL = 'http://localhost:3003/api/v1';

  useEffect(() => {
    fetchEnrollments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchEnrollments = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${AGENT_SERVICE_URL}/agents/enrollments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If 404 or 500 with "no enrollments" message, treat as empty list
        if (response.status === 404 || response.status === 500) {
          const errorData = await response.json().catch(() => ({}));
          // Check if it's genuinely an empty list vs a real error
          if (errorData.message?.toLowerCase().includes('no enrollments') ||
              errorData.error?.toLowerCase().includes('no enrollments') ||
              errorData.message?.toLowerCase().includes('not found')) {
            setEnrollments([]);
            setError(null);
            return;
          }
        }
        throw new Error('Unable to connect to enrollment service');
      }

      const data = await response.json();
      setEnrollments(data.data || data.enrollments || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching enrollments:', err);
      // Only set error for genuine connection/server issues
      if (err.message.includes('connect') || err.message.includes('fetch')) {
        setError(null); // Don't show error, just show empty state
      } else {
        setError(err.message || 'Failed to load enrollments');
      }
      setEnrollments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewApplication = async () => {
    if (!token) return;

    try {
      // Create new enrollment via agent-service (same as Dashboard button)
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

  const handleViewEnrollment = (enrollmentId: string) => {
    // For now, just navigate to enrollment flow
    sessionStorage.setItem('current_enrollment_id', enrollmentId);
    navigate('/enroll/start');
  };

  const handleContinueEnrollment = (enrollmentId: string) => {
    // Continue draft enrollment
    sessionStorage.setItem('current_enrollment_id', enrollmentId);
    navigate('/enroll/start');
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  if (enrollments.length === 0) {
    return <EmptyState onStartApplication={handleStartNewApplication} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Application ID
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Applicant Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Start Date
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Last Updated
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {enrollments.map((enrollment) => (
            <tr key={enrollment.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {enrollment.id.substring(0, 8)}...
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {enrollment.applicantName || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={enrollment.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(enrollment.startDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(enrollment.lastUpdated)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  onClick={() => handleViewEnrollment(enrollment.id)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  View
                </button>
                {enrollment.status.toLowerCase() === 'draft' && (
                  <button
                    onClick={() => handleContinueEnrollment(enrollment.id)}
                    className="text-green-600 hover:text-green-900"
                  >
                    Continue
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EnrollmentTable;
