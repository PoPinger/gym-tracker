import { useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../i18n/LanguageContext';
import { authApi } from '../services/api';
import PasswordInput from './PasswordInput';

const MIN_PASSWORD = 8;

interface Props {
  onClose: () => void;
  onChanged: (session: { access_token: string; user_id: number; email: string; display_name?: string; is_admin?: boolean }) => void;
}

export default function ChangePasswordModal({ onClose, onChanged }: Props) {
  const [current, setCurrent]   = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat]     = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const { t }                   = useLanguage();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < MIN_PASSWORD) return setError(t('pwd_error_min'));
    if (password !== repeat) return setError(t('pwd_error_mismatch'));
    setLoading(true);
    try {
      const res = await authApi.changePassword(current, password);
      onChanged(res.data);   // other sessions were revoked; keep this one with the new token
      setDone(true);
    } catch (err) {
      setError(t(axios.isAxiosError(err) && err.response?.status === 400 ? 'pwd_error_current' : 'pwd_error_generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" role="dialog" aria-modal="true" aria-label={t('nav_change_password')}>
        <div className="modal-title">{t('nav_change_password')}</div>

        {done ? (
          <>
            <div className="alert alert-success" style={{ marginTop:12, marginBottom:0 }}>
              <span>{t('pwd_change_success')}</span>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary btn-sm" onClick={onClose}>{t('pwd_close')}</button>
            </div>
          </>
        ) : (
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14, marginTop:12 }}>
            {error && <div className="alert alert-error" style={{ marginBottom:0 }}><span>{error}</span></div>}
            <PasswordInput label={t('pwd_current_label')} value={current} onChange={setCurrent}
              autoComplete="current-password" />
            <PasswordInput label={t('pwd_new_label')} value={password} onChange={setPassword}
              placeholder={t('pwd_min_hint')} autoComplete="new-password" minLength={MIN_PASSWORD} />
            <PasswordInput label={t('pwd_repeat_label')} value={repeat} onChange={setRepeat}
              autoComplete="new-password" minLength={MIN_PASSWORD} />
            <div className="modal-actions" style={{ marginTop:10 }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>{t('pwd_cancel')}</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? t('pwd_saving') : t('pwd_save')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
