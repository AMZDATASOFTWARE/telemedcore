import React from 'react';
import { useOutletContext } from 'react-router-dom';
import SuperAdminDashboard from './SuperAdminDashboard';

export default function SuperAdminRoute() {
  const { telemedUser } = useOutletContext();
  return <SuperAdminDashboard telemedUser={telemedUser} />;
}