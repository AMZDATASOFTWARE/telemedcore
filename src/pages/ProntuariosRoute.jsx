import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Prontuarios from './Prontuarios';

export default function ProntuariosRoute() {
  const { telemedUser } = useOutletContext();
  return <Prontuarios telemedUser={telemedUser} />;
}