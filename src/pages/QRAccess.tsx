import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Download,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
  Grid3X3,
  HardDrive,
  ShieldCheck,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { ShareLink, SpreadsheetRecord } from '../types/spreadsheet';
import { formatFileSize } from '../components/spreadsheet/FileInfo';
import { SpreadsheetPreview } from '../components/spreadsheet/SpreadsheetPreview';
import { GoogleSheetsButton } from '../components/google/GoogleSheetsButton';
import { exportToXlsxBlob, exportToCsvBlob, triggerFileDownload } from '../services/spreadsheetService';
import { PasswordModal } from '../components/ui/PasswordModal';
import { ErrorState } from '../components/ui/ErrorState';
import { useToast } from '../context/ToastContext';

export const QRAccess: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { showToast } = useToast();

  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [spreadsheet, setSpreadsheet] = useState<SpreadsheetRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const link = storageService.getShareLinkByToken(token);
    if (!link) {
      setIsLoading(false);
      return;
    }

    // Check expiration or revocation
    const isExpired = link.expiresAt ? new Date(link.expiresAt) < new Date() : false;
    if (isExpired) {
      link.status = 'expired';
      storageService.updateShareLink(link);
    }

    setShareLink(link);

    const sheet = storageService.getSpreadsheet(link.spreadsheetId);
    setSpreadsheet(sheet);

    // If no password required, unlock automatically
    if (!link.hasPassword) {
      setIsUnlocked(true);
      // Record access
      storageService.recordLinkAccess(link);
    }

    setIsLoading(false);
  }, [token]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem', color: '#94a3b8' }}>
        <div
          style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            border: '3px solid #10b981',
            borderTopColor: 'transparent',
            margin: '0 auto 1rem auto',
          }}
          className="animate-spin"
        />
        <div>Loading spreadsheet access...</div>
      </div>
    );
  }

  if (!shareLink || !spreadsheet) {
    return (
      <div style={{ padding: '2rem 1rem' }}>
        <ErrorState
          type="not_found"
          title="Invalid QR Code"
          message="This QR code link is invalid or has expired. Please check with the person who shared it."
          actionText="Visit SheetQR"
          actionLink="/"
        />
      </div>
    );
  }

  if (shareLink.status === 'revoked') {
    return (
      <div style={{ padding: '2rem 1rem' }}>
        <ErrorState
          type="revoked"
          title="Access Revoked"
          message="The owner of this spreadsheet has revoked access to this QR link."
          actionText="Visit SheetQR"
          actionLink="/"
        />
      </div>
    );
  }

  if (shareLink.status === 'expired' || (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date())) {
    return (
      <div style={{ padding: '2rem 1rem' }}>
        <ErrorState
          type="expired"
          title="QR Code Expired"
          message="The time limit on this QR code has passed. Request a new link from the owner."
          actionText="Visit SheetQR"
          actionLink="/"
        />
      </div>
    );
  }

  if (shareLink.status === 'exhausted') {
    return (
      <div style={{ padding: '2rem 1rem' }}>
        <ErrorState
          type="exhausted"
          title="One-Time Link Used"
          message="This one-time QR code has already been scanned and cannot be accessed again."
          actionText="Visit SheetQR"
          actionLink="/"
        />
      </div>
    );
  }

  // Handle password unlock
  const handleVerifyPassword = (enteredPassword: string) => {
    const valid = storageService.verifyPassword(enteredPassword, shareLink.passwordHash);
    if (valid) {
      setIsUnlocked(true);
      storageService.recordLinkAccess(shareLink);
      showToast('success', 'Passcode Accepted', 'Spreadsheet unlocked.');
    }
    return valid;
  };

  const handleDownloadXlsx = () => {
    try {
      const blob = exportToXlsxBlob(spreadsheet);
      const safeName = spreadsheet.filename.endsWith('.xlsx')
        ? spreadsheet.filename
        : `${spreadsheet.filename.replace(/\.[^/.]+$/, '')}.xlsx`;
      triggerFileDownload(blob, safeName);
      storageService.logAccessEvent(spreadsheet.id, 'file_downloaded_xlsx', shareLink.token, `Downloaded ${safeName}`);
      showToast('success', 'Download Started', safeName);
    } catch (err: any) {
      showToast('error', 'Download Failed', err.message);
    }
  };

  const handleDownloadCsv = () => {
    try {
      const activeSheet = spreadsheet.sheets[0] || { name: 'Data', headers: [], rows: [], rowCount: 0, columnCount: 0 };
      const blob = exportToCsvBlob(activeSheet);
      const safeName = `${spreadsheet.filename.replace(/\.[^/.]+$/, '')}_${activeSheet.name}.csv`;
      triggerFileDownload(blob, safeName);
      storageService.logAccessEvent(spreadsheet.id, 'file_downloaded_csv', shareLink.token, `Downloaded ${safeName}`);
      showToast('success', 'Download Started', safeName);
    } catch (err: any) {
      showToast('error', 'Download Failed', err.message);
    }
  };

  const formattedUploadDate = new Date(spreadsheet.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedExpiration = shareLink.expiresAt
    ? new Date(shareLink.expiresAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Never (Permanent)';

  return (
    <div className="max-w-5xl" style={{ padding: '2rem 1rem 4rem 1rem', margin: '0 auto' }}>
      {/* Password Modal if locked */}
      {!isUnlocked && (
        <PasswordModal
          filename={spreadsheet.filename}
          onVerify={handleVerifyPassword}
          onSuccess={() => setIsUnlocked(true)}
        />
      )}

      {/* Scanned Access Header Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-emerald">QR Scanned</span>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Verified Shareable Link</span>
        </div>

        <Link to="/" style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
          Powered by SheetQR
        </Link>
      </div>

      {/* Main Public Access Card */}
      <div
        className="card"
        style={{
          padding: '2rem 1.5rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          marginBottom: '1.75rem',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* Title & File Type */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
            <div
              style={{
                width: '3.25rem',
                height: '3.25rem',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                flexShrink: 0,
              }}
            >
              <FileSpreadsheet size={28} />
            </div>

            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  fontSize: 'clamp(1.25rem, 3vw, 1.65rem)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={spreadsheet.filename}
              >
                {spreadsheet.filename}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span className="badge badge-emerald">.{spreadsheet.fileType.toUpperCase()}</span>
                <span>{formatFileSize(spreadsheet.fileSize)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.75rem',
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Layers size={13} color="var(--accent-blue)" />
              <span>Worksheets</span>
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {spreadsheet.sheetCount}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Grid3X3 size={13} color="var(--primary)" />
              <span>Rows</span>
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {spreadsheet.rowCount.toLocaleString()}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={13} color="var(--accent-amber)" />
              <span>Upload Date</span>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              {formattedUploadDate}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={13} color="var(--accent-purple)" />
              <span>Expiration</span>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              {formattedExpiration}
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
            marginTop: '1.75rem',
          }}
        >
          {/* Toggle Interactive Table Preview */}
          <button
            onClick={() => {
              navigator?.vibrate?.(10);
              setShowTable(!showTable);
              storageService.logAccessEvent(spreadsheet.id, 'spreadsheet_previewed', shareLink.token, 'Scanned preview opened');
            }}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Eye size={18} />
            <span>{showTable ? 'Hide Spreadsheet' : 'Preview Spreadsheet'}</span>
            {showTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Google Sheets Conversion */}
          {shareLink.allowGoogleSheets && (
            <GoogleSheetsButton
              spreadsheet={spreadsheet}
              variant="google"
              size="lg"
            />
          )}
        </div>

        {/* Download Buttons if allowed */}
        {shareLink.allowDownload && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '1.25rem',
              flexWrap: 'wrap',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1.25rem',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', width: '100%', textAlign: 'center' }}>
              Download Raw Spreadsheet:
            </span>

            <button onClick={handleDownloadXlsx} className="btn btn-secondary btn-sm" style={{ flex: '1 1 140px' }}>
              <Download size={14} />
              <span>Excel (.xlsx)</span>
            </button>

            <button onClick={handleDownloadCsv} className="btn btn-outline btn-sm" style={{ flex: '1 1 120px' }}>
              <Download size={14} />
              <span>CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Interactive Spreadsheet Preview Accordion */}
      {showTable && (
        <div style={{ marginTop: '1.5rem', animation: 'modalIn 0.25s ease-out' }}>
          <SpreadsheetPreview
            spreadsheet={spreadsheet}
            showActions={true}
            allowDownload={shareLink.allowDownload}
            allowGoogleSheets={shareLink.allowGoogleSheets}
          />
        </div>
      )}
    </div>
  );
};
