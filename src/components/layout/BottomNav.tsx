import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Wallet, MoreHorizontal } from 'lucide-react';
import { HorseIcon } from '../icons/HorseIcon';
import './BottomNav.css';

const ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Início', end: true },
  { path: '/clientes', icon: Users, label: 'Clientes' },
  { path: '/animais', icon: HorseIcon, label: 'Animais' },
  { path: '/financeiro', icon: Wallet, label: 'Financeiro' },
];

export function BottomNav({ onMore }: { onMore: () => void }) {
  const { pathname } = useLocation();
  // "Mais" fica ativo quando a rota atual nao e um dos itens principais
  const isMoreActive = !(
    pathname === '/' || ITEMS.slice(1).some((i) => pathname.startsWith(i.path))
  );

  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
          >
            <span className="bottom-nav__icon-wrap">
              <Icon size={21} strokeWidth={2} />
            </span>
            <span className="bottom-nav__label">{item.label}</span>
          </NavLink>
        );
      })}

      <button
        type="button"
        className={`bottom-nav__item ${isMoreActive ? 'bottom-nav__item--active' : ''}`}
        onClick={onMore}
      >
        <span className="bottom-nav__icon-wrap">
          <MoreHorizontal size={21} strokeWidth={2} />
        </span>
        <span className="bottom-nav__label">Mais</span>
      </button>
    </nav>
  );
}
