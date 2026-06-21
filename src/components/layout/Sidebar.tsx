import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/', icon: '📊', label: 'Dashboard', end: true },
  { path: '/clientes', icon: '👤', label: 'Clientes' },
  { path: '/animais', icon: '🐴', label: 'Animais' },
  { path: '/baias', icon: '🏠', label: 'Baias' },
  { path: '/hospedagens', icon: '📋', label: 'Hospedagens' },
  { path: '/servicos', icon: '🧾', label: 'Serviços' },
  { path: '/financeiro', icon: '💰', label: 'Financeiro' },
  { path: '/vacinas', icon: '💉', label: 'Vacinas' },
];

const ADMIN_ITEMS = [
  { path: '/usuarios', icon: '⚙️', label: 'Usuários' },
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
          <div className="sidebar__logo">🐎</div>
          <div>
            <span className="sidebar__title">Rancho</span>
            <span className="sidebar__subtitle">Gestão de Baias</span>
          </div>
        </div>

        <nav className="sidebar__nav">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={(item as { end?: boolean }).end}
              className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar__icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
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
            <span className="sidebar__icon">🚪</span>
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
