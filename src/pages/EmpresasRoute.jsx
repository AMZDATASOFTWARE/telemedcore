import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Empresas from './Empresas';

export default function EmpresasRoute() {
  const { telemedUser } = useOutletContext();
  return <Empresas telemedUser={telemedUser} />;
}