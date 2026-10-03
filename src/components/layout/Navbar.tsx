import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { QrCode, FileSpreadsheet, Plus, QrCode as ScanIcon, Settings, FolderKanban, Home, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const Navbar: React.FC<{ onOpenScanner?: () => void }> = ({ onOpenScanner }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <header className="navbar">
        <div className="max-w-7xl navbar-inner">
          {/* Brand */}
          <Link to="/" className="brand-logo" title="SheetQR Homepage">
            <div className="brand-icon-box">
              <QrCode size={20} strokeWidth={2.4} />
            </div>
            <span style={{ letterSpacing: '-0.03em', fontSize: '1.2rem', fontWeight: 800 }}>
              Sheet<span style={{ color: 'var(--primary)' }}>QR</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="nav-links-desktop">
            <Link
              to="/upload"
              className={`nav-link ${isActive('/upload') ? 'active' : ''}`}
              style={{ color: isActive('/upload') ? 'var(--primary)' : undefined }}
            >
              <Plus size={16} />
              <span>Upload</span>
            </Link>

            <Link
              to="/dashboard"
              className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              style={{ color: isActive('/dashboard') ? 'var(--primary)' : undefined }}
            >
              <FolderKanban size={16} />
              <span>My Spreadsheets</span>
            </Link>

            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                className="nav-link"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                title="Scan QR Code"
              >
                <ScanIcon size={16} />
                <span>Scan QR</span>
              </button>
            )}

            <Link
              to="/settings"
              className={`nav-link ${isActive('/settings') ? 'active' : ''}`}
              style={{ color: isActive('/settings') ? 'var(--primary)' : undefined }}
              title="Settings & Google API"
            >
              <Settings size={16} />
              <span>Settings</span>
            </Link>
          </nav>

          {/* Quick Header CTA & Theme Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Pitch Black Dark Mode'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} color="var(--primary)" /> : <Moon size={18} color="var(--primary)" />}
            </button>

            <Link to="/upload" className="btn btn-primary btn-sm">
              <FileSpreadsheet size={15} />
              <span className="hidden-mobile" style={{ display: 'inline' }}>New Sheet</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar with Centered Circular Scan Button */}
      <nav className="mobile-bottom-nav">
        <Link to="/" className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}>
          <Home size={19} color={isActive('/') ? 'var(--primary)' : 'var(--text-secondary)'} />
          <span>Home</span>
        </Link>

        <Link to="/upload" className={`mobile-nav-item ${isActive('/upload') ? 'active' : ''}`}>
          <Plus size={19} color={isActive('/upload') ? 'var(--primary)' : 'var(--text-secondary)'} />
          <span>Upload</span>
        </Link>

        {/* Prominent Circular Center Action */}
        {onOpenScanner && (
          <button
            onClick={onOpenScanner}
            className="mobile-nav-scan-wrapper"
            title="Scan QR Code"
          >
            <div className="mobile-nav-scan-circle">
              <ScanIcon size={24} strokeWidth={2.4} />
            </div>
            <span className="mobile-nav-scan-label">Scan QR</span>
          </button>
        )}

        <Link to="/dashboard" className={`mobile-nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
          <FolderKanban size={19} color={isActive('/dashboard') ? 'var(--primary)' : 'var(--text-secondary)'} />
          <span>My Sheets</span>
        </Link>

        <Link to="/settings" className={`mobile-nav-item ${isActive('/settings') ? 'active' : ''}`}>
          <Settings size={19} color={isActive('/settings') ? 'var(--primary)' : 'var(--text-secondary)'} />
          <span>Settings</span>
        </Link>
      </nav>
    </>
  );
};
