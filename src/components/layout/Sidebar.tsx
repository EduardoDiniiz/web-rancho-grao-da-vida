import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Warehouse, ClipboardList,
  Wrench, Wallet, Syringe, UserCog, LogOut, Cross,
} from 'lucide-react';
import { HorseIcon } from '../icons/HorseIcon';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/clientes', icon: Users, label: 'Clientes' },
  { path: '/animais', icon: HorseIcon, label: 'Animais' },
  { path: '/baias', icon: Warehouse, label: 'Baias' },
  { path: '/hospedagens', icon: ClipboardList, label: 'Hospedagens' },
  { path: '/servicos', icon: Wrench, label: 'Serviços' },
  { path: '/financeiro', icon: Wallet, label: 'Financeiro' },
  { path: '/vacinas', icon: Syringe, label: 'Vacinas' },
];

const ADMIN_ITEMS = [
  { path: '/usuarios', icon: UserCog, label: 'Usuários' },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const role = localStorage.getItem('rancho_role');
  const name = localStorage.getItem('rancho_name') ?? 'Usuário';
  const items = role === 'ADMIN' ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;

  function handleLogout() {
    localStorage.removeItem('rancho_token');
    localStorage.removeItem('rancho_role');
    localStorage.removeItem('rancho_name');
    navigate('/login');
  }

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <div className="sidebar__logo"><Cross size={24} color="#fff" /></div>
          <div>
            <span className="sidebar__title">Grão da Vida</span>
            <span className="sidebar__subtitle">Gestão de Baias</span>
          </div>
        </div>

        <nav className="sidebar__nav">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={(item as { end?: boolean }).end}
                className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                onClick={onClose}
              >
                <Icon className="sidebar__icon" size={19} strokeWidth={2} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__user-avatar">{name[0]?.toUpperCase()}</div>
            <div className="sidebar__user-info">
              <strong>{name}</strong>
              <span>{role === 'ADMIN' ? 'Administrador' : 'Operador'}</span>
            </div>
          </div>
          <button className="sidebar__logout" onClick={handleLogout}>
            <LogOut className="sidebar__icon" size={18} strokeWidth={2} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
