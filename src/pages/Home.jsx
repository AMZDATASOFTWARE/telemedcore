import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import AppLayout from '@/components/layout/AppLayout';
import Onboarding from './Onboarding';

export default function Home() {
  const [telemedUser, setTelemedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      const users = await base44.entities.UsuarioTelemed.filter({ user_id: me.id });
      if (users.length > 0) {
        setTelemedUser(users[0]);
        setNeedsOnboarding(false);
      } else {
        setNeedsOnboarding(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (needsOnboarding) {
    return <Onboarding onComplete={loadUser} />;
  }

  return <AppLayout telemedUser={telemedUser} />;
}