import React from 'react';
import { Table, Layers } from 'lucide-react';
import { WorksheetData } from '../../types/spreadsheet';

interface SheetTabsProps {
  sheets: WorksheetData[];
  activeSheetIndex: number;
  onSelectSheet: (index: number) => void;
}

export const SheetTabs: React.FC<SheetTabsProps> = ({ sheets, activeSheetIndex, onSelectSheet }) => {
  if (sheets.length <= 1) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
        <Table size={16} color="#10b981" />
        <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{sheets[0]?.name || 'Sheet 1'}</span>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({sheets[0]?.rowCount || 0} rows)</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', maxWidth: '100%', paddingBottom: '2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.25rem' }}>
        <Layers size={14} />
        <span>Sheets:</span>
      </div>
      <div className="spreadsheet-tabs">
        {sheets.map((sheet, index) => {
          const isActive = index === activeSheetIndex;
          return (
            <button
              key={sheet.name + index}
              onClick={() => onSelectSheet(index)}
              className={`sheet-tab-btn ${isActive ? 'active' : ''}`}
            >
              <Table size={14} color={isActive ? '#10b981' : '#64748b'} />
              <span>{sheet.name}</span>
              <span
                style={{
                  fontSize: '0.725rem',
                  opacity: 0.7,
                  background: isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                  padding: '1px 5px',
                  borderRadius: '4px',
                }}
              >
                {sheet.rowCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
