import * as XLSX from 'xlsx';
import { SupportedFileType, WorksheetData, SpreadsheetRecord } from '../types/spreadsheet';

/**
 * Parses an ArrayBuffer / File using SheetJS (XLSX)
 */
export async function parseSpreadsheetFile(file: File): Promise<{
  sheets: WorksheetData[];
  totalRows: number;
  maxCols: number;
  fileType: SupportedFileType;
  rawBufferBase64: string;
}> {
  const fileName = file.name.toLowerCase();
  let fileType: SupportedFileType = 'xlsx';
  if (fileName.endsWith('.csv')) {
    fileType = 'csv';
  } else if (fileName.endsWith('.xls')) {
    fileType = 'xls';
  } else if (fileName.endsWith('.xlsx')) {
    fileType = 'xlsx';
  } else {
    throw new Error('Unsupported file extension. Please upload a .xlsx, .xls, or .csv file.');
  }

  // Max file size: 25 MB for safety
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('File size exceeds the 25MB limit. Please upload a smaller spreadsheet.');
  }

  if (file.size === 0) {
    throw new Error('The uploaded file is empty (0 bytes).');
  }

  const arrayBuffer = await file.arrayBuffer();

  // Convert buffer to base64 for reliable caching/download
  const uint8 = new Uint8Array(arrayBuffer);
  let binary = '';
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  const rawBufferBase64 = btoa(binary);

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellDates: true,
      cellNF: true,
      cellText: true,
    });
  } catch (err: any) {
    throw new Error(`Failed to parse spreadsheet file: ${err?.message || 'Corrupted or unreadable Excel/CSV structure'}`);
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('No worksheets found in this spreadsheet.');
  }

  const sheets: WorksheetData[] = [];
  let totalRows = 0;
  let maxCols = 0;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Convert to 2D array matrix: (string | number | boolean | null)[][]
    const rawMatrix: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      blankrows: false,
    });

    if (rawMatrix.length === 0) {
      sheets.push({
        name: sheetName,
        headers: ['Column A'],
        rows: [],
        rowCount: 0,
        columnCount: 1,
        emptyCellsCount: 0,
      });
      continue;
    }

    // Determine headers from row 0, or generate A, B, C... if empty
    const firstRow = rawMatrix[0] || [];
    let detectedCols = Math.max(
      firstRow.length,
      ...rawMatrix.slice(1, 20).map((r) => (Array.isArray(r) ? r.length : 0)),
      1
    );

    const headers: string[] = [];
    for (let c = 0; c < detectedCols; c++) {
      const headerVal = firstRow[c];
      if (headerVal !== undefined && headerVal !== null && String(headerVal).trim() !== '') {
        headers.push(String(headerVal).trim());
      } else {
        headers.push(`Column ${getExcelColumnName(c + 1)}`);
      }
    }

    // Rows from index 1 downwards
    const dataRows = rawMatrix.slice(1).map((row) => {
      const formattedRow: (string | number | boolean | null)[] = [];
      for (let c = 0; c < headers.length; c++) {
        const val = row[c];
        if (val === undefined || val === null) {
          formattedRow.push(null);
        } else if (val instanceof Date) {
          formattedRow.push(val.toISOString().split('T')[0]);
        } else {
          formattedRow.push(val);
        }
      }
      return formattedRow;
    });

    // Count empty cells in data rows
    let emptyCells = 0;
    for (const r of dataRows) {
      for (const cell of r) {
        if (cell === null || cell === '' || cell === undefined) {
          emptyCells++;
        }
      }
    }

    const rowCount = dataRows.length;
    totalRows += rowCount;
    if (headers.length > maxCols) {
      maxCols = headers.length;
    }

    sheets.push({
      name: sheetName,
      headers,
      rows: dataRows,
      rowCount,
      columnCount: headers.length,
      emptyCellsCount: emptyCells,
    });
  }

  return {
    sheets,
    totalRows,
    maxCols,
    fileType,
    rawBufferBase64,
  };
}

/**
 * Excel column letter helper (1 -> A, 2 -> B, 27 -> AA...)
 */
export function getExcelColumnName(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter || 'A';
}

/**
 * Export spreadsheet data to XLSX Blob
 */
export function exportToXlsxBlob(record: SpreadsheetRecord): Blob {
  const wb = XLSX.utils.book_new();

  for (const sheet of record.sheets) {
    const sheetData = [sheet.headers, ...sheet.rows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31));
  }

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Export active worksheet to TSV clipboard text for instant 1-click pasting into Google Sheets
 */
export function formatWorksheetForClipboard(sheet: WorksheetData): string {
  const allRows = [sheet.headers, ...sheet.rows];
  return allRows
    .map((row) =>
      row
        .map((cell) => (cell === null || cell === undefined ? '' : String(cell).replace(/\t/g, ' ')))
        .join('\t')
    )
    .join('\n');
}

export const formatTableToTsv = formatWorksheetForClipboard;

/**
 * Export active worksheet to CSV Blob
 */
