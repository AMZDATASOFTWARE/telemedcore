import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Financeiro from './Financeiro';

export default function FinanceiroRoute() {
  const { telemedUser } = useOutletContext();
  return <Financeiro telemedUser={telemedUser} />;
}