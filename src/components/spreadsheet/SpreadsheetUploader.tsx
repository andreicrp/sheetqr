import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, AlertTriangle, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { parseSpreadsheetFile, createSampleSpreadsheet } from '../../services/spreadsheetService';
import { SpreadsheetRecord } from '../../types/spreadsheet';

interface SpreadsheetUploaderProps {
  onSuccess: (record: SpreadsheetRecord) => void;
}

type StepType = 'idle' | 'uploading' | 'processing' | 'reading' | 'preview' | 'ready' | 'error';

export const SpreadsheetUploader: React.FC<SpreadsheetUploaderProps> = ({ onSuccess }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepType>('idle');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setErrorMessage(null);
    setCurrentStep('uploading');
    setProgress(15);
    setStatusText(`Uploading ${file.name}...`);

    try {
      await new Promise((r) => setTimeout(r, 250));

      setCurrentStep('processing');
      setProgress(40);
      setStatusText('Validating spreadsheet binary structure...');
      await new Promise((r) => setTimeout(r, 300));

      setCurrentStep('reading');
      setProgress(65);
      setStatusText('Reading worksheets, columns, and data cells...');

      const parsed = await parseSpreadsheetFile(file);

      setCurrentStep('preview');
      setProgress(90);
      setStatusText('Preparing spreadsheet virtualization and preview...');
      await new Promise((r) => setTimeout(r, 250));

      const record: SpreadsheetRecord = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'sheet_' + Math.random().toString(36).substring(2, 9),
        filename: file.name,
        fileType: parsed.fileType,
        fileSize: file.size,
        rowCount: parsed.totalRows,
        columnCount: parsed.maxCols,
        sheetCount: parsed.sheets.length,
        sheets: parsed.sheets,
        createdAt: new Date().toISOString(),
        status: 'active',
        rawBufferBase64: parsed.rawBufferBase64,
      };

      setCurrentStep('ready');
      setProgress(100);
      setStatusText('Spreadsheet parsed successfully!');

      setTimeout(() => {
        onSuccess(record);
      }, 400);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setCurrentStep('error');
      setErrorMessage(err.message || 'An error occurred while reading the spreadsheet file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleLoadSample = (type: 'financial' | 'inventory' | 'attendees' | 'employees') => {
    const sample = createSampleSpreadsheet(type);
    processFile(sample);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Upload Dropzone */}
      <div
        className={`dropzone-container ${isDragOver ? 'is-drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => currentStep !== 'uploading' && currentStep !== 'processing' && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
          style={{ display: 'none' }}
        />

        <div className="dropzone-icon-circle">
          <UploadCloud size={36} />
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
          Drop your spreadsheet here, or <span style={{ color: 'var(--primary)' }}>browse</span>
        </h3>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '420px', lineHeight: 1.5 }}>
          Supports <strong>.xlsx</strong>, <strong>.xls</strong>, and <strong>.csv</strong> files up to 25MB. All worksheets and cell formatting are preserved.
        </p>

        {/* Formats Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
          <span className="badge badge-emerald">.XLSX</span>
          <span className="badge badge-blue">.XLS</span>
          <span className="badge badge-amber">.CSV</span>
        </div>
      </div>

      {/* Processing State Overlay / Progress */}
      {currentStep !== 'idle' && currentStep !== 'ready' && (
        <div
          className="card"
          style={{
            padding: '1.25rem',
            background: currentStep === 'error' ? 'rgba(244, 63, 94, 0.08)' : 'var(--bg-card)',
            borderColor: currentStep === 'error' ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-default)',
          }}
        >
          {currentStep === 'error' ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <AlertTriangle size={22} color="var(--accent-rose)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <h4 style={{ color: 'var(--accent-rose)', fontSize: '0.95rem', fontWeight: 700 }}>Upload & Parsing Failed</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>{errorMessage}</p>
                <div style={{ marginTop: '0.75rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setCurrentStep('idle');
                      setErrorMessage(null);
                    }}
                  >
                    Try Another File
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                    }}
                    className="animate-pulse-slow"
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{statusText}</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  background: 'var(--bg-muted)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--primary) 0%, #34d399 100%)',
                    transition: 'width 0.25s ease-in-out',
                  }}
                />
              </div>

              {/* Step checklist */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '0.75rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  flexWrap: 'wrap',
                  gap: '0.25rem',
                }}
              >
                <span style={{ color: progress >= 15 ? 'var(--primary)' : undefined }}>1. Upload</span>
                <span>→</span>
                <span style={{ color: progress >= 40 ? 'var(--primary)' : undefined }}>2. Structure</span>
                <span>→</span>
                <span style={{ color: progress >= 65 ? 'var(--primary)' : undefined }}>3. Read Cells</span>
                <span>→</span>
                <span style={{ color: progress >= 90 ? 'var(--primary)' : undefined }}>4. Preview</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instant Demo Samples Selector */}
      <div
        className="card"
        style={{
          background: 'var(--bg-card)',
          padding: '1.25rem',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sparkles size={16} color="var(--primary)" />
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            No spreadsheet on hand? Try a sample dataset:
          </h4>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleLoadSample('financial')}
            style={{ justifyContent: 'flex-start', padding: '0.6rem 0.85rem' }}
          >
            <FileSpreadsheet size={16} color="var(--primary)" />
            <div style={{ textAlign: 'left', minWidth: 0 }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>Financial Performance</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>2 Sheets • Multi-tab</div>
            </div>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleLoadSample('inventory')}
            style={{ justifyContent: 'flex-start', padding: '0.6rem 0.85rem' }}
          >
            <FileSpreadsheet size={16} color="var(--primary)" />
            <div style={{ textAlign: 'left', minWidth: 0 }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>Warehouse Inventory</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>SKUs, Stock & Pricing</div>
            </div>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleLoadSample('attendees')}
            style={{ justifyContent: 'flex-start', padding: '0.6rem 0.85rem' }}
          >
            <FileSpreadsheet size={16} color="var(--primary)" />
            <div style={{ textAlign: 'left', minWidth: 0 }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>TechSummit Attendees</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>VIP & General Passes</div>
            </div>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleLoadSample('employees')}
            style={{ justifyContent: 'flex-start', padding: '0.6rem 0.85rem' }}
          >
            <FileSpreadsheet size={16} color="var(--primary)" />
            <div style={{ textAlign: 'left', minWidth: 0 }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>Staff Directory (.csv)</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>CSV Standard Format</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
