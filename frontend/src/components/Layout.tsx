import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, PlusCircle, ClipboardList, Scale,
  LogOut, Menu, X, Dumbbell
} from 'lucide-react';

const NAV = [
  { path: '/',            label: 'Panel',          icon: LayoutDashboard },
  { path: '/create-plan', label: 'Utwórz plan',    icon: PlusCircle },
  { path: '/plans',       label: 'Moje plany',     icon: ClipboardList },
  { path: '/weight',      label: 'Moja waga',      icon: Scale },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const go = (path: string) => { navigate(path); setOpen(false); };
  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = (user?.display_name || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const sidebarContent = (
    <>
      <div className="sidebar-logo">
        <div className="logo-mark">
          <Dumbbell size={18} color="white" strokeWidth={2.5} />
        </div>
        <span className="logo-text">Gym<span>Tracker</span></span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            className={`nav-link${location.pathname === path ? ' active' : ''}`}
            onClick={() => go(path)}
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-row">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.display_name || 'Użytkownik'}</div>
            <div className="user-email">{user?.email}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Wyloguj">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="app-layout">
      {/* Mobile topbar */}
      <header className="topbar">
        <button className="hamburger" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span className="topbar-logo">Gym<span>Tracker</span></span>
      </header>

      {/* Overlay */}
      <div
        className={`sidebar-overlay${open ? ' open' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        {sidebarContent}
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
