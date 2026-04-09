import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';
import { Dumbbell, Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [error, setError]             = useState('');
  const { register, loading }         = useAuth();
  const { t }                         = useLanguage();
  const navigate                      = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const r = await register(email, password, displayName || undefined);
    if (r.success) navigate('/');
    else setError(r.error || t('register_error_default'));
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:8 }}>
            <div style={{ width:44, height:44, background:'linear-gradient(135deg,#4f46e5,#818cf8)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Dumbbell size={22} color="white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="auth-brand">Gym<span>Tracker</span></div>
          <div className="auth-tagline">{t('register_tagline')}</div>
        </div>

        <h1 className="auth-heading">{t('register_heading')}</h1>
        <p className="auth-sub">{t('register_sub')}</p>

        {error && <div className="alert alert-error"><span>{error}</span></div>}

        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
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
                required minLength={6} autoComplete="new-password"
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
    </div>
  );
}
