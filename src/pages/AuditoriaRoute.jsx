import React from 'react';
import { useOutletContext } from 'react-router-dom';
import AuditoriaPage from './AuditoriaPage';

export default function AuditoriaRoute() {
  const { telemedUser } = useOutletContext();
  return <AuditoriaPage telemedUser={telemedUser} />;
}