import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Hash, Copy, Check, Calculator } from 'lucide-react';
import { WorksheetData } from '../../types/spreadsheet';
import { getExcelColumnName, formatTableToTsv } from '../../services/spreadsheetService';
import { useToast } from '../../context/ToastContext';

interface SpreadsheetTableProps {
  worksheet: WorksheetData;
  pageSize?: number;
}

export const SpreadsheetTable: React.FC<SpreadsheetTableProps> = ({ worksheet, pageSize: defaultPageSize = 50 }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColIndex, setSortColIndex] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [copiedTsv, setCopiedTsv] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter & sort rows
  const processedRows = useMemo(() => {
    let result = worksheet.rows.map((row, originalIndex) => ({
      row,
      originalRowIndex: originalIndex + 1,
    }));

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) =>
        item.row.some((cell) => cell !== null && cell !== undefined && String(cell).toLowerCase().includes(q))
      );
    }

    // Column sort
    if (sortColIndex !== null) {
      result.sort((a, b) => {
        const valA = a.row[sortColIndex];
        const valB = b.row[sortColIndex];

        if (valA === null || valA === undefined) return sortDirection === 'asc' ? 1 : -1;
        if (valB === null || valB === undefined) return sortDirection === 'asc' ? -1 : 1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return result;
  }, [worksheet.rows, searchQuery, sortColIndex, sortDirection]);

  // Numeric summary calculations for selected/active columns
  const numericStats = useMemo(() => {
    if (sortColIndex === null) return null;
    const headerName = worksheet.headers[sortColIndex];
    const numbers: number[] = [];

    processedRows.forEach((item) => {
      const v = item.row[sortColIndex];
      if (typeof v === 'number' && !isNaN(v)) {
        numbers.push(v);
      }
    });

    if (numbers.length === 0) return null;

    const sum = numbers.reduce((acc, curr) => acc + curr, 0);
    const avg = sum / numbers.length;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);

    return { headerName, count: numbers.length, sum, avg, min, max };
  }, [processedRows, sortColIndex, worksheet.headers]);

  // Pagination calculation
  const totalRows = processedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageRows = processedRows.slice(startIndex, startIndex + pageSize);

  const handleSort = (colIndex: number) => {
    navigator?.vibrate?.(10);
    if (sortColIndex === colIndex) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColIndex(null);
        setSortDirection('asc');
      }
    } else {
      setSortColIndex(colIndex);
      setSortDirection('asc');
    }
  };

  const handleCopyTsv = async () => {
    try {
      const activeSheetFiltered: WorksheetData = {
        name: worksheet.name,
        headers: worksheet.headers,
        rows: processedRows.map((r) => r.row),
        rowCount: processedRows.length,
        columnCount: worksheet.columnCount,
      };
      const tsv = formatTableToTsv(activeSheetFiltered);
      await navigator.clipboard.writeText(tsv);
      setCopiedTsv(true);
      navigator?.vibrate?.(15);
      showToast('success', 'Table Copied', `${processedRows.length} rows formatted as TSV for Excel/Google Sheets`);
      setTimeout(() => setCopiedTsv(false), 2000);
    } catch {
      showToast('error', 'Failed to copy TSV');
    }
  };

  return (
    <div className="spreadsheet-container">
      {/* Search & Filter Bar */}
      <div className="spreadsheet-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', width: '260px', maxWidth: '100%' }}>
            <Search
              size={15}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              ref={searchInputRef}
              type="text"
              className="input-field"
              placeholder="Search cells... (press /)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{ paddingLeft: '2rem', paddingRight: '2rem', height: '34px', fontSize: '0.825rem' }}
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  padding: '2px 4px',
                }}
              >
                ✕
              </button>
            ) : (
              <kbd
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '0.7rem',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                  pointerEvents: 'none',
                }}
              >
                /
              </kbd>
            )}
          </div>

          <button
            onClick={handleCopyTsv}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.775rem', padding: '0.35rem 0.65rem', height: '34px', gap: '0.35rem' }}
            title="Copy current table data as TSV (pasteable directly to Excel / Google Sheets)"
          >
            {copiedTsv ? <Check size={14} color="var(--primary)" /> : <Copy size={14} />}
            <span>{copiedTsv ? 'Copied' : 'Copy Table'}</span>
          </button>
        </div>

        {/* Stats and Page Size Control */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', width: '100%', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{totalRows > 0 ? startIndex + 1 : 0}</strong>-
            <strong style={{ color: 'var(--text-primary)' }}>{Math.min(startIndex + pageSize, totalRows)}</strong> of{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{totalRows}</strong> rows
            {searchQuery && ` (filtered from ${worksheet.rowCount})`}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)' }}>
              ↔ Swipe sideways
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '2px 6px',
                  fontSize: '0.8rem',
                }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Numeric Column Calculation Strip */}
      {numericStats && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.45rem 1rem',
            background: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '0.775rem',
            color: 'var(--text-secondary)',
            overflowX: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', fontWeight: 600 }}>
            <Calculator size={13} />
            <span>Col {numericStats.headerName}:</span>
          </div>
          <div>
            Sum: <strong style={{ color: 'var(--text-primary)' }}>{numericStats.sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
          </div>
          <div>
            Avg: <strong style={{ color: 'var(--text-primary)' }}>{numericStats.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
          </div>
          <div>
            Min: <strong style={{ color: 'var(--text-primary)' }}>{numericStats.min.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
          </div>
          <div>
            Max: <strong style={{ color: 'var(--text-primary)' }}>{numericStats.max.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
          </div>
          <div>
            Count: <strong style={{ color: 'var(--text-primary)' }}>{numericStats.count}</strong>
          </div>
        </div>
      )}

      {/* Spreadsheet Table with Sticky Header & Row Indices */}
      <div className="spreadsheet-table-wrapper">
        <table className="sheet-table">
          <thead>
            <tr>
              <th className="row-index-header">
                <Hash size={13} style={{ margin: '0 auto', color: 'var(--text-muted)' }} />
              </th>
              {worksheet.headers.map((header, colIdx) => {
                const isSorted = sortColIndex === colIdx;
                return (
                  <th
                    key={header + colIdx}
                    onClick={() => handleSort(colIdx)}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title={`Click to sort by ${header}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                          {getExcelColumnName(colIdx + 1)}
                        </span>
                        <span style={{ fontWeight: 600 }}>{header}</span>
                      </div>
                      <div style={{ color: isSorted ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {isSorted ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={12} />
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={worksheet.headers.length + 1} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  {searchQuery ? 'No matching cells found for your search query.' : 'This worksheet contains no data rows.'}
                </td>
              </tr>
            ) : (
              pageRows.map((item) => (
                <tr key={item.originalRowIndex}>
                  <td className="row-index-cell">{item.originalRowIndex}</td>
                  {worksheet.headers.map((_, colIdx) => {
                    const cellVal = item.row[colIdx];
                    const isEmpty = cellVal === null || cellVal === undefined || cellVal === '';
                    const isNumber = typeof cellVal === 'number';

                    return (
                      <td
                        key={colIdx}
                        title={isEmpty ? '' : String(cellVal)}
                        style={{
                          textAlign: isNumber ? 'right' : 'left',
                          color: isEmpty ? 'var(--text-muted)' : undefined,
                          fontFamily: isNumber ? 'var(--font-mono)' : undefined,
                        }}
                      >
                        {isEmpty ? (
                          <span style={{ fontStyle: 'italic', fontSize: '0.75rem', opacity: 0.5 }}>—</span>
                        ) : (
                          String(cellVal)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Page <strong style={{ color: 'var(--text-primary)' }}>{safePage}</strong> of{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              className="btn btn-outline btn-sm btn-icon"
              disabled={safePage <= 1}
              onClick={() => {
                navigator?.vibrate?.(10);
                setCurrentPage(1);
              }}
              title="First Page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              className="btn btn-outline btn-sm btn-icon"
              disabled={safePage <= 1}
              onClick={() => {
                navigator?.vibrate?.(10);
                setCurrentPage((p) => Math.max(1, p - 1));
              }}
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            <span style={{ padding: '0 0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {safePage} / {totalPages}
            </span>

            <button
              className="btn btn-outline btn-sm btn-icon"
              disabled={safePage >= totalPages}
              onClick={() => {
                navigator?.vibrate?.(10);
                setCurrentPage((p) => Math.min(totalPages, p + 1));
              }}
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
            <button
              className="btn btn-outline btn-sm btn-icon"
              disabled={safePage >= totalPages}
              onClick={() => {
                navigator?.vibrate?.(10);
                setCurrentPage(totalPages);
              }}
              title="Last Page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
