import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  QrCode,
  Copy,
  Download,
  Trash2,
  ExternalLink,
  Shield,
  Activity,
  Check,
  Eye,
  Ban,
} from 'lucide-react';
import { SpreadsheetRecord, ShareLink } from '../../types/spreadsheet';
import { formatFileSize } from '../spreadsheet/FileInfo';
import { buildShareUrl, downloadQrCodeImage } from '../../services/qrService';
import { storageService } from '../../services/storageService';
import { exportToXlsxBlob, triggerFileDownload } from '../../services/spreadsheetService';
import { GoogleSheetsButton } from '../google/GoogleSheetsButton';
import { useToast } from '../../context/ToastContext';

interface DashboardCardProps {
  spreadsheet: SpreadsheetRecord;
  shareLink?: ShareLink | null;
  onDelete: (id: string) => void;
  onRevoke?: (shareLink: ShareLink) => void;
  onViewLogs: (spreadsheetId: string) => void;
  onOpenShareModal: (spreadsheet: SpreadsheetRecord, shareLink: ShareLink) => void;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  spreadsheet,
  shareLink,
  onDelete,
  onRevoke,
  onViewLogs,
  onOpenShareModal,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const activeLink =
    shareLink ||
    storageService.getShareLinksForSpreadsheet(spreadsheet.id)[0] ||
    null;

  const shareUrl = activeLink ? buildShareUrl(activeLink.token) : '';
  const isExpired = activeLink?.expiresAt ? new Date(activeLink.expiresAt) < new Date() : false;
  const isRevoked = activeLink?.status === 'revoked';

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      navigator?.vibrate?.(15);
      showToast('success', 'Link copied to clipboard!', shareUrl);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('error', 'Failed to copy link');
    }
  };

  const handleDownloadExcel = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const blob = exportToXlsxBlob(spreadsheet);
      triggerFileDownload(blob, spreadsheet.filename);
      navigator?.vibrate?.(10);
      showToast('success', 'Download Started', spreadsheet.filename);
    } catch (err: any) {
      showToast('error', 'Download Failed', err.message);
    }
  };

  const handleRevoke = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeLink) return;
    if (onRevoke) {
      onRevoke(activeLink);
    } else {
      storageService.revokeShareLink(activeLink.id);
      showToast('error', 'QR Code Revoked', 'Spreadsheet link is now inaccessible.');
    }
  };

  const formattedDate = new Date(spreadsheet.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className="card card-hover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem',
      }}
    >
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
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
                flexShrink: 0,
              }}
            >
              <FileSpreadsheet size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h4
                style={{
                  fontSize: '0.975rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={spreadsheet.filename}
              >
                {spreadsheet.filename}
              </h4>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {formattedDate} • {formatFileSize(spreadsheet.fileSize)}
              </div>
            </div>
          </div>

          <span className="badge badge-emerald">.{spreadsheet.fileType.toUpperCase()}</span>
        </div>

        {/* Stats Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            padding: '0.65rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1rem',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Worksheets</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{spreadsheet.sheetCount}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Rows</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>{spreadsheet.rowCount.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Columns</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-amber)' }}>{spreadsheet.columnCount}</div>
          </div>
        </div>

        {/* QR & Expiration Status Line */}
        {activeLink && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.775rem',
              padding: '0.4rem 0.65rem',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isRevoked ? 'var(--accent-rose)' : isExpired ? 'var(--accent-amber)' : 'var(--primary)',
                }}
              />
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {isRevoked ? 'QR Revoked' : isExpired ? 'QR Expired' : 'QR Active'}
              </span>
            </div>

            <div style={{ color: 'var(--text-secondary)' }}>
              {activeLink.accessCount} scan{activeLink.accessCount === 1 ? '' : 's'}
            </div>
          </div>
        )}
      </div>

      {/* Card Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={() => navigate(`/preview/${spreadsheet.id}`)}
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
          >
            <Eye size={14} />
            <span>Preview</span>
          </button>

          {activeLink && (
            <button
              onClick={() => onOpenShareModal(spreadsheet, activeLink)}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
              title="View QR Code & Share Controls"
            >
              <QrCode size={14} />
              <span>QR Code</span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {activeLink && (
              <button
                onClick={handleCopy}
                className="btn btn-outline btn-sm btn-icon"
                title="Copy Share Link"
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              </button>
            )}

            <button
              onClick={handleDownloadExcel}
              className="btn btn-outline btn-sm btn-icon"
              title="Download Excel File"
            >
              <Download size={14} />
            </button>

            <button
              onClick={() => onViewLogs(spreadsheet.id)}
              className="btn btn-outline btn-sm btn-icon"
              title="View Access History & Logs"
            >
              <Activity size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {activeLink && !isRevoked && (
              <button
                onClick={handleRevoke}
                className="btn btn-outline btn-sm btn-icon"
                title="Revoke QR Access"
                style={{ color: '#fb7185' }}
              >
                <Ban size={14} />
              </button>
            )}

            <button
              onClick={() => onDelete(spreadsheet.id)}
              className="btn btn-outline btn-sm btn-icon"
              title="Delete Spreadsheet"
              style={{ color: '#f43f5e' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
