// Role-Based Access Control configuration for Telemedicine SaaS

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SUPERVISOR_EMPRESA: 'SUPERVISOR_EMPRESA',
  MEDICO_VINCULADO: 'MEDICO_VINCULADO',
  MEDICO_AVULSO: 'MEDICO_AVULSO',
  PACIENTE: 'PACIENTE',
};

export const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  SUPERVISOR_EMPRESA: 'Supervisor',
  MEDICO_VINCULADO: 'Médico Vinculado',
  MEDICO_AVULSO: 'Médico Avulso',
  PACIENTE: 'Paciente',
};

export const ESTADO_AGENDAMENTO = {
  0: 'Agendado',
  1: 'Confirmado',
  2: 'Aguardando',
  3: 'Em Atendimento',
  4: 'Finalizado',
  5: 'Cancelado',
};

export const ESTADO_COLORS = {
  0: 'bg-blue-100 text-blue-800',
  1: 'bg-emerald-100 text-emerald-800',
  2: 'bg-amber-100 text-amber-800',
  3: 'bg-purple-100 text-purple-800',
  4: 'bg-muted text-muted-foreground',
  5: 'bg-red-100 text-red-800',
};

// Permission matrix: what each role can access
const PERMISSIONS = {
  SUPER_ADMIN: {
    empresa: ['read', 'create', 'update', 'delete'],
    usuario: ['read', 'create', 'update', 'delete'],
    agendamento: ['read'],
    evolucao: [],          // LGPD: No access to clinical records
    documento: [],          // LGPD: No access to clinical documents
    auditoria: ['read'],
    financeiro: ['read'],
    metricas_globais: ['read'],
  },
  SUPERVISOR_EMPRESA: {
    empresa: ['read'],
    usuario: ['read', 'create', 'update'],
    agendamento: ['read', 'create', 'update'],
    evolucao: [],          // No access to clinical records
    documento: [],
    auditoria: ['read'],   // Own company only
    financeiro: ['read'],
  },
  MEDICO_VINCULADO: {
    empresa: [],
    usuario: ['read'],
    agendamento: ['read', 'create', 'update'],
    evolucao: ['read', 'create', 'update'],
    documento: ['read', 'create'],
    auditoria: [],
    financeiro: ['read'],  // Own finances only
  },
  MEDICO_AVULSO: {
    empresa: [],
    usuario: ['read'],
    agendamento: ['read', 'create', 'update'],
    evolucao: ['read', 'create', 'update'],
    documento: ['read', 'create'],
    auditoria: [],
    financeiro: ['read'],
  },
  PACIENTE: {
    empresa: [],
    usuario: ['read'],
    agendamento: ['read', 'create'],
    evolucao: ['read'],    // Own records only
    documento: ['read'],   // Own documents only
    auditoria: [],
    financeiro: [],
  },
};

export function hasPermission(role, resource, action) {
  const rolePerms = PERMISSIONS[role];
  if (!rolePerms) return false;
  const resourcePerms = rolePerms[resource];
  if (!resourcePerms) return false;
  return resourcePerms.includes(action);
}

export function isMedico(role) {
  return role === ROLES.MEDICO_VINCULADO || role === ROLES.MEDICO_AVULSO;
}

export function isAdmin(role) {
  return role === ROLES.SUPER_ADMIN || role === ROLES.SUPERVISOR_EMPRESA;
}

// Navigation items per role
export function getNavItems(role) {
  const items = [];
  
  items.push({ label: 'Dashboard', path: '/', icon: 'LayoutDashboard' });

  if (hasPermission(role, 'agendamento', 'read')) {
    items.push({ label: 'Agenda', path: '/agenda', icon: 'Calendar' });
  }

  if (hasPermission(role, 'evolucao', 'read')) {
    items.push({ label: 'Prontuários', path: '/prontuarios', icon: 'FileText' });
  }

  if (role === ROLES.PACIENTE) {
    items.push({ label: 'Minhas Consultas', path: '/agenda', icon: 'Calendar' });
  }

  if (hasPermission(role, 'usuario', 'read') && isAdmin(role)) {
    items.push({ label: 'Usuários', path: '/usuarios', icon: 'Users' });
  }

  if (hasPermission(role, 'empresa', 'read') && role === ROLES.SUPER_ADMIN) {
    items.push({ label: 'Empresas', path: '/empresas', icon: 'Building2' });
  }

  if (hasPermission(role, 'financeiro', 'read')) {
    items.push({ label: 'Financeiro', path: '/financeiro', icon: 'DollarSign' });
  }

  if (hasPermission(role, 'auditoria', 'read')) {
    items.push({ label: 'Auditoria', path: '/auditoria', icon: 'Shield' });
  }

  return items;
}