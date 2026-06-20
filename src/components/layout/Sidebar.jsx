import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getNavItems, ROLE_LABELS } from '@/lib/rbac';
import { LayoutDashboard, Calendar, FileText, Users, Building2, DollarSign, Shield, LogOut, Activity, Menu, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

const ICON_MAP = {
  LayoutDashboard, Calendar, FileText, Users, Building2, DollarSign, Shield,
};

export default function Sidebar({ telemedUser, collapsed, onToggle }) {
  const location = useLocation();
  const role = telemedUser?.role || 'PACIENTE';
  const navItems = getNavItems(role);

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onToggle} />
      )}
      
      <aside className={`fixed top-0 left-0 h-full z-50 bg-card border-r border-border flex flex-col transition-transform duration-300 w-64
        ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0'}`}>
        
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-lg text-foreground">MedConnect</span>
            </div>
          )}
          {collapsed && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
          )}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggle}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => { if (window.innerWidth < 1024) onToggle(); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-border">
          {!collapsed && (
            <div className="mb-3">
              <p className="text-sm font-semibold text-foreground truncate">{telemedUser?.nome || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={() => base44.auth.logout('/')}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}