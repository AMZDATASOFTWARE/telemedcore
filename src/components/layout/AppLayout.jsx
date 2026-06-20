import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppLayout({ telemedUser }) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar telemedUser={telemedUser} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      
      {/* Top bar mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center px-4 z-30">
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(false)}>
          <Menu className="w-5 h-5" />
        </Button>
        <span className="ml-3 font-heading font-bold text-foreground">MedConnect</span>
      </div>

      <main className={`transition-all duration-300 pt-14 lg:pt-0 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <Outlet context={{ telemedUser }} />
        </div>
      </main>
    </div>
  );
}