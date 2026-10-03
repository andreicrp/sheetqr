import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  QrCode,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { createSampleSpreadsheet, parseSpreadsheetFile } from '../services/spreadsheetService';
import { storageService } from '../services/storageService';
import { SpreadsheetRecord } from '../types/spreadsheet';
import { useToast } from '../context/ToastContext';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleLaunchSample = async (type: 'financial' | 'inventory' | 'attendees') => {
    setDemoLoading(true);
    try {
      const file = createSampleSpreadsheet(type);
      const parsed = await parseSpreadsheetFile(file);
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

      storageService.saveSpreadsheet(record);
      storageService.createShareLink(record.id, { expiresInDays: 7 });
      showToast('success', 'Sample Spreadsheet Loaded', file.name);
      navigate(`/preview/${record.id}`);
    } catch (err: any) {
      showToast('error', 'Failed to load demo', err.message);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(2.5rem, 6vw, 4.5rem)', padding: 'clamp(1.5rem, 4vw, 3rem) 0 4rem 0' }}>
      {/* Hero Section */}
      <section className="max-w-5xl" style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.85rem',
            background: 'var(--primary-light)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--primary)',
            fontSize: '0.825rem',
            fontWeight: 600,
            marginBottom: '1.25rem',
          }}
        >
          <Sparkles size={14} />
          <span>Next-Gen Spreadsheet Distribution</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2rem, 6vw, 3.75rem)',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            lineHeight: 1.15,
            color: 'var(--text-primary)',
            marginBottom: '1rem',
          }}
        >
          Turn Spreadsheets Into <span style={{ color: 'var(--primary)' }}>Scannable Data.</span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)',
            color: 'var(--text-secondary)',
            maxWidth: '640px',
            margin: '0 auto 1.75rem auto',
            lineHeight: 1.6,
          }}
        >
          Upload an Excel file, generate a secure QR code, and let others preview or convert it into Google Sheets.
        </p>

        {/* Primary CTA buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link to="/upload" className="btn btn-primary btn-lg" style={{ gap: '0.65rem', flex: '1 1 200px', maxWidth: '280px' }}>
            <FileSpreadsheet size={19} />
            <span>Upload Spreadsheet</span>
            <ArrowRight size={17} />
          </Link>

          <a href="#how-it-works" className="btn btn-secondary btn-lg" style={{ flex: '1 1 180px', maxWidth: '240px' }}>
            <span>See How It Works</span>
          </a>
        </div>

        {/* Quick Demo Trigger Pills */}
        <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Quick Try:</span>
          <button
            disabled={demoLoading}
            onClick={() => handleLaunchSample('financial')}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          >
            📊 Financial
          </button>
          <button
            disabled={demoLoading}
            onClick={() => handleLaunchSample('inventory')}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          >
            📦 Inventory
          </button>
          <button
            disabled={demoLoading}
            onClick={() => handleLaunchSample('attendees')}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          >
            🎟️ Attendees
          </button>
        </div>
      </section>

      {/* Visual Workflow Preview Banner */}
      <section className="max-w-7xl">
        <div
          className="card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            padding: 'clamp(1.25rem, 4vw, 2.25rem)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: 'clamp(1.25rem, 3vw, 2rem)',
              alignItems: 'center',
            }}
          >
            <div>
              <span className="badge badge-emerald" style={{ marginBottom: '0.75rem' }}>
                End-to-End Workflow
              </span>
              <h2 style={{ fontSize: 'clamp(1.35rem, 3.5vw, 1.85rem)', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Frictionless Spreadsheet Sharing
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                No messy email attachments or lost USB drives. SheetQR transforms complex multi-tab Excel files into an encrypted, scannable QR link that opens in any browser on any phone or laptop.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <span>Preserves multiple worksheets, headers & custom cell values</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <span>High-resolution QR with SVG & PNG vector exports</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <span>Direct 1-click Google Sheets cloud conversion</span>
                </div>
              </div>
            </div>

            {/* Workflow Diagram Box */}
            <div
              style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-default)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                maxWidth: '340px',
                margin: '0 auto',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                  <FileSpreadsheet size={17} color="var(--primary)" />
                  <span style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Q3_Performance.xlsx
                  </span>
                </div>
                <span className="badge badge-emerald">Ready</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem 0' }}>
                <div
                  style={{
                    background: '#ffffff',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                  }}
                >
                  <QrCode size={110} color="#0f172a" />
                </div>
              </div>

              <Link to="/upload" className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                Create Yours Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Three-Step Section */}
      <section id="how-it-works" className="max-w-7xl" style={{ scrollMarginTop: '5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="badge badge-emerald" style={{ marginBottom: '0.4rem' }}>
            Simple 3-Step Process
          </span>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.15rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
            How SheetQR Works
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            From raw spreadsheet to cloud synchronization in seconds.
          </p>
        </div>

        <div className="grid-3">
          {/* Step 1 */}
          <div className="card card-hover" style={{ padding: '1.5rem 1.25rem', position: 'relative' }}>
            <div
              style={{
                fontSize: '2rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                color: 'var(--border-default)',
                position: 'absolute',
                top: '1rem',
                right: '1.25rem',
              }}
            >
              01
            </div>

            <div style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>
              <FileSpreadsheet size={28} strokeWidth={2.2} />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Upload
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Upload your Excel (.xlsx, .xls) or CSV file. Fast client-side parsing automatically verifies worksheets, column headers, and data integrity.
            </p>
          </div>

          {/* Step 2 */}
          <div className="card card-hover" style={{ padding: '1.5rem 1.25rem', position: 'relative' }}>
            <div
              style={{
                fontSize: '2rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                color: 'var(--border-default)',
                position: 'absolute',
                top: '1rem',
                right: '1.25rem',
              }}
            >
              02
            </div>

            <div style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>
              <QrCode size={28} strokeWidth={2.2} />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Generate
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Create a secure, tokenized QR code. Configure optional password protection, custom expiration dates, and access revocation controls.
            </p>
          </div>

          {/* Step 3 */}
          <div className="card card-hover" style={{ padding: '1.5rem 1.25rem', position: 'relative' }}>
            <div
              style={{
                fontSize: '2rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                color: 'var(--border-default)',
                position: 'absolute',
                top: '1rem',
                right: '1.25rem',
              }}
            >
              03
            </div>

            <div style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>
              <Sparkles size={28} strokeWidth={2.2} />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Scan & Convert
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Scan the QR from any mobile device to view responsive data tables, download the original file, or instantly convert into Google Sheets.
            </p>
          </div>
        </div>
      </section>

      {/* Security Pillars */}
      <section className="max-w-7xl">
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: 'clamp(1.35rem, 3.5vw, 1.85rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
            High Security & Privacy
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Sensitive spreadsheet data deserves enterprise-grade access management.
          </p>
        </div>

        <div className="grid-3">
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.5rem' }}>
              <ShieldCheck size={22} color="var(--primary)" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Tokenized URLs</h4>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.5 }}>
              We never encode raw spreadsheet data inside the QR image. QR codes only hold secure, unpredictable, cryptographic tokens.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.5rem' }}>
              <Lock size={22} color="var(--primary)" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Expiring & One-Time Links</h4>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.5 }}>
              Set automatic link expiration from 1 hour to 30 days, or enable one-time access to burn the link immediately after the first scan.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.5rem' }}>
              <Zap size={22} color="var(--primary)" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Instant Revocation</h4>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.5 }}>
              Revoke active QR codes in 1-click from your dashboard. Scanners are instantly denied access with real-time feedback.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
