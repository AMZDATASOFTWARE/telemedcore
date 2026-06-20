import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Home from '@/pages/Home';
import DashboardRoute from '@/pages/DashboardRoute';
import AgendaRoute from '@/pages/AgendaRoute';
import ProntuariosRoute from '@/pages/ProntuariosRoute';
import UsuariosRoute from '@/pages/UsuariosRoute';
import EmpresasRoute from '@/pages/EmpresasRoute';
import FinanceiroRoute from '@/pages/FinanceiroRoute';
import AuditoriaRoute from '@/pages/AuditoriaRoute';
import LandingPage from '@/pages/LandingPage';
import PricingPage from '@/pages/PricingPage';
import OnboardingPosAssinatura from '@/pages/OnboardingPosAssinatura';
import SuperAdminRoute from '@/pages/SuperAdminRoute';
import SalaTelemed from '@/pages/SalaTelemed';
import PortalPaciente from '@/pages/PortalPaciente';

// Wrapper to pass telemedUser to SalaTelemed without the Home layout
function SalaTelemedRouteWrapper() {
  const [telemedUser, setTelemedUser] = useState(null);
  useEffect(() => {
    async function load() {
      try {
        const user = await base44.auth.me();
        const results = await base44.entities.UsuarioTelemed.filter({ user_id: user.id });
        if (results.length > 0) setTelemedUser(results[0]);
      } catch (e) { console.error(e); }
    }
    load();
  }, []);
  if (!telemedUser) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  return <SalaTelemed telemedUser={telemedUser} />;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/onboarding-assinatura" element={<OnboardingPosAssinatura />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        {/* Full-screen routes (no sidebar) */}
        <Route path="/sala-telemed/:id" element={<SalaTelemedRouteWrapper />} />
        <Route path="/portal-paciente" element={<PortalPaciente />} />
        <Route element={<Home />}>
          <Route path="/" element={<DashboardRoute />} />
          <Route path="/agenda" element={<AgendaRoute />} />
          <Route path="/prontuarios" element={<ProntuariosRoute />} />
          <Route path="/usuarios" element={<UsuariosRoute />} />
          <Route path="/empresas" element={<EmpresasRoute />} />
          <Route path="/financeiro" element={<FinanceiroRoute />} />
          <Route path="/auditoria" element={<AuditoriaRoute />} />
          <Route path="/super-admin" element={<SuperAdminRoute />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App