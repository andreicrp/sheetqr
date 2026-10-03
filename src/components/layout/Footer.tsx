import React from 'react';
import { ShieldCheck, Lock, Sparkles, FileSpreadsheet } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        padding: '2.5rem 0 1.75rem 0',
        marginTop: 'auto',
      }}
    >
      <div className="max-w-7xl">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              <FileSpreadsheet size={20} color="var(--primary)" />
              <span>Sheet<span style={{ color: 'var(--primary)' }}>QR</span></span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.35rem', maxWidth: '420px', lineHeight: 1.5 }}>
              Turn spreadsheets into scannable QR data. Secure tokenized access, mobile spreadsheet preview, and seamless 1-click Google Sheets conversion.
            </p>
          </div>

          {/* Security Badges with Green Icons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                background: 'var(--bg-card)',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <ShieldCheck size={16} color="var(--primary)" />
              <span>Zero Content in QR (Tokenized)</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                background: 'var(--bg-card)',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Lock size={16} color="var(--primary)" />
              <span>Expiring & Password Protected</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                background: 'var(--bg-card)',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Sparkles size={16} color="var(--primary)" />
              <span>Google Sheets API v4</span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1.25rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            © {new Date().getFullYear()} SheetQR. High-performance spreadsheet sharing architecture.
          </div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <Link to="/upload" style={{ color: 'var(--text-secondary)' }}>Upload</Link>
            <Link to="/dashboard" style={{ color: 'var(--text-secondary)' }}>My Spreadsheets</Link>
            <Link to="/settings" style={{ color: 'var(--text-secondary)' }}>Settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
