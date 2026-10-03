import React from 'react';
import { Activity, Clock, QrCode, Eye, Download, Sparkles, Ban, RefreshCw, X } from 'lucide-react';
import { AccessLog } from '../../types/spreadsheet';
import { storageService } from '../../services/storageService';

interface AccessLogDrawerProps {
  spreadsheetId: string | null;
  onClose: () => void;
}

export const AccessLogDrawer: React.FC<AccessLogDrawerProps> = ({ spreadsheetId, onClose }) => {
  if (!spreadsheetId) return null;

  const logs = storageService.getAccessLogs(spreadsheetId);
  const spreadsheet = storageService.getSpreadsheet(spreadsheetId);

  const getEventIcon = (type: AccessLog['eventType']) => {
    switch (type) {
      case 'qr_generated':
        return <QrCode size={16} color="#10b981" />;
      case 'qr_accessed':
        return <Eye size={16} color="#38bdf8" />;
      case 'spreadsheet_previewed':
        return <Eye size={16} color="#a855f7" />;
      case 'file_downloaded_xlsx':
      case 'file_downloaded_csv':
        return <Download size={16} color="#f59e0b" />;
      case 'google_conversion_started':
      case 'google_conversion_completed':
        return <Sparkles size={16} color="#10b981" />;
      case 'qr_revoked':
        return <Ban size={16} color="#f43f5e" />;
      case 'qr_regenerated':
        return <RefreshCw size={16} color="#38bdf8" />;
      default:
        return <Activity size={16} color="#94a3b8" />;
    }
  };

  const getEventTitle = (type: AccessLog['eventType']) => {
    switch (type) {
      case 'qr_generated':
        return 'QR Code Generated';
      case 'qr_accessed':
        return 'QR Code Scanned / Accessed';
      case 'spreadsheet_previewed':
        return 'Spreadsheet Previewed';
      case 'file_downloaded_xlsx':
        return 'Excel (.xlsx) Downloaded';
      case 'file_downloaded_csv':
        return 'CSV File Downloaded';
      case 'google_conversion_started':
        return 'Google Sheets Sync Started';
      case 'google_conversion_completed':
        return 'Google Sheets Export Complete';
      case 'qr_revoked':
        return 'QR Access Revoked';
      case 'qr_regenerated':
        return 'QR Token Regenerated';
      default:
        return 'Access Event';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '34rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Activity size={22} color="var(--primary)" />
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Access & Event Logs</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{spreadsheet?.filename || 'Spreadsheet Logs'}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Event List */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No access events recorded yet for this spreadsheet.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}
              >
                <div style={{ marginTop: '2px' }}>{getEventIcon(log.eventType)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {getEventTitle(log.eventType)}
                    </span>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {log.details && (
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {log.details}
                    </div>
                  )}
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {new Date(log.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
