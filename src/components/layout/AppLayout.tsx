import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Cross } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import './AppLayout.css';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-layout__main">
        <header className="app-layout__header">
          <span className="app-layout__brand"><Cross size={18} /> Grão da Vida</span>
        </header>
        <div className="app-layout__content">
          <Outlet />
        </div>
      </div>
      <BottomNav onMore={() => setSidebarOpen(true)} />
    </div>
  );
}
