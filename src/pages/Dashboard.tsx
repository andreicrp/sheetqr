import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  FolderKanban,
  QrCode,
  Sparkles,
  Download,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { SpreadsheetRecord, ShareLink } from '../types/spreadsheet';
import { DashboardCard } from '../components/dashboard/DashboardCard';
import { AccessLogDrawer } from '../components/dashboard/AccessLogDrawer';
import { QRDisplay } from '../components/qr/QRDisplay';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useToast } from '../context/ToastContext';

export const Dashboard: React.FC = () => {
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [modalShareData, setModalShareData] = useState<{
    spreadsheet: SpreadsheetRecord;
    shareLink: ShareLink;
  } | null>(null);

  // Custom Confirmation Modals State
  const [deleteCandidate, setDeleteCandidate] = useState<SpreadsheetRecord | null>(null);
  const [revokeCandidate, setRevokeCandidate] = useState<{
    spreadsheet: SpreadsheetRecord;
    shareLink: ShareLink;
  } | null>(null);

  const { showToast } = useToast();

  const loadData = () => {
    const list = storageService.getAllSpreadsheets();
    setSpreadsheets(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmDelete = () => {
    if (!deleteCandidate) return;
    storageService.deleteSpreadsheet(deleteCandidate.id);
    loadData();
    showToast('info', 'Spreadsheet Deleted', deleteCandidate.filename);
    setDeleteCandidate(null);
  };

  const handleConfirmRevoke = () => {
    if (!revokeCandidate) return;
    storageService.revokeShareLink(revokeCandidate.shareLink.id);
    loadData();
    showToast('error', 'QR Code Revoked', `Access disabled for ${revokeCandidate.spreadsheet.filename}`);
    setRevokeCandidate(null);
  };

  const filteredSpreadsheets = spreadsheets.filter((s) =>
    s.filename.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="max-w-7xl" style={{ padding: '2.5rem 1rem 4rem 1rem' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <FolderKanban size={24} color="var(--primary)" />
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>My Spreadsheets</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage your parsed workbooks, secure QR links, access logs, and cloud exports.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/upload" className="btn btn-primary" style={{ gap: '0.5rem' }}>
            <Plus size={18} />
            <span>Upload Spreadsheet</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
          background: 'var(--bg-card)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.25rem', height: '36px', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Total Spreadsheets: <strong style={{ color: 'var(--text-primary)' }}>{spreadsheets.length}</strong>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredSpreadsheets.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '4rem 1.5rem',
            background: 'var(--bg-surface)',
            border: '2px dashed var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              margin: '0 auto 1.25rem auto',
            }}
          >
            <FileSpreadsheet size={32} />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {searchQuery ? 'No matching spreadsheets found' : 'No spreadsheets uploaded yet'}
          </h3>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            {searchQuery
              ? 'Try changing your search query or clear the filter.'
              : 'Upload an Excel or CSV file to parse worksheets and generate your first secure QR code.'}
          </p>

          <Link to="/upload" className="btn btn-primary">
            <Plus size={18} />
            <span>Upload Your First Spreadsheet</span>
          </Link>
        </div>
      ) : (
        <div className="grid-3">
          {filteredSpreadsheets.map((spreadsheet) => (
            <DashboardCard
              key={spreadsheet.id}
              spreadsheet={spreadsheet}
              onDelete={() => setDeleteCandidate(spreadsheet)}
              onRevoke={(link) => setRevokeCandidate({ spreadsheet, shareLink: link })}
              onViewLogs={(id) => setSelectedLogId(id)}
              onOpenShareModal={(s, l) => setModalShareData({ spreadsheet: s, shareLink: l })}
            />
          ))}
        </div>
      )}

      {/* QR Code Quick Modal */}
      {modalShareData && (
        <div className="modal-overlay" onClick={() => setModalShareData(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '28rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>QR Code</h3>
              </div>
              <button
                onClick={() => setModalShareData(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <QRDisplay
              shareLink={modalShareData.shareLink}
              spreadsheet={modalShareData.spreadsheet}
            />

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setModalShareData(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteCandidate)}
        title="Delete Spreadsheet"
        message={`Are you sure you want to permanently delete "${deleteCandidate?.filename}"? This action cannot be undone.`}
        confirmText="Delete Spreadsheet"
        cancelText="Keep Spreadsheet"
        variant="danger"
        iconType="delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCandidate(null)}
      />

      {/* Revoke Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(revokeCandidate)}
        title="Revoke QR Code Access"
        message={`Revoke public QR link for "${revokeCandidate?.spreadsheet.filename}"? Anyone who scans this QR code will immediately be denied access.`}
        confirmText="Revoke Access"
        cancelText="Keep Active"
        variant="danger"
        iconType="revoke"
        onConfirm={handleConfirmRevoke}
        onCancel={() => setRevokeCandidate(null)}
      />

      {/* Access Log Drawer */}
      <AccessLogDrawer
        spreadsheetId={selectedLogId}
        onClose={() => setSelectedLogId(null)}
      />
    </div>
  );
};
