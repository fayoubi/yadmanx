import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentAuth } from '../../../context/AgentAuthContext';
import StatusBadge from './StatusBadge';
import EmptyState from './EmptyState';

interface Enrollment {
  id: string;
  customer: {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string;
    cin: string;
    cinMasked: string;
    city: string;
  };
  status: string | null;
  createdAt: string;
  updatedAt: string;
}

const EnrollmentTable: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAgentAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ENROLLMENT_SERVICE_URL = 'http://localhost:3002/api/v1';

  useEffect(() => {
    fetchEnrollments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchEnrollments = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${ENROLLMENT_SERVICE_URL}/enrollments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }

        // If 404 or other errors, treat as empty list
        if (response.status === 404) {
          setEnrollments([]);
          setError(null);
          return;
        }

        throw new Error('Unable to connect to enrollment service');
      }

      const data = await response.json();
      setEnrollments(data.enrollments || []);
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
      // Create new enrollment via enrollment-service
      const response = await fetch(`${ENROLLMENT_SERVICE_URL}/enrollments`, {
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
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              First Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Last Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Email
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Phone
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              CIN
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              City
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
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {enrollments.map((enrollment) => (
            <tr key={enrollment.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {enrollment.customer.firstName || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {enrollment.customer.lastName || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {enrollment.customer.email || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {enrollment.customer.phone || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className="text-gray-400 cursor-default">
                  {enrollment.customer.cinMasked || '****'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {enrollment.customer.city || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={enrollment.status || ''} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  onClick={() => handleViewEnrollment(enrollment.id)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  View
                </button>
                {enrollment.status?.toLowerCase() === 'draft' && (
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
