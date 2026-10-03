import React, { useState } from 'react';
import { QrCode, Download, FileSpreadsheet, Layers, Share2 } from 'lucide-react';
import { SpreadsheetRecord } from '../../types/spreadsheet';
import { SheetTabs } from './SheetTabs';
import { SpreadsheetTable } from './SpreadsheetTable';
import { FileInfo } from './FileInfo';
import { GoogleSheetsButton } from '../google/GoogleSheetsButton';
import { exportToXlsxBlob, exportToCsvBlob, triggerFileDownload } from '../../services/spreadsheetService';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';

interface SpreadsheetPreviewProps {
  spreadsheet: SpreadsheetRecord;
  onGenerateQr?: () => void;
  showActions?: boolean;
  allowDownload?: boolean;
  allowGoogleSheets?: boolean;
}

export const SpreadsheetPreview: React.FC<SpreadsheetPreviewProps> = ({
  spreadsheet,
  onGenerateQr,
  showActions = true,
  allowDownload = true,
  allowGoogleSheets = true,
}) => {
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const { showToast } = useToast();

  const activeSheet = spreadsheet.sheets[activeSheetIndex] || spreadsheet.sheets[0] || {
    name: 'Sheet 1',
    headers: [],
    rows: [],
    rowCount: 0,
    columnCount: 0,
  };

  const handleDownloadXlsx = () => {
    try {
      const blob = exportToXlsxBlob(spreadsheet);
      const safeName = spreadsheet.filename.endsWith('.xlsx')
        ? spreadsheet.filename
        : `${spreadsheet.filename.replace(/\.[^/.]+$/, '')}.xlsx`;
      triggerFileDownload(blob, safeName);
      storageService.logAccessEvent(spreadsheet.id, 'file_downloaded_xlsx', undefined, `Downloaded ${safeName}`);
      showToast('success', 'Download Started', safeName);
    } catch (err: any) {
      showToast('error', 'Download Failed', err.message);
    }
  };

  const handleDownloadCsv = () => {
    try {
      const blob = exportToCsvBlob(activeSheet);
      const safeName = `${spreadsheet.filename.replace(/\.[^/.]+$/, '')}_${activeSheet.name}.csv`;
      triggerFileDownload(blob, safeName);
      storageService.logAccessEvent(spreadsheet.id, 'file_downloaded_csv', undefined, `Downloaded ${safeName}`);
      showToast('success', 'Download Started', safeName);
    } catch (err: any) {
      showToast('error', 'Download Failed', err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* File Info Bar */}
      <FileInfo spreadsheet={spreadsheet} />

      {/* Action Toolbar if actions enabled */}
      {showActions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            background: 'var(--bg-card)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SheetTabs
              sheets={spreadsheet.sheets}
              activeSheetIndex={activeSheetIndex}
              onSelectSheet={setActiveSheetIndex}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            {allowDownload && (
              <>
                <button onClick={handleDownloadXlsx} className="btn btn-secondary btn-sm" title="Download as Excel XLSX">
                  <Download size={14} />
                  <span>Excel (.xlsx)</span>
                </button>
                <button onClick={handleDownloadCsv} className="btn btn-outline btn-sm" title="Download Active Sheet as CSV">
                  <Download size={14} />
                  <span>CSV</span>
                </button>
              </>
            )}

            {allowGoogleSheets && <GoogleSheetsButton spreadsheet={spreadsheet} size="sm" />}

            {onGenerateQr && (
              <button onClick={onGenerateQr} className="btn btn-primary btn-sm">
                <QrCode size={15} />
                <span>Generate QR</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Table */}
      <SpreadsheetTable worksheet={activeSheet} />
    </div>
  );
};
