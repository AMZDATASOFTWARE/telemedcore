import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState(null);
  const [telemedUser, setTelemedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        setCurrentUser(me);
        const users = await base44.entities.UsuarioTelemed.filter({ user_id: me.id });
        if (users.length > 0) {
          setTelemedUser(users[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { currentUser, telemedUser, loading };
}