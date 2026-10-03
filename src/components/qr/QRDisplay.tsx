import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { ShareLink, SpreadsheetRecord } from '../../types/spreadsheet';
import { buildShareUrl, downloadQrCodeImage, downloadQrCodeSvg } from '../../services/qrService';
import { useToast } from '../../context/ToastContext';

interface QRDisplayProps {
  shareLink: ShareLink;
  spreadsheet: SpreadsheetRecord;
}

export const QRDisplay: React.FC<QRDisplayProps> = ({ shareLink, spreadsheet }) => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();
  const shareUrl = buildShareUrl(shareLink.token);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('success', 'Link copied to clipboard!', shareUrl);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('error', 'Failed to copy link', 'Please select and copy the text manually.');
    }
  };

  const handleDownloadPng = async () => {
    await downloadQrCodeImage(shareUrl, `SheetQR-${spreadsheet.filename.replace(/\.[^/.]+$/, '')}.png`);
    showToast('success', 'QR Code Downloaded', 'High-res PNG image saved.');
  };

  const handleDownloadSvg = async () => {
    await downloadQrCodeSvg(shareUrl, `SheetQR-${spreadsheet.filename.replace(/\.[^/.]+$/, '')}.svg`);
    showToast('success', 'QR Vector Downloaded', 'SVG vector saved.');
  };

  const isExpired = shareLink.expiresAt ? new Date(shareLink.expiresAt) < new Date() : false;
  const isRevoked = shareLink.status === 'revoked';

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '1.5rem 1rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Status Badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem', width: '100%' }}>
        {isRevoked ? (
          <span className="badge badge-rose">Revoked</span>
        ) : isExpired ? (
          <span className="badge badge-amber">Expired</span>
        ) : shareLink.status === 'exhausted' ? (
          <span className="badge badge-rose">One-Time Used</span>
        ) : (
          <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
            Active QR Code
          </span>
        )}

        {shareLink.hasPassword && <span className="badge badge-blue">Password</span>}
        {shareLink.oneTime && <span className="badge badge-amber">1-Time</span>}
      </div>

      {/* QR Code Canvas Card */}
      <div
        style={{
          background: '#ffffff',
          padding: '0.85rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          maxWidth: '100%',
        }}
      >
        <QRCodeSVG
          value={shareUrl}
          size={180}
          level="H"
          includeMargin={false}
          style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
          imageSettings={{
            src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23059669'><rect width='24' height='24' rx='6' fill='%23090d16'/><path d='M7 7h10v2H7zM7 11h10v2H7zM7 15h6v2H7z' fill='%2310b981'/></svg>",
            x: undefined,
            y: undefined,
            height: 32,
            width: 32,
            excavate: true,
          }}
        />

        {(isRevoked || isExpired) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.88)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              padding: '0.75rem',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fb7185' }}>
              {isRevoked ? 'QR Revoked' : 'QR Expired'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
              Inaccessible
            </div>
          </div>
        )}
      </div>

      {/* Security note */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginTop: '0.85rem',
          maxWidth: '100%',
        }}
      >
        <ShieldCheck size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Tokenized URL: No raw file in QR
        </span>
      </div>

      {/* Share Link Input Box */}
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          marginTop: '1rem',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
          padding: '0.4rem 0.5rem 0.4rem 0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.775rem',
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
            textAlign: 'left',
          }}
        >
          {shareUrl}
        </span>

        <button
          onClick={handleCopyLink}
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.3rem 0.6rem', minHeight: '30px', flexShrink: 0 }}
          title="Copy Link"
        >
          {copied ? <Check size={13} color="var(--primary)" /> : <Copy size={13} />}
          <span style={{ fontSize: '0.775rem' }}>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Action Buttons Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '0.5rem',
          width: '100%',
          maxWidth: '100%',
          marginTop: '1rem',
          boxSizing: 'border-box',
        }}
      >
        <button onClick={handleDownloadPng} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
          <Download size={13} />
          <span>PNG</span>
        </button>

        <button onClick={handleDownloadSvg} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
          <Download size={13} />
          <span>SVG</span>
        </button>

        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm"
          style={{ gridColumn: 'span 2', width: '100%', justifyContent: 'center' }}
        >
          <ExternalLink size={14} />
          <span>Open Access Page</span>
        </a>
      </div>
    </div>
  );
};
