import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusStyles = (status: string) => {
    const normalizedStatus = status.toLowerCase();

    switch (normalizedStatus) {
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'started':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'submitted':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'in progress':
      case 'in_progress':
      case 'underwriting':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'issued':
        return 'bg-green-100 text-green-800 border-green-400';
      case 'declined':
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(
        status
      )}`}
    >
      {formatStatus(status)}
    </span>
  );
};

export default StatusBadge;
