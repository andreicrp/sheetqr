import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Landing } from './pages/Landing';
import { Upload } from './pages/Upload';
import { Preview } from './pages/Preview';
import { Share } from './pages/Share';
import { QRAccess } from './pages/QRAccess';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { QRScannerModal } from './components/qr/QRScannerModal';
import { storageService } from './services/storageService';
import { createSampleSpreadsheet, parseSpreadsheetFile } from './services/spreadsheetService';
import { SpreadsheetRecord } from './types/spreadsheet';

export const App: React.FC = () => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Auto-seed initial demo spreadsheet on first run if empty
  useEffect(() => {
    const existing = storageService.getAllSpreadsheets();
    if (existing.length === 0) {
      (async () => {
        try {
          const file = createSampleSpreadsheet('financial');
          const parsed = await parseSpreadsheetFile(file);
          const record: SpreadsheetRecord = {
            id: 'sample_q3_financial',
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
        } catch (e) {
          console.warn('Initial seed error:', e);
        }
      })();
    }
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="app-container">
            <Navbar onOpenScanner={() => setIsScannerOpen(true)} />

            <main className="main-content">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/preview/:id" element={<Preview />} />
                <Route path="/share/:id" element={<Share />} />
                <Route path="/s/:token" element={<QRAccess />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <Footer />

            {/* Global QR Scanner / Token Jump Modal */}
            <QRScannerModal
              isOpen={isScannerOpen}
              onClose={() => setIsScannerOpen(false)}
            />
          </div>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
};
