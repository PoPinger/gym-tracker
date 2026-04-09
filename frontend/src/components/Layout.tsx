import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';
import {
  LayoutDashboard, PlusCircle, ClipboardList, Scale,
  LogOut, Menu, X, Dumbbell
} from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const NAV = [
    { path: '/',            label: t('nav_panel'),       icon: LayoutDashboard },
    { path: '/create-plan', label: t('nav_create_plan'), icon: PlusCircle },
    { path: '/plans',       label: t('nav_my_plans'),    icon: ClipboardList },
    { path: '/weight',      label: t('nav_my_weight'),   icon: Scale },
  ];

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
        {/* Language selector */}
        <div style={{
          display: 'flex', gap: 6, padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
        }}>
          <button
            onClick={() => setLang('pl')}
            style={{
              flex: 1, padding: '5px 8px', fontSize: 12, fontWeight: 600,
              borderRadius: 8, cursor: 'pointer', border: '1.5px solid',
              borderColor: lang === 'pl' ? 'var(--primary)' : 'var(--border)',
              background: lang === 'pl' ? 'var(--primary-light)' : 'transparent',
              color: lang === 'pl' ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
          >
            🇵🇱 PL
          </button>
          <button
            onClick={() => setLang('en')}
            style={{
              flex: 1, padding: '5px 8px', fontSize: 12, fontWeight: 600,
              borderRadius: 8, cursor: 'pointer', border: '1.5px solid',
              borderColor: lang === 'en' ? 'var(--primary)' : 'var(--border)',
              background: lang === 'en' ? 'var(--primary-light)' : 'transparent',
              color: lang === 'en' ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
          >
            🇬🇧 EN
          </button>
        </div>

        <div className="user-row">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.display_name || t('nav_user_fallback')}</div>
            <div className="user-email">{user?.email}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title={t('nav_logout')}>
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
