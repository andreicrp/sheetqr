import React, { useState } from 'react';
import { Clock, Lock, Shield, EyeOff, RefreshCw, Ban, Check, Download, FileSpreadsheet, Sparkles } from 'lucide-react';
import { ShareLink } from '../../types/spreadsheet';
import { storageService } from '../../services/storageService';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useToast } from '../../context/ToastContext';

interface ShareControlsProps {
  shareLink: ShareLink;
  onUpdateShareLink: (updated: ShareLink) => void;
  onRegenerate: () => void;
}

export const ShareControls: React.FC<ShareControlsProps> = ({
  shareLink,
  onUpdateShareLink,
  onRegenerate,
}) => {
  const { showToast } = useToast();
  const [passwordInput, setPasswordInput] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [expirationChoice, setExpirationChoice] = useState<string>(
    shareLink.expiresAt ? 'custom' : 'never'
  );

  const handleExpirationChange = (choice: string) => {
    setExpirationChoice(choice);
    const now = new Date();
    let newExpiresAt: string | null = null;

    if (choice === '1hour') {
      newExpiresAt = new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString();
    } else if (choice === '24hours') {
      newExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    } else if (choice === '7days') {
      newExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (choice === '30days') {
      newExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (choice === 'never') {
      newExpiresAt = null;
    }

    const updated: ShareLink = { ...shareLink, expiresAt: newExpiresAt };
    storageService.updateShareLink(updated);
    onUpdateShareLink(updated);
    showToast('success', 'Expiration updated', choice === 'never' ? 'Link set to never expire' : `Expires in ${choice}`);
  };

  const handleSavePassword = () => {
    if (!passwordInput.trim()) {
      const updated: ShareLink = {
        ...shareLink,
        passwordHash: null,
        hasPassword: false,
      };
      storageService.updateShareLink(updated);
      onUpdateShareLink(updated);
      setIsSettingPassword(false);
      showToast('info', 'Password removed', 'Spreadsheet is now publicly accessible via QR.');
      return;
    }

    const updated: ShareLink = {
      ...shareLink,
      passwordHash: storageService.simpleHash(passwordInput.trim()),
      hasPassword: true,
    };
    storageService.updateShareLink(updated);
    onUpdateShareLink(updated);
    setIsSettingPassword(false);
    setPasswordInput('');
    showToast('success', 'Password Protection Enabled', 'Scanners will be prompted for this password.');
  };

  const handleToggleOneTime = () => {
    const updated: ShareLink = { ...shareLink, oneTime: !shareLink.oneTime };
    storageService.updateShareLink(updated);
    onUpdateShareLink(updated);
    showToast(
      'info',
      updated.oneTime ? 'One-time access enabled' : 'One-time access disabled',
      updated.oneTime ? 'QR link will expire after 1 successful access.' : 'QR link can be scanned multiple times.'
    );
  };

  const handleToggleDownload = () => {
    const updated: ShareLink = { ...shareLink, allowDownload: !shareLink.allowDownload };
    storageService.updateShareLink(updated);
    onUpdateShareLink(updated);
    showToast('info', 'Permissions updated', updated.allowDownload ? 'Download permitted' : 'Download disabled');
  };

  const handleToggleGoogleSheets = () => {
    const updated: ShareLink = { ...shareLink, allowGoogleSheets: !shareLink.allowGoogleSheets };
    storageService.updateShareLink(updated);
    onUpdateShareLink(updated);
    showToast(
      'info',
      'Permissions updated',
      updated.allowGoogleSheets ? 'Google Sheets export enabled' : 'Google Sheets export disabled'
    );
  };

  const handleConfirmRevoke = () => {
    storageService.revokeShareLink(shareLink.id);
    const updated: ShareLink = { ...shareLink, status: 'revoked', revokedAt: new Date().toISOString() };
    onUpdateShareLink(updated);
    setShowRevokeModal(false);
    showToast('error', 'QR Code Revoked', 'Access has been terminated permanently.');
  };

  const isRevoked = shareLink.status === 'revoked';

  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={18} color="#10b981" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Security & Share Management</h3>
        </div>
        <span className="badge badge-slate" style={{ fontFamily: 'var(--font-mono)' }}>
          Token: {shareLink.token}
        </span>
      </div>

      {/* Expiration Setting */}
      <div>
        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Clock size={14} color="#38bdf8" />
          <span>Set Expiration Period</span>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem', marginTop: '0.4rem' }}>
          {[
            { id: '1hour', label: '1 Hour' },
            { id: '24hours', label: '24 Hours' },
            { id: '7days', label: '7 Days' },
            { id: '30days', label: '30 Days' },
            { id: 'never', label: 'Never' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={isRevoked}
              onClick={() => handleExpirationChange(item.id)}
              className={`btn btn-sm ${expirationChoice === item.id ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.8rem', padding: '0.45rem' }}
            >
              {item.label}
            </button>
          ))}
        </div>
        {shareLink.expiresAt && (
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem' }}>
            Expires on: {new Date(shareLink.expiresAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* Password Protection */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isSettingPassword || shareLink.hasPassword ? '0.75rem' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={16} color={shareLink.hasPassword ? '#10b981' : '#64748b'} />
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Password Protection</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {shareLink.hasPassword ? 'Protected — Visitors must enter password' : 'Off — Publicly viewable via QR'}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isRevoked}
            onClick={() => setIsSettingPassword(!isSettingPassword)}
            className="btn btn-outline btn-sm"
          >
            {shareLink.hasPassword ? 'Change / Remove' : 'Set Password'}
          </button>
        </div>

        {isSettingPassword && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input
              type="password"
              className="input-field"
              placeholder="Enter secure password (leave empty to remove)"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{ height: '36px', fontSize: '0.85rem' }}
            />
            <button className="btn btn-primary btn-sm" onClick={handleSavePassword}>
              Save
            </button>
          </div>
        )}
      </div>

      {/* Access Permissions Toggles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '100%' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Scanned Access Privileges</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.65rem', width: '100%' }}>
          {/* One-Time Access */}
          <div
            onClick={!isRevoked ? handleToggleOneTime : undefined}
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${shareLink.oneTime ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'}`,
              background: shareLink.oneTime ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.02)',
              cursor: isRevoked ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                border: '1px solid #64748b',
                background: shareLink.oneTime ? '#f59e0b' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              {shareLink.oneTime && <Check size={14} />}
            </div>
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>1-Time Access (Burn on Scan)</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Invalidate immediately after 1 scan</div>
            </div>
          </div>

          {/* Allow Download */}
          <div
            onClick={!isRevoked ? handleToggleDownload : undefined}
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${shareLink.allowDownload ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
              background: shareLink.allowDownload ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
              cursor: isRevoked ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                border: '1px solid #64748b',
                background: shareLink.allowDownload ? '#10b981' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              {shareLink.allowDownload && <Check size={14} />}
            </div>
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>Allow File Downloads</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Download original .xlsx or .csv</div>
            </div>
          </div>

          {/* Allow Google Sheets */}
          <div
            onClick={!isRevoked ? handleToggleGoogleSheets : undefined}
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${shareLink.allowGoogleSheets ? 'rgba(59, 130, 246, 0.4)' : 'var(--border-subtle)'}`,
              background: shareLink.allowGoogleSheets ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.02)',
              cursor: isRevoked ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                border: '1px solid #64748b',
                background: shareLink.allowGoogleSheets ? '#3b82f6' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              {shareLink.allowGoogleSheets && <Check size={14} />}
            </div>
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>Google Sheets Conversion</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Allow 1-click cloud sync</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dangerous Management Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          type="button"
          onClick={onRegenerate}
          className="btn btn-secondary btn-sm"
          style={{ flex: 1 }}
          title="Create a brand new random token for this spreadsheet"
        >
          <RefreshCw size={14} />
          <span>Regenerate QR Token</span>
        </button>

        {!isRevoked && (
          <button
            type="button"
            onClick={() => setShowRevokeModal(true)}
            className="btn btn-danger btn-sm"
            style={{ flex: 1 }}
            title="Permanently disable this QR Code"
          >
            <Ban size={14} />
            <span>Revoke QR Access</span>
          </button>
        )}
      </div>

      {/* Revoke Confirmation Modal */}
      <ConfirmModal
        isOpen={showRevokeModal}
        title="Revoke QR Code Access"
        message="Are you sure you want to revoke this QR link? Anyone scanning it or attempting to access it will immediately be denied access."
        confirmText="Revoke Link"
        cancelText="Keep Active"
        variant="danger"
        iconType="revoke"
        onConfirm={handleConfirmRevoke}
        onCancel={() => setShowRevokeModal(false)}
      />
    </div>
  );
};
