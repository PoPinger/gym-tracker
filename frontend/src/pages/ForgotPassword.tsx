import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../i18n/LanguageContext';
import { authApi } from '../services/api';
import PasswordInput from '../components/PasswordInput';
import { Dumbbell, Mail, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';
import AuthKulka from '../components/mascot/AuthKulka';

const MIN_PASSWORD = 8;

const status = (err: unknown) => (axios.isAxiosError(err) ? err.response?.status : undefined);

// Two steps: (1) e-mail + admin-issued code -> reset token, (2) new password
export default function ForgotPassword() {
  const [email, setEmail]         = useState('');
  const [code, setCode]           = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [password, setPassword]   = useState('');
  const [repeat, setRepeat]       = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const { t }                     = useLanguage();
  const navigate                  = useNavigate();

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.resetVerify(email, code);
      setResetToken(res.data.reset_token);
    } catch (err) {
      setError(t(status(err) === 429 ? 'reset_error_limit' : 'reset_error_invalid'));
    } finally {
      setLoading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < MIN_PASSWORD) return setError(t('pwd_error_min'));
    if (password !== repeat) return setError(t('pwd_error_mismatch'));
    setLoading(true);
    try {
      await authApi.resetComplete(resetToken!, password);
      navigate('/login', { replace: true, state: { passwordChanged: true } });
    } catch (err) {
      if (status(err) === 400) {
        // Reset token expired or code already used: back to step 1
        setResetToken(null);
        setCode('');
        setPassword('');
        setRepeat('');
        setError(t('reset_error_session'));
      } else {
        setError(t('pwd_error_generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap has-mascot">
      <div className="auth-card has-mascot">
        <AuthKulka mode="confused" />
        <div className="auth-logo">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:8 }}>
            <div style={{ width:44, height:44, background:'linear-gradient(135deg,#4f46e5,#818cf8)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Dumbbell size={22} color="white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="auth-brand">Gym<span>Tracker</span></div>
        </div>

        {resetToken === null ? (
          <>
            <h1 className="auth-heading">{t('reset_title')}</h1>
            <div className="alert alert-info" style={{ marginTop:12 }}>
              <span>{t('reset_info')}</span>
            </div>

            {error && <div className="alert alert-error"><span>{error}</span></div>}

            <form onSubmit={verify} style={{ display:'flex', flexDirection:'column', gap:16 }}>
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
                <label className="form-label">{t('reset_code_label')}</label>
                <div style={{ position:'relative' }}>
                  <KeyRound size={16} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text-subtle)', pointerEvents:'none' }} />
                  <input
                    type="text" className="form-input"
                    style={{ paddingLeft:38, textTransform:'uppercase', letterSpacing:'0.12em', fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                    placeholder="XXXX-XXXX"
                    value={code} onChange={e => setCode(e.target.value)}
                    required maxLength={9} autoComplete="one-time-code"
                    autoCapitalize="characters" autoCorrect="off" spellCheck={false}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop:4 }}>
                {loading ? t('reset_checking') : <><span>{t('reset_next')}</span><ArrowRight size={18} /></>}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="auth-heading">{t('reset_new_title')}</h1>
            <p className="auth-sub">{t('reset_new_sub')}</p>

            {error && <div className="alert alert-error"><span>{error}</span></div>}

            <form onSubmit={save} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <PasswordInput label={t('pwd_new_label')} value={password} onChange={setPassword}
                placeholder={t('pwd_min_hint')} autoComplete="new-password" minLength={MIN_PASSWORD} />
              <PasswordInput label={t('pwd_repeat_label')} value={repeat} onChange={setRepeat}
                autoComplete="new-password" minLength={MIN_PASSWORD} />

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop:4 }}>
                {loading ? t('pwd_saving') : t('pwd_save')}
              </button>
            </form>
          </>
        )}

        <div className="auth-switch">
          <Link to="/login" className="auth-link auth-back"><ArrowLeft size={14} />{t('reset_back_to_login')}</Link>
        </div>
      </div>
    </div>
  );
}