export function exportToCsvBlob(sheet: WorksheetData): Blob {
  const sheetData = [sheet.headers, ...sheet.rows];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const csvStr = XLSX.utils.sheet_to_csv(ws);
  return new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Trigger browser file download
 */
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generate built-in sample spreadsheets for quick testing
 */
export function createSampleSpreadsheet(type: 'financial' | 'inventory' | 'attendees' | 'employees'): File {
  let filename = 'Financial_Q3_Overview.xlsx';
  let sheets: { name: string; data: any[][] }[] = [];

  if (type === 'financial') {
    filename = 'Q3_Financial_Performance.xlsx';
    sheets = [
      {
        name: 'Revenue & Expenses',
        data: [
          ['Department', 'Quarter', 'Budget ($)', 'Actual Spend ($)', 'Variance ($)', 'Status'],
          ['Engineering', 'Q3 2026', 150000, 142300, 7700, 'Under Budget'],
          ['Marketing & Growth', 'Q3 2026', 85000, 89400, -4400, 'Over Budget'],
          ['Operations', 'Q3 2026', 62000, 58100, 3900, 'Under Budget'],
          ['Product Design', 'Q3 2026', 45000, 43900, 1100, 'Under Budget'],
          ['Customer Success', 'Q3 2026', 53000, 52400, 600, 'On Track'],
          ['Executive & Legal', 'Q3 2026', 70000, 68900, 1100, 'On Track'],
        ],
      },
      {
        name: 'Key Metrics',
        data: [
          ['Metric Name', 'Target', 'Actual', 'Growth YoY', 'Notes'],
          ['Monthly Recurring Revenue (MRR)', '$450,000', '$478,500', '+28.4%', 'Exceeded benchmark'],
          ['Net Revenue Retention (NRR)', '115%', '121%', '+6.0%', 'Strong expansion'],
          ['Customer Acquisition Cost (CAC)', '$1,200', '$980', '-18.3%', 'Organic surge'],
          ['Customer Churn Rate', '< 1.5%', '1.1%', '-0.4%', 'Healthy engagement'],
        ],
      },
    ];
  } else if (type === 'inventory') {
    filename = 'Global_Warehouse_Inventory.xlsx';
    sheets = [
      {
        name: 'Stock Levels',
        data: [
          ['SKU', 'Product Description', 'Category', 'Unit Price ($)', 'Stock on Hand', 'Reorder Level', 'Warehouse Location'],
          ['PRD-9901', 'Smart Wireless Barcode Scanner', 'Hardware', 129.99, 450, 100, 'Bay 4 - Seattle'],
          ['PRD-9902', 'Heavy Duty QR Code Label Printer', 'Hardware', 289.00, 85, 30, 'Bay 2 - Seattle'],
          ['PRD-9903', 'Glossy Thermal Label Roll (1000pk)', 'Supplies', 18.50, 1200, 300, 'Bay 7 - Austin'],
          ['PRD-9904', 'Industrial Rugged Tablet 10"', 'Hardware', 499.00, 64, 25, 'Bay 1 - Austin'],
          ['PRD-9905', 'USB-C High Speed Data Dock', 'Accessories', 45.00, 310, 50, 'Bay 3 - Chicago'],
          ['PRD-9906', 'RFID Smart Asset Tags (500pk)', 'Supplies', 74.00, 540, 150, 'Bay 5 - Chicago'],
        ],
      },
    ];
  } else if (type === 'attendees') {
    filename = 'TechSummit_2026_Attendee_List.xlsx';
    sheets = [
      {
        name: 'Confirmed Registrations',
        data: [
          ['Registration ID', 'Full Name', 'Company / Organization', 'Job Title', 'Ticket Type', 'Check-In Status', 'Dietary Pref'],
          ['REG-10491', 'Elena Rostova', 'Apex Cyber Solutions', 'VP of Engineering', 'VIP Pass', 'Confirmed', 'Vegetarian'],
          ['REG-10492', 'Marcus Chen', 'Vanguard Data Labs', 'Lead Architect', 'General Admission', 'Confirmed', 'None'],
          ['REG-10493', 'Sarah Jenkins', 'Aura Cloud Systems', 'Product Director', 'VIP Pass', 'Confirmed', 'Gluten-Free'],
          ['REG-10494', 'David Kim', 'Nexus Quantum AI', 'Founder & CEO', 'Speaker Pass', 'Confirmed', 'None'],
          ['REG-10495', 'Amara Okafor', 'Horizon Robotics', 'Staff Researcher', 'General Admission', 'Pending', 'Vegan'],
          ['REG-10496', 'Liam O\'Connor', 'Dublin Fintech Group', 'Head of Security', 'General Admission', 'Confirmed', 'None'],
        ],
      },
    ];
  } else {
    filename = 'Staff_Directory_2026.csv';
    sheets = [
      {
        name: 'Employees',
        data: [
          ['Employee ID', 'Name', 'Department', 'Role', 'Email', 'Location', 'Start Date'],
          ['EMP-001', 'Alex Morgan', 'Engineering', 'Staff Architect', 'alex.morgan@company.io', 'San Francisco, CA', '2022-03-15'],
          ['EMP-002', 'Jordan Taylor', 'Design', 'Principal Designer', 'jordan.t@company.io', 'New York, NY', '2021-08-01'],
          ['EMP-003', 'Maya Patel', 'Product', 'Senior PM', 'maya.patel@company.io', 'Austin, TX', '2023-01-10'],
          ['EMP-004', 'Lucas Silva', 'Customer Ops', 'Support Lead', 'lucas.s@company.io', 'Remote - Brazil', '2023-06-20'],
          ['EMP-005', 'Chloe Dubois', 'Finance', 'Financial Analyst', 'chloe.d@company.io', 'Remote - Canada', '2024-02-01'],
        ],
      },
    ];
  }

  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(s.data);
    XLSX.utils.book_append_sheet(wb, ws, s.name);
  }

  const wbout = XLSX.write(wb, { bookType: filename.endsWith('.csv') ? 'csv' : 'xlsx', type: 'array' });
  const mime = filename.endsWith('.csv') ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return new File([wbout], filename, { type: mime });
}
