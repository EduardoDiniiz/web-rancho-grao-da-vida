import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import './AppLayout.css';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-layout__main">
        <header className="app-layout__header">
          <button className="app-layout__menu-btn" onClick={() => setSidebarOpen(true)}>
            <span />
            <span />
            <span />
          </button>
          <span className="app-layout__brand">🐎 Rancho</span>
        </header>
        <div className="app-layout__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
