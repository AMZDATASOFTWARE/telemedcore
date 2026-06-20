import React, { useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import DashboardSupervisor from './DashboardSupervisor';
import { ROLES } from '@/lib/rbac';

export default function DashboardRoute() {
  const { telemedUser } = useOutletContext();
  const navigate = useNavigate();
  const role = telemedUser?.role;

  useEffect(() => {
    if (role === ROLES.PACIENTE) {
      navigate('/portal-paciente', { replace: true });
    }
  }, [role, navigate]);

  if (role === ROLES.PACIENTE) return null;
  if (role === ROLES.SUPERVISOR_EMPRESA) return <DashboardSupervisor telemedUser={telemedUser} />;
  return <Dashboard telemedUser={telemedUser} />;
}