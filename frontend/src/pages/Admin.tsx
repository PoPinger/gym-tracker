import { useEffect, useState } from 'react';
import axios from 'axios';
import { adminApi } from '../services/api';
import AppLoader from '../components/AppLoader';
import { useLanguage } from '../i18n/LanguageContext';
import type { AdminUser, ResetCode } from '../types';
import { KeyRound, Copy, Check } from 'lucide-react';

export default function Admin() {
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [busyId, setBusyId]     = useState<number | null>(null);
  const [issued, setIssued]     = useState<{ user: AdminUser; code: ResetCode } | null>(null);
  const [copied, setCopied]     = useState(false);
  const { lang, t }             = useLanguage();

  const locale = lang === 'pl' ? 'pl-PL' : 'en-US';
  // Backend sends naive UTC timestamps
  const parse = (s: string) => new Date(/[zZ]|[+-]\d\d:\d\d$/.test(s) ? s : `${s}Z`);
  const fmtDate = (s: string) => parse(s).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtDateTime = (s: string) => parse(s).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    adminApi.listUsers()
      .then(res => setUsers(res.data))
      .catch(err => setError(t(axios.isAxiosError(err) && err.response?.status === 403 ? 'admin_no_access' : 'admin_load_error')))
      .finally(() => setLoading(false));
  }, [t]);

  const generate = async (user: AdminUser) => {
    setBusyId(user.id);
    setError('');
    try {
      const res = await adminApi.createResetCode(user.id);
      setCopied(false);
      setIssued({ user, code: res.data });
    } catch {
      setError(t('admin_generate_error'));
    } finally {
      setBusyId(null);
    }
  };

  const copy = async () => {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.code.code);
      setCopied(true);
    } catch {
      // Clipboard unavailable: the code is still selectable on screen
    }
  };

  if (loading) return <AppLoader />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('admin_title')}</h1>
          <p className="page-subtitle">{t('admin_sub')}</p>
        </div>
      </div>

      {error && <div className="alert alert-error"><span>{error}</span></div>}

      {users.length > 0 && (
        <>
          <div className="section-title">{t('admin_users_count')} · {users.length}</div>
          <div className="admin-users">
            {users.map(u => (
              <div key={u.id} className="card admin-user">
                <div className="admin-user-info">
                  <div className="admin-user-name">{u.display_name || t('admin_no_name')}</div>
                  <div className="admin-user-email">{u.email}</div>
                  <div className="admin-user-date">{t('admin_created')}: {fmtDate(u.created_at)}</div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => generate(u)} disabled={busyId !== null}>
                  <KeyRound size={15} />
                  {busyId === u.id ? t('admin_generating') : t('admin_generate_code')}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {issued && (
        <div className="modal-overlay">
          <div className="modal" role="dialog" aria-modal="true" aria-label={t('admin_code_title')}>
            <div className="modal-title">{t('admin_code_title')}</div>
            <p className="modal-body">
              {t('admin_code_for')}: <strong>{issued.user.display_name || issued.user.email}</strong>
              {issued.user.display_name && <> ({issued.user.email})</>}
            </p>
            <div className="admin-code">{issued.code.code}</div>
            <p className="modal-body" style={{ fontSize: 13 }}>
              {t('admin_code_valid_until')}: {fmtDateTime(issued.code.expires_at)}
            </p>
            <div className="alert alert-info" style={{ marginTop: 12, marginBottom: 0, fontSize: 13 }}>
              <span>{t('admin_code_note')}</span>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline btn-sm" onClick={() => setIssued(null)}>{t('pwd_close')}</button>
              <button className="btn btn-primary btn-sm" onClick={copy}>
                {copied ? <><Check size={15} />{t('admin_copied')}</> : <><Copy size={15} />{t('admin_copy')}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
