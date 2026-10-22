import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';
import { LogOut, Menu, X, ShieldCheck, KeyRound } from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';
import { MascotContext, mascotOf } from './mascot/MascotContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [pwdOpen, setPwdOpen] = useState(false);
  const { user, logout, saveSession, refreshUser } = useAuth();
  const { lang, setLang, t } = useLanguage();

  // Stored user may predate is_admin (or the role may have changed): refresh once
  useEffect(() => { refreshUser(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const NAV = [
    { path: '/',            label: t('nav_panel'),       icon: '/icons/panel.png' },
    { path: '/create-plan', label: t('nav_create_plan'), icon: '/icons/create-plan.png' },
    { path: '/plans',       label: t('nav_my_plans'),    icon: '/icons/my-plans.png' },
    { path: '/weight',      label: t('nav_my_weight'),   icon: '/icons/my-weight.png' },
  ];

  const go = (path: string) => { navigate(path); setOpen(false); };
  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = (user?.display_name || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const sidebarContent = (
    <>
      <div className="sidebar-logo">
        <img className="logo-img" src="/icons/logo.png" alt="GymTracker" />
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ path, label, icon }) => (
          <button
            key={path}
            className={`nav-link${location.pathname === path ? ' active' : ''}`}
            onClick={() => go(path)}
          >
            <img className="nav-icon" src={icon} alt="" />
            {label}
          </button>
        ))}
        {user?.is_admin && (
          <button
            className={`nav-link${location.pathname === '/admin' ? ' active' : ''}`}
            onClick={() => go('/admin')}
          >
            <ShieldCheck className="nav-icon" size={22} strokeWidth={2} color="var(--primary)" />
            {t('nav_admin')}
          </button>
        )}
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
          <div className="user-actions">
            <button className="logout-btn pwd-btn" onClick={() => { setPwdOpen(true); setOpen(false); }}
              title={t('nav_change_password')} aria-label={t('nav_change_password')}>
              <KeyRound size={16} />
            </button>
            <button className="logout-btn" onClick={handleLogout} title={t('nav_logout')} aria-label={t('nav_logout')}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <MascotContext.Provider value={mascotOf(user)}>
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

      {pwdOpen && <ChangePasswordModal onClose={() => setPwdOpen(false)} onChanged={saveSession} />}
    </div>
    </MascotContext.Provider>
  );
}
