import React from 'react';

export function StatusBadge({ status, className = '' }) {
  const statusConfig = {
    'Approved': {
      class: 'coep-badge-approved',
      label: 'Approved',
    },
    'Pending Faculty': {
      class: 'coep-badge-pending-faculty',
      label: 'Pending Faculty Advisor',
    },
    'Pending HOD': {
      class: 'coep-badge-pending-hod',
      label: 'Pending HOD Review',
    },
    'Pending Superadmin': {
      class: 'coep-badge-pending-superadmin',
      label: 'Pending Registrar / Admin',
    },
    'Rejected': {
      class: 'coep-badge-rejected',
      label: 'Rejected',
    },
    'Cancelled': {
      class: 'coep-badge-cancelled',
      label: 'Cancelled',
    },
    'Under Maintenance': {
      class: 'coep-badge-blocked',
      label: 'Under Maintenance',
    },
    'Blocked': {
      class: 'coep-badge-blocked',
      label: 'Blocked Date',
    },
    'Available': {
      class: 'coep-badge-approved',
      label: 'Available',
    },
  };

  const config = statusConfig[status] || {
    class: 'coep-badge-cancelled',
    label: status || 'Unknown',
  };

  return (
    <span className={`coep-badge ${config.class} ${className}`}>
      <span className="coep-badge-dot" />
      {config.label}
    </span>
  );
}

export default StatusBadge;
