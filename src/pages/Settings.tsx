import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Key, Clock, ShieldCheck, Database, RefreshCw, CheckCircle2, Sun, Moon } from 'lucide-react';
import { storageService, AppSettings } from '../services/storageService';
import { createSampleSpreadsheet, parseSpreadsheetFile } from '../services/spreadsheetService';
import { SpreadsheetRecord } from '../types/spreadsheet';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

export const Settings: React.FC = () => {
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    storageService.saveSettings(settings);
    setTimeout(() => {
      setIsSaving(false);
      showToast('success', 'Settings Saved', 'Your preferences have been updated.');
    }, 250);
  };

  const handleSeedSamples = async () => {
    try {
      const types = ['financial', 'inventory', 'attendees', 'employees'] as const;
      for (const t of types) {
        const file = createSampleSpreadsheet(t);
        const parsed = await parseSpreadsheetFile(file);
        const record: SpreadsheetRecord = {
          id: crypto.randomUUID ? crypto.randomUUID() : 'sheet_' + Math.random().toString(36).substring(2, 9),
          filename: file.name,
          fileType: parsed.fileType,
          fileSize: file.size,
          rowCount: parsed.totalRows,
          columnCount: parsed.maxCols,
          sheetCount: parsed.sheets.length,
          sheets: parsed.sheets,
          createdAt: new Date().toISOString(),
          status: 'active',
          rawBufferBase64: parsed.rawBufferBase64,
        };
        storageService.saveSpreadsheet(record);
        storageService.createShareLink(record.id, { expiresInDays: 7 });
      }
      showToast('success', 'Sample Data Seeded', '4 realistic sample workbooks added to your dashboard.');
    } catch (err: any) {
      showToast('error', 'Seeding failed', err.message);
    }
  };

  const handleConfirmClearAll = () => {
    localStorage.removeItem('sheetqr_spreadsheets_v1');
    localStorage.removeItem('sheetqr_share_links_v1');
    localStorage.removeItem('sheetqr_access_logs_v1');
    localStorage.removeItem('sheetqr_google_exports_v1');
    setShowClearModal(false);
    showToast('info', 'Storage Cleared', 'All local spreadsheets and logs have been reset.');
  };

  return (
    <div className="max-w-3xl" style={{ padding: '2.5rem 1rem 4rem 1rem', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.75rem' }}>
        <div
          style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
          }}
        >
          <SettingsIcon size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Settings & API Configuration</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Configure default QR policies, Google OAuth credentials, and local data storage.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Appearance & Theme Setting */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Sun size={18} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Appearance & Theme</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => {
                navigator?.vibrate?.(10);
                setTheme('dark');
              }}
              className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-outline'}`}
              style={{ justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
            >
              <Moon size={16} />
              <span>Pitch Black OLED</span>
            </button>

            <button
              type="button"
              onClick={() => {
                navigator?.vibrate?.(10);
                setTheme('light');
              }}
              className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-outline'}`}
              style={{ justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
            >
              <Sun size={16} />
              <span>Clean Light Mode</span>
            </button>
          </div>
        </div>

        {/* Google OAuth Configuration */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Key size={18} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Google OAuth 2.0 Credentials</h3>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            To enable direct Google OAuth popups with your custom Google Cloud Project, provide your Google OAuth 2.0 Client ID below. If left blank, SheetQR automatically runs in built-in instant demonstration mode.
          </p>

          <div>
            <label className="input-label">Google OAuth Client ID (Optional)</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. 1234567890-abcdefg.apps.googleusercontent.com"
              value={settings.googleClientId}
              onChange={(e) => setSettings({ ...settings, googleClientId: e.target.value })}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Requires Google Sheets API v4 enabled in your Google Cloud Console.
            </div>
          </div>
        </div>

        {/* Default QR Expiration & Permissions */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Clock size={18} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Default Share & Security Policy</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="input-label">Default Link Expiration (Days)</label>
              <select
                className="input-field"
                value={settings.defaultExpirationDays}
                onChange={(e) => setSettings({ ...settings, defaultExpirationDays: Number(e.target.value) })}
              >
                <option value={1}>1 Day (24 Hours)</option>
                <option value={7}>7 Days (1 Week)</option>
                <option value={30}>30 Days (1 Month)</option>
                <option value={90}>90 Days (3 Months)</option>
                <option value={0}>Never Expire (Manual Revocation Only)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={settings.allowDownloadByDefault}
                  onChange={(e) => setSettings({ ...settings, allowDownloadByDefault: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                />
                <span>Allow file downloads by default</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={settings.allowGoogleSheetsByDefault}
                  onChange={(e) => setSettings({ ...settings, allowGoogleSheetsByDefault: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                />
                <span>Allow Google Sheets sync by default</span>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={isSaving} className="btn btn-primary btn-lg" style={{ gap: '0.5rem' }}>
            <Save size={18} />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Storage Management */}
      <div className="card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Database size={18} color="var(--accent-purple)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Data & Sample Workbooks</h3>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Populate your dashboard with realistic pre-configured workbooks or reset your workspace.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button type="button" onClick={handleSeedSamples} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} />
            <span>Load 4 Sample Spreadsheets</span>
          </button>

          <button type="button" onClick={() => setShowClearModal(true)} className="btn btn-danger btn-sm">
            <span>Clear Local Storage</span>
          </button>
        </div>
      </div>

      {/* Clear Storage Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearModal}
        title="Clear Local Storage"
        message="Are you sure you want to clear all stored spreadsheets, generated QR codes, and access history logs from your browser? This action cannot be undone."
        confirmText="Clear All Data"
        cancelText="Cancel"
        variant="danger"
        iconType="delete"
        onConfirm={handleConfirmClearAll}
        onCancel={() => setShowClearModal(false)}
      />
    </div>
  );
};
