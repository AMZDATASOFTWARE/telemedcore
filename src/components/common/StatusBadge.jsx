import React from 'react';
import { ESTADO_AGENDAMENTO, ESTADO_COLORS } from '@/lib/rbac';

export default function StatusBadge({ estado }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[estado] || 'bg-muted text-muted-foreground'}`}>
      {ESTADO_AGENDAMENTO[estado] || 'Desconhecido'}
    </span>
  );
}