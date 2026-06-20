import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Usuarios from './Usuarios';

export default function UsuariosRoute() {
  const { telemedUser } = useOutletContext();
  return <Usuarios telemedUser={telemedUser} />;
}