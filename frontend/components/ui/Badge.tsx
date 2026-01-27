import React from 'react';
import { FormStatus } from '../../types';

interface BadgeProps {
  status: FormStatus;
}

const statusStyles: Record<FormStatus, string> = {
  'Borrador': 'bg-gray-100 text-gray-800',
  'Ingresado': 'bg-blue-100 text-cku-blue',
};

export const Badge: React.FC<BadgeProps> = ({ status }) => (
  <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusStyles[status]}`}>
    {status}
  </span>
);