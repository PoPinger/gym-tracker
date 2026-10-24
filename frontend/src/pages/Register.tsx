import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import AuthKulka from '../components/mascot/AuthKulka';
import CelebrationLayer from '../components/CelebrationLayer';
import { HOLE_MS, useCelebration } from '../hooks/useCelebration';

export default function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [error, setError]             = useState('');
  const { register, loading }         = useAuth();
  const { t }                         = useLanguage();
  const navigate                      = useNavigate();
  const celebration                   = useCelebration();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const r = await register(email, password, displayName || undefined);
    // Account created: Kulka jumps into a hole on the sheet, then the app opens (at once with reduced motion)
    if (r.success) celebration.run(HOLE_MS, () => navigate('/'));
    else setError(r.error || t('register_error_default'));
  };

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <div className="auth-logo"><img src="/icons/logo.png" alt="GymTracker" /></div>
        <p className="auth-tagline">{t('register_tagline')}</p>
      </div>
      <div className="auth-sheet">
        <AuthKulka mode="wave" exiting={celebration.active} />
        <span className="auth-grab" aria-hidden="true" />
        <h1 className="auth-heading">{t('register_heading')}</h1>

        {error && <div className="alert alert-error"><span>{error}</span></div>}

        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label className="form-label">
              {t('register_name_label')}{' '}
              <span style={{ fontWeight:400, color:'var(--text-muted)' }}>{t('register_optional')}</span>
            </label>
            <div style={{ position:'relative' }}>
              <User size={16} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text-subtle)', pointerEvents:'none' }} />
              <input
                type="text" className="form-input"
                style={{ paddingLeft:38 }}
                placeholder={t('register_name_placeholder')}
                value={displayName} onChange={e => setDisplayName(e.target.value)}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('login_email_label')}</label>
            <div style={{ position:'relative' }}>
              <Mail size={16} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text-subtle)', pointerEvents:'none' }} />
              <input
                type="email" className="form-input"
                style={{ paddingLeft:38 }}
                placeholder={t('register_email_placeholder')}
                value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('login_password_label')}</label>
            <div style={{ position:'relative' }}>
              <Lock size={16} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text-subtle)', pointerEvents:'none' }} />
              <input
                type="password" className="form-input"
                style={{ paddingLeft:38 }}
                placeholder={t('register_password_placeholder')}
                value={password} onChange={e => setPassword(e.target.value)}
                required minLength={8} autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop:4 }}>
            {loading ? t('register_loading') : <><span>{t('register_submit')}</span><ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="auth-switch">
          {t('register_has_account')}{' '}
          <Link to="/login" className="auth-link">{t('register_login')}</Link>
        </div>
      </div>
      {celebration.active && <CelebrationLayer onSkip={celebration.skip} />}
    </div>
  );
}
