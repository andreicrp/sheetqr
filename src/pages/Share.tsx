import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, FileSpreadsheet } from 'lucide-react';
import { storageService } from '../services/storageService';
import { ShareLink, SpreadsheetRecord } from '../types/spreadsheet';
import { QRDisplay } from '../components/qr/QRDisplay';
import { ShareControls } from '../components/qr/ShareControls';
import { SpreadsheetPreview } from '../components/spreadsheet/SpreadsheetPreview';
import { ErrorState } from '../components/ui/ErrorState';
import { useToast } from '../context/ToastContext';

export const Share: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [spreadsheet, setSpreadsheet] = useState<SpreadsheetRecord | null>(null);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [showSheetPreview, setShowSheetPreview] = useState(false);

  useEffect(() => {
    if (!id) return;
    const sheet = storageService.getSpreadsheet(id);
    setSpreadsheet(sheet);

    if (sheet) {
      let links = storageService.getShareLinksForSpreadsheet(id);
      if (links.length === 0) {
        const settings = storageService.getSettings();
        const newLink = storageService.createShareLink(id, {
          expiresInDays: settings.defaultExpirationDays,
          allowDownload: settings.allowDownloadByDefault,
          allowGoogleSheets: settings.allowGoogleSheetsByDefault,
        });
        setShareLink(newLink);
      } else {
        setShareLink(links[0]);
      }
    }
  }, [id]);

  if (!id || !spreadsheet) {
    return (
      <div style={{ padding: '2rem 1rem' }}>
        <ErrorState
          type="not_found"
          title="Spreadsheet Not Found"
          message="The requested spreadsheet is missing or has been deleted."
          actionText="Go to My Spreadsheets"
          actionLink="/dashboard"
        />
      </div>
    );
  }

  const handleRegenerate = () => {
    const settings = storageService.getSettings();
    const newLink = storageService.createShareLink(spreadsheet.id, {
      expiresInDays: settings.defaultExpirationDays,
      allowDownload: shareLink?.allowDownload ?? true,
      allowGoogleSheets: shareLink?.allowGoogleSheets ?? true,
    });
    setShareLink(newLink);
    showToast('success', 'New QR Token Generated', `Token: ${newLink.token}`);
  };

  return (
    <div className="max-w-7xl" style={{ padding: '1.5rem 0.75rem 3.5rem 0.75rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Navigation header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          width: '100%',
          maxWidth: '100%',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', width: '100%' }}>
          <button
            onClick={() => navigate(`/preview/${spreadsheet.id}`)}
            className="btn btn-outline btn-sm"
            style={{ flexShrink: 0 }}
          >
            <ArrowLeft size={16} />
            <span>Back to Preview</span>
          </button>

          <button
            onClick={() => setShowSheetPreview(!showSheetPreview)}
            className="btn btn-secondary btn-sm"
            style={{ flexShrink: 0 }}
          >
            <Eye size={15} />
            <span>{showSheetPreview ? 'Hide Table' : 'Show Table'}</span>
          </button>
        </div>

        <div style={{ minWidth: 0, width: '100%', overflow: 'hidden' }}>
          <div
            style={{
              fontSize: '1rem',
              color: 'var(--text-primary)',
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}
            title={spreadsheet.filename}
          >
            QR Code: <span style={{ color: 'var(--primary)' }}>{spreadsheet.filename}</span>
          </div>
        </div>
      </div>

      {/* Main QR + Controls Grid */}
      {shareLink && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: '1.25rem',
            alignItems: 'start',
            marginBottom: '1.5rem',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Left Column: QR Code Display */}
          <QRDisplay shareLink={shareLink} spreadsheet={spreadsheet} />

          {/* Right Column: Share & Security Controls */}
          <ShareControls
            shareLink={shareLink}
            onUpdateShareLink={(updated) => setShareLink(updated)}
            onRegenerate={handleRegenerate}
          />
        </div>
      )}

      {/* Embedded spreadsheet preview toggle */}
      {showSheetPreview && (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', width: '100%', maxWidth: '100%' }}>
          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileSpreadsheet size={18} color="#10b981" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Spreadsheet Contents</h3>
          </div>
          <SpreadsheetPreview spreadsheet={spreadsheet} showActions={false} />
        </div>
      )}
    </div>
  );
};
