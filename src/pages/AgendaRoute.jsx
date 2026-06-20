import React from 'react';
import { useOutletContext } from 'react-router-dom';
import AgendaCalendario from './AgendaCalendario';

export default function AgendaRoute() {
  const { telemedUser } = useOutletContext();
  return <AgendaCalendario telemedUser={telemedUser} />;
}