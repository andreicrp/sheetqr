import React from 'react';
import { FileSpreadsheet, Layers, Grid3X3, HardDrive, Calendar, CheckCircle2 } from 'lucide-react';
import { SpreadsheetRecord, SupportedFileType } from '../../types/spreadsheet';

interface FileInfoProps {
  spreadsheet: SpreadsheetRecord;
  className?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export const FileInfo: React.FC<FileInfoProps> = ({ spreadsheet, className = '' }) => {
  const fileTypeBadgeColor = (type: SupportedFileType) => {
    switch (type) {
      case 'xlsx':
        return 'badge-emerald';
      case 'xls':
        return 'badge-blue';
      case 'csv':
        return 'badge-amber';
      default:
        return 'badge-slate';
    }
  };

  const formattedDate = new Date(spreadsheet.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`card ${className}`} style={{ padding: '1.25rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Top Title Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
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
            <FileSpreadsheet size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
              title={spreadsheet.filename}
            >
              {spreadsheet.filename}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <Calendar size={13} />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span className={`badge ${fileTypeBadgeColor(spreadsheet.fileType)}`}>
            .{spreadsheet.fileType.toUpperCase()}
          </span>
          <span className="badge badge-slate" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <HardDrive size={12} />
            {formatFileSize(spreadsheet.fileSize)}
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))',
          gap: '0.65rem',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          width: '100%',
        }}
      >
        <div
          style={{
            background: 'var(--bg-subtle)',
            padding: '0.65rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Layers size={13} color="var(--accent-blue)" />
            <span>Worksheets</span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
            {spreadsheet.sheetCount}
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-subtle)',
            padding: '0.65rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Grid3X3 size={13} color="var(--primary)" />
            <span>Total Rows</span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
            {spreadsheet.rowCount.toLocaleString()}
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-subtle)',
            padding: '0.65rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Grid3X3 size={13} color="var(--accent-amber)" />
            <span>Columns</span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
            {spreadsheet.columnCount}
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-subtle)',
            padding: '0.65rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 size={13} color="var(--primary)" />
            <span>Health</span>
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '4px', color: 'var(--primary)' }}>
            Structure Valid
          </div>
        </div>
      </div>
    </div>
  );
};
