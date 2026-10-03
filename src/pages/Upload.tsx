import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, ArrowLeft, ShieldCheck } from 'lucide-react';
import { SpreadsheetUploader } from '../components/spreadsheet/SpreadsheetUploader';
import { SpreadsheetRecord } from '../types/spreadsheet';
import { storageService } from '../services/storageService';
import { useToast } from '../context/ToastContext';

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleUploadSuccess = (record: SpreadsheetRecord) => {
    storageService.saveSpreadsheet(record);
    // Create initial share link with default expiration (e.g. 7 days)
    const settings = storageService.getSettings();
    storageService.createShareLink(record.id, {
      expiresInDays: settings.defaultExpirationDays,
      allowDownload: settings.allowDownloadByDefault,
      allowGoogleSheets: settings.allowGoogleSheetsByDefault,
    });

    showToast('success', 'Spreadsheet Uploaded & Parsed!', `${record.filename} is ready for preview.`);
    navigate(`/preview/${record.id}`);
  };

  return (
    <div className="max-w-3xl" style={{ padding: '2.5rem 1rem 4rem 1rem', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.75rem',
            background: 'var(--primary-light)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--primary)',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '0.75rem',
          }}
        >
          <FileSpreadsheet size={15} />
          <span>Spreadsheet Parser & QR Generator</span>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Upload Your Spreadsheet
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto' }}>
          Select or drag your Excel (.xlsx, .xls) or CSV file. We will parse worksheets, formats, and headers instantly.
        </p>
      </div>

      {/* Uploader Component */}
      <SpreadsheetUploader onSuccess={handleUploadSuccess} />

      {/* Trust & Privacy notice */}
      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: 'var(--text-secondary)',
          fontSize: '0.8rem',
        }}
      >
        <ShieldCheck size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>Privacy First:</strong> Your spreadsheet is processed client-side. Share links use non-sequential cryptographic tokens to prevent unauthorized enumeration.
        </div>
      </div>
    </div>
  );
};
