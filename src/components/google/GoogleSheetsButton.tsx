import React, { useState } from 'react';
import { ExternalLink, CheckCircle2, AlertCircle, Loader2, Key, Sparkles, Shield, UploadCloud, Check } from 'lucide-react';
import { SpreadsheetRecord } from '../../types/spreadsheet';
import { googleSheetsService, GoogleConversionResult } from '../../services/googleSheetsService';
import { exportToXlsxBlob, triggerFileDownload, formatWorksheetForClipboard } from '../../services/spreadsheetService';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';

interface GoogleSheetsButtonProps {
  spreadsheet: SpreadsheetRecord;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'google';
  size?: 'sm' | 'md' | 'lg';
}

export const GoogleSheetsButton: React.FC<GoogleSheetsButtonProps> = ({
  spreadsheet,
  className = '',
  variant = 'google',
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<GoogleConversionResult | null>(null);
  const [customToken, setCustomToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [customClientId, setCustomClientId] = useState(
    () => storageService.getSettings().googleClientId || ''
  );
  const { showToast } = useToast();

  const handleStartConversion = async (tokenOverride?: string) => {
    setIsConverting(true);
    setErrorMessage(null);
    setResult(null);
    setStatusMessage('Connecting to Google Sheets Service...');

    try {
      storageService.logAccessEvent(
        spreadsheet.id,
        'google_conversion_started',
        undefined,
        `Google Conversion started for ${spreadsheet.filename}`
      );

      const effectiveToken = tokenOverride || customToken.trim() || undefined;

      // If client ID is provided in settings/local state, save it
      if (customClientId.trim()) {
        storageService.saveSettings({ googleClientId: customClientId.trim() });
      }

      const res = await googleSheetsService.convertToGoogleSheet(
        spreadsheet,
        effectiveToken,
        (msg) => setStatusMessage(msg)
      );

      setResult(res);

      if (res.spreadsheetId) {
        storageService.recordGoogleExport({
          id: 'gexp_' + Date.now(),
          spreadsheetId: spreadsheet.id,
          googleSpreadsheetId: res.spreadsheetId,
          googleSpreadsheetUrl: res.spreadsheetUrl,
          exportedAt: new Date().toISOString(),
        });
        showToast('success', 'Google Sheet Created!', 'Spreadsheet created with all rows and columns inserted.');
      } else {
        showToast('info', 'Google Sheets Opened', 'Use the clipboard paste to populate into Google Sheets.');
      }
    } catch (err: any) {
      console.error('Conversion error:', err);
      setErrorMessage(err.message || 'Failed to authenticate or create Google Sheet.');
      showToast('error', 'Conversion failed', err.message);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadAndOpenDrive = () => {
    try {
      const blob = exportToXlsxBlob(spreadsheet);
      triggerFileDownload(blob, spreadsheet.filename);
      window.open('https://drive.google.com/drive/my-drive', '_blank');
      showToast('success', 'Excel file downloaded', 'Upload to Google Drive to open directly in Google Sheets.');
    } catch (err: any) {
      showToast('error', 'Download Failed', err.message);
    }
  };

  const buttonClass =
    variant === 'google'
      ? 'btn btn-google'
      : variant === 'primary'
      ? 'btn btn-primary'
      : variant === 'secondary'
      ? 'btn btn-secondary'
      : 'btn btn-outline';

  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          if (!result && !isConverting) {
            handleStartConversion();
          }
        }}
        className={`${buttonClass} ${sizeClass} ${className}`}
        title="Convert this spreadsheet to Google Sheets"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
          <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" fill="#0F9D58" />
          <path d="M7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H13V17H7V15Z" fill="white" />
        </svg>
        <span>Convert to Google Sheets</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => !isConverting && setIsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '32rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" fill="var(--primary)" />
                  <path d="M7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H13V17H7V15Z" fill="#ffffff" />
                </svg>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Google Sheets Auto-Insertion</h3>
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>{spreadsheet.filename}</p>
                </div>
              </div>

              {!isConverting && (
                <button
                  onClick={() => setIsOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
                  aria-label="Close"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Converting Loader */}
            {isConverting && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <Loader2 size={36} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 1rem auto' }} />
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  {statusMessage}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Structuring {spreadsheet.sheetCount} worksheets, headers & {spreadsheet.rowCount.toLocaleString()} cell rows...
                </div>
              </div>
            )}

            {/* Error State */}
            {!isConverting && errorMessage && (
              <div style={{ padding: '0.75rem 0' }}>
                <div
                  style={{
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                    display: 'flex',
                    gap: '0.65rem',
                    marginBottom: '1rem',
                  }}
                >
                  <AlertCircle size={20} color="var(--accent-rose)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--accent-rose)', fontSize: '0.875rem' }}>Authorization Notice</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--accent-rose)', marginTop: '2px' }}>{errorMessage}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setIsOpen(false)}>
                    Close
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => handleStartConversion()}>
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Ready Result View */}
            {!isConverting && result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Mode A: Google OAuth API with Direct Server-Side Created Sheet */}
                {result.method === 'oauth_api' && result.spreadsheetUrl ? (
                  <div
                    style={{
                      background: 'var(--primary-light)',
                      border: '1px solid var(--primary-glow)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.25rem',
                      textAlign: 'center',
                    }}
                  >
                    <CheckCircle2 size={32} color="var(--primary)" style={{ margin: '0 auto 0.75rem auto' }} />
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Google Sheet Created & Populated!
                    </h4>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                      All {spreadsheet.rowCount.toLocaleString()} rows, {spreadsheet.columnCount} columns, and {spreadsheet.sheetCount} worksheets are <strong>already inserted</strong> on your Google Drive.
                    </p>

                    <div style={{ marginTop: '1.25rem' }}>
                      <a
                        href={result.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        <span>Open in Google Sheets</span>
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  </div>
                ) : (
                  /* Mode B: Direct Automated Options (Instant Sheets & Drive Upload) */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Method 1: Instant Google Drive Direct Import (Data 100% pre-inserted) */}
                    <div
                      style={{
                        background: 'var(--primary-light)',
                        border: '1px solid var(--primary-glow)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.15rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <UploadCloud size={18} color="var(--primary)" />
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Option 1: 1-Click Google Drive Import (Fully Pre-Inserted)
                        </h4>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                        Downloads your parsed <strong>{spreadsheet.filename}</strong> and opens Google Drive so Google automatically opens it as a full Google Spreadsheet with all worksheets intact.
                      </p>
                      <button
                        type="button"
                        onClick={handleDownloadAndOpenDrive}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        <UploadCloud size={15} />
                        <span>Download & Open Google Drive</span>
                      </button>
                    </div>

                    {/* Method 2: Google OAuth 2.0 Direct Cloud Sync */}
                    <div
                      style={{
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.15rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Shield size={16} color="var(--primary)" />
                          <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Option 2: Direct Google OAuth 2.0 Automation
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowTokenInput(!showTokenInput)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.775rem', cursor: 'pointer', fontWeight: 600 }}
                        >
                          {showTokenInput ? 'Hide' : 'Configure API Key'}
                        </button>
                      </div>

                      <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                        Connect your Google Cloud Client ID or OAuth token to create spreadsheets directly on your Google account via Google Sheets API v4.
                      </p>

                      {showTokenInput && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '0.75rem' }}>
                          <div>
                            <label className="input-label" style={{ fontSize: '0.75rem' }}>Google OAuth 2.0 Client ID or Access Token</label>
                            <input
                              type="text"
                              className="input-field"
                              placeholder="e.g. ya29.a0AfH6SM... or 12345.apps.googleusercontent.com"
                              value={customToken || customClientId}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val.startsWith('ya29.')) {
                                  setCustomToken(val);
                                } else {
                                  setCustomClientId(val);
                                }
                              }}
                              style={{ fontSize: '0.8rem', height: '36px' }}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleStartConversion(customToken.trim())}
                            className="btn btn-secondary btn-sm"
                            style={{ width: '100%', justifyContent: 'center' }}
                          >
                            <Key size={14} />
                            <span>Authenticate & Create via Google API</span>
                          </button>
                        </div>
                      )}

                      {!showTokenInput && (
                        <button
                          type="button"
                          onClick={() => handleStartConversion()}
                          className="btn btn-google btn-sm"
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          <span>Sign in with Google OAuth</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setIsOpen(false)}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
