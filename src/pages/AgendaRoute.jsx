import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Agenda from './Agenda';

export default function AgendaRoute() {
  const { telemedUser } = useOutletContext();
  return <Agenda telemedUser={telemedUser} />;
}