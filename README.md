# SheetQR — Turn Spreadsheets Into Scannable Data

**SheetQR** is a standalone, high-performance web application built with **React**, **TypeScript**, **SheetJS (xlsx)**, and **Google Sheets API v4**.

SheetQR allows users to upload Excel (.xlsx, .xls) and CSV spreadsheets, preview them in a virtualized, searchable viewer, generate secure tokenized QR codes, and enable scanners on mobile devices to view, download, or convert the spreadsheet into Google Sheets.

---

## 🌟 Key Features

### 1. 📊 Multi-Format Spreadsheet Parser
- Parses **.xlsx**, **.xls**, and **.csv** files up to 25MB using SheetJS.
- Multi-worksheet support with preserved tab names, columns, headers, empty cells, and cell values.
- Real-time file diagnostics: total row count, column count, worksheet tally, and file size.
- Built-in sample datasets (Financial Model, Inventory, Event Attendees, Employee Directory) for instant 1-click testing.

### 2. ⚡ High-Performance Virtualized Viewer
- Virtualized pagination (25, 50, 100, 250 rows per page) preventing browser lag on large spreadsheets.
- Instant search filtering across all rows and columns.
- Sticky column headers & row indices.
- Interactive column sorting (ascending / descending).
- Multi-tab worksheet switcher.

### 3. 🔐 Secure Tokenized QR Generation
- Generates unique, unpredictable, non-sequential cryptographic tokens (e.g. `8F4K92XQ`).
- **Zero raw file contents inside the QR code** — only clean, secure access URLs (`https://domain.com/s/:token`).
- High-resolution QR code rendering with vector **SVG** and high-DPI **PNG** download options.
- 1-click **Copy Share Link**.
- Built-in in-browser **QR Scanner & Token Jump** utility for instant testing.

### 4. 🛡️ Enterprise Share Management & Security Policies
- **Expiration Periods**: 1 Hour, 24 Hours, 7 Days, 30 Days, or Custom/Permanent.
- **Password Protection**: Optional passcode lock for sensitive spreadsheets.
- **One-Time Access (Burn on Scan)**: Automatically invalidates the link after 1 successful scan.
- **Permissions Control**: Granular toggles to allow or restrict raw file downloads and Google Sheets conversion.
- **Instant Revocation & Token Regeneration**: Immediately shut down access or generate fresh tokens.

### 5. 📱 Mobile-First Public QR Access Page (`/s/:token`)
- Specially tailored for smartphones and tablet QR scanners.
- Clean summary of workbook structure, row counts, and health status.
- Expandable interactive table preview with mobile scrolling.
- Direct download for Excel (.xlsx) and CSV formats.

### 6. ☁️ Google Sheets 1-Click Conversion
- Google OAuth 2.0 integration with Google Identity Services.
- Creates real Google Spreadsheets via Google Sheets REST API v4.
- Preserves all worksheets, column titles, and cell data directly into the user's Google Drive.
- Provides immediate direct link: `[Open in Google Sheets]`.

### 7. 📈 Management Dashboard ("My Spreadsheets")
- Centralized overview of all uploaded spreadsheets.
- Live QR status badges (Active, Expired, Revoked).
- Detailed event audit logs tracking:
  - `qr_generated`
  - `qr_accessed`
  - `spreadsheet_previewed`
  - `file_downloaded_xlsx` / `file_downloaded_csv`
  - `google_conversion_started` / `google_conversion_completed`
  - `qr_revoked`

---

## 🚀 Getting Started

### Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to use SheetQR.

### Production Build
```bash
npm run build
```
The optimized bundle will be created in the `dist/` directory.

---

## 📁 Architecture Overview

```
src/
├── components/
│   ├── dashboard/          # DashboardCard, AccessLogDrawer
│   ├── google/             # GoogleSheetsButton & conversion modal
│   ├── layout/             # Navbar, Footer
│   ├── qr/                 # QRDisplay, ShareControls, QRScannerModal
│   ├── spreadsheet/        # SpreadsheetUploader, SpreadsheetPreview, SpreadsheetTable, SheetTabs, FileInfo
│   └── ui/                 # ErrorState, PasswordModal, Toast
├── context/
│   └── ToastContext.tsx    # Toast notification system
├── pages/
│   ├── Landing.tsx         # SaaS Landing page with 3-step workflow
│   ├── Upload.tsx          # Dedicated upload & parser screen
│   ├── Preview.tsx         # Multi-sheet spreadsheet previewer
│   ├── Share.tsx           # QR Code generator & share policy controls
│   ├── QRAccess.tsx        # Mobile-first public scanned access page
│   ├── Dashboard.tsx       # "My Spreadsheets" management dashboard
│   └── Settings.tsx        # Google OAuth credentials & defaults
├── services/
│   ├── spreadsheetService.ts # SheetJS parsing, structure validation & export
│   ├── qrService.ts          # Cryptographic token generator & QR exporters
│   ├── googleSheetsService.ts# Google OAuth 2.0 & Sheets API v4 integration
│   └── storageService.ts     # Persistent local storage & audit event logging
├── styles/
│   └── index.css           # Vanilla CSS design system
├── types/
│   └── spreadsheet.ts      # TypeScript interfaces
├── App.tsx
└── main.tsx
```
