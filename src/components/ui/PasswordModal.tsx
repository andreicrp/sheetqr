import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

interface PasswordModalProps {
  filename: string;
  onVerify: (password: string) => boolean;
  onSuccess: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ filename, onVerify, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onVerify(password)) {
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '24rem', textAlign: 'center' }}>
        <div
          style={{
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3b82f6',
            margin: '0 auto 1rem auto',
          }}
        >
          <Lock size={28} />
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>Protected Spreadsheet</h3>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.35rem', marginBottom: '1.25rem' }}>
          This spreadsheet (<strong style={{ color: '#cbd5e1' }}>{filename}</strong>) is password-protected. Enter the passcode to access.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <input
              type="password"
              className="input-field"
              placeholder="Enter access password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              autoFocus
              style={{ textAlign: 'center', letterSpacing: '0.2em', fontSize: '1.1rem' }}
            />
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  color: '#f43f5e',
                  fontSize: '0.8rem',
                  marginTop: '0.5rem',
                }}
              >
                <AlertCircle size={14} />
                <span>Incorrect password. Please try again.</span>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '0.5rem' }}>
            <span>Unlock Spreadsheet</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
