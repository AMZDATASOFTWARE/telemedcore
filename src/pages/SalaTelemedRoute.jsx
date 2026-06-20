import React from 'react';
import { useOutletContext } from 'react-router-dom';
import SalaTelemed from './SalaTelemed';

export default function SalaTelemedRoute() {
  const { telemedUser } = useOutletContext();
  return <SalaTelemed telemedUser={telemedUser} />;
}