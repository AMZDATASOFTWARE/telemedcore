import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Dashboard from './Dashboard';
import DashboardSupervisor from './DashboardSupervisor';
import { ROLES } from '@/lib/rbac';

export default function DashboardRoute() {
  const { telemedUser } = useOutletContext();
  const role = telemedUser?.role;
  if (role === ROLES.SUPERVISOR_EMPRESA) return <DashboardSupervisor telemedUser={telemedUser} />;
  return <Dashboard telemedUser={telemedUser} />;
}