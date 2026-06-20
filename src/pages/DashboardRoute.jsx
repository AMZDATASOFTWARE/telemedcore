import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Dashboard from './Dashboard';

export default function DashboardRoute() {
  const { telemedUser } = useOutletContext();
  return <Dashboard telemedUser={telemedUser} />;
}