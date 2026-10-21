import { Lock } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete: 'current-password' | 'new-password';
  minLength?: number;
}

// Password field styled like the login form (lock icon inside the input)
export default function PasswordInput({ label, value, onChange, placeholder, autoComplete, minLength }: Props) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ position:'relative' }}>
        <Lock size={16} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text-subtle)', pointerEvents:'none' }} />
        <input
          type="password" className="form-input"
          style={{ paddingLeft:38 }}
          placeholder={placeholder}
          value={value} onChange={e => onChange(e.target.value)}
          required minLength={minLength} autoComplete={autoComplete}
        />
      </div>
    </div>
  );
}
