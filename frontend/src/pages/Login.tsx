import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Dumbbell, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const { login, loading }      = useAuth();
  const navigate                = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const r = await login(email, password);
    if (r.success) navigate('/');
    else setError(r.error || 'Nieprawidłowy e-mail lub hasło');
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
          <div className="auth-tagline">Śledź postępy, osiągaj cele</div>
        </div>

        <h1 className="auth-heading">Witaj ponownie</h1>
        <p className="auth-sub">Zaloguj się, by kontynuować</p>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="form-group">
            <label className="form-label">Adres e-mail</label>
            <div style={{ position:'relative' }}>
              <Mail size={16} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text-subtle)', pointerEvents:'none' }} />
              <input
                type="email" className="form-input"
                style={{ paddingLeft:38 }}
                placeholder="ty@przykład.pl"
                value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Hasło</label>
            <div style={{ position:'relative' }}>
              <Lock size={16} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text-subtle)', pointerEvents:'none' }} />
              <input
                type="password" className="form-input"
                style={{ paddingLeft:38 }}
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                required autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop:4 }}>
            {loading ? 'Logowanie…' : <><span>Zaloguj się</span><ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="auth-switch">
          Nie masz konta?{' '}
          <Link to="/register" className="auth-link">Utwórz konto</Link>
        </div>
      </div>
    </div>
  );
}
