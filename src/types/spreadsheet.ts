export type SupportedFileType = 'xlsx' | 'xls' | 'csv';

export interface WorksheetData {
  name: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
  rowCount: number;
  columnCount: number;
  emptyCellsCount?: number;
}

export interface SpreadsheetRecord {
  id: string; // Internal UUID
  userId?: string;
  filename: string;
  fileType: SupportedFileType;
  fileSize: number; // in bytes
  rowCount: number; // total rows across sheets
  columnCount: number; // max column count
  sheetCount: number;
  sheets: WorksheetData[];
  createdAt: string; // ISO string
  storagePath?: string;
  status: 'active' | 'archived' | 'deleted';
  rawBufferBase64?: string; // base64 encoded original file buffer for direct binary download
}

export interface ShareLink {
  id: string; // Internal ID
  spreadsheetId: string;
  token: string; // Secure random alphanumeric token (e.g. 8-12 chars: '8F4K92XQ')
  createdAt: string;
  expiresAt: string | null; // null = never expires
  revokedAt: string | null; // ISO string if revoked
  passwordHash?: string | null; // hashed/salted password or empty
  hasPassword?: boolean;
  oneTime: boolean; // if true, invalidates after 1 access
  accessCount: number;
  allowDownload: boolean;
  allowGoogleSheets: boolean;
  status: 'active' | 'expired' | 'revoked' | 'exhausted';
}

export interface AccessLog {
  id: string;
  spreadsheetId: string;
  shareToken?: string;
  eventType: 
    | 'qr_generated'
    | 'qr_accessed'
    | 'spreadsheet_previewed'
    | 'file_downloaded_xlsx'
    | 'file_downloaded_csv'
    | 'google_conversion_started'
    | 'google_conversion_completed'
    | 'qr_revoked'
    | 'qr_regenerated';
  timestamp: string;
  userAgent?: string;
  details?: string;
}

export interface GoogleExportRecord {
  id: string;
  spreadsheetId: string;
  googleSpreadsheetId: string;
  googleSpreadsheetUrl: string;
  exportedAt: string;
  accountEmail?: string;
}

export interface ProcessingStep {
  step: 'idle' | 'uploading' | 'processing' | 'reading' | 'preview' | 'generating' | 'ready' | 'error';
  progress: number; // 0 to 100
  message: string;
}
