import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, QrCode, FileSpreadsheet, Plus, Share2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { SpreadsheetPreview } from '../components/spreadsheet/SpreadsheetPreview';
import { ErrorState } from '../components/ui/ErrorState';

export const Preview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return <ErrorState type="not_found" title="No Spreadsheet Specified" />;
  }

  const spreadsheet = storageService.getSpreadsheet(id);

  if (!spreadsheet) {
    return (
      <div style={{ padding: '2rem 1rem' }}>
        <ErrorState
          type="not_found"
          title="Spreadsheet Not Found"
          message="The requested spreadsheet could not be found in local storage. It may have been deleted."
          actionText="Go to My Spreadsheets"
          actionLink="/dashboard"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl" style={{ padding: '2rem 1rem 4rem 1rem' }}>
      {/* Top Header Navigation */}
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
          <button onClick={() => navigate('/dashboard')} className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}>
            <ArrowLeft size={16} />
            <span>My Spreadsheets</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to={`/share/${spreadsheet.id}`} className="btn btn-primary btn-sm">
              <QrCode size={16} />
              <span>Manage QR Code</span>
            </Link>
            <Link to="/upload" className="btn btn-outline btn-sm">
              <Plus size={16} />
              <span>Upload Another</span>
            </Link>
          </div>
        </div>

        <div style={{ minWidth: 0, width: '100%', overflow: 'hidden' }}>
          <div
            style={{
              fontSize: '1.1rem',
              color: '#f8fafc',
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={spreadsheet.filename}
          >
            {spreadsheet.filename}
          </div>
        </div>
      </div>

      {/* Main Spreadsheet Preview */}
      <SpreadsheetPreview
        spreadsheet={spreadsheet}
        onGenerateQr={() => navigate(`/share/${spreadsheet.id}`)}
      />
    </div>
  );
};
