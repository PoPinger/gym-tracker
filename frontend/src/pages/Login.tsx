import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import AuthKulka from '../components/mascot/AuthKulka';
import CelebrationLayer from '../components/CelebrationLayer';
import { HOLE_MS, useCelebration } from '../hooks/useCelebration';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const { login, loading }      = useAuth();
  const { t }                   = useLanguage();
  const navigate                = useNavigate();
  const celebration             = useCelebration();
  // Set by ForgotPassword after a successful reset
  const passwordChanged         = (useLocation().state as { passwordChanged?: boolean } | null)?.passwordChanged;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const r = await login(email, password);
    // Signed in: Kulka jumps into a hole on the sheet, then the app opens (at once with reduced motion)
    if (r.success) celebration.run(HOLE_MS, () => navigate('/'));
    else setError(r.error || t('login_error_default'));
  };

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <div className="auth-logo"><img src="/icons/logo.png" alt="GymTracker" /></div>
        <p className="auth-tagline">{t('login_tagline')}</p>
      </div>
      <div className="auth-sheet">
        <AuthKulka mode="wave" exiting={celebration.active} />
        <span className="auth-grab" aria-hidden="true" />
        <h1 className="auth-heading">{t('login_heading')}</h1>
        <p className="auth-sub">{t('login_sub')}</p>

        {passwordChanged && !error && (
          <div className="alert alert-success">
            <span>{t('login_password_changed')}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label className="form-label">{t('login_email_label')}</label>
            <div style={{ position:'relative' }}>
              <Mail size={16} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text-subtle)', pointerEvents:'none' }} />
              <input
                type="email" className="form-input"
                style={{ paddingLeft:38 }}
                placeholder={t('login_email_placeholder')}
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
                placeholder={t('login_password_placeholder')}
                value={password} onChange={e => setPassword(e.target.value)}
                required autoComplete="current-password"
              />
            </div>
            <Link to="/forgot-password" className="auth-link auth-forgot">{t('login_forgot_password')}</Link>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop:4 }}>
            {loading ? t('login_loading') : <><span>{t('login_submit')}</span><ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="auth-switch">
          {t('login_no_account')}{' '}
          <Link to="/register" className="auth-link">{t('login_create_account')}</Link>
        </div>
      </div>
      {celebration.active && <CelebrationLayer onSkip={celebration.skip} />}
    </div>
  );
}
