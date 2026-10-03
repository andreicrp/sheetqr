import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Clock, Ban, HelpCircle, FileX, ArrowLeft, Plus } from 'lucide-react';

interface ErrorStateProps {
  type: 'expired' | 'revoked' | 'exhausted' | 'not_found' | 'corrupted' | 'generic';
  title?: string;
  message?: string;
  actionText?: string;
  actionLink?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  type,
  title,
  message,
  actionText = 'Go to Home',
  actionLink = '/',
}) => {
  const getIcon = () => {
    switch (type) {
      case 'expired':
        return <Clock size={36} color="#f59e0b" />;
      case 'revoked':
        return <Ban size={36} color="#f43f5e" />;
      case 'exhausted':
        return <Ban size={36} color="#fb7185" />;
      case 'not_found':
        return <HelpCircle size={36} color="#38bdf8" />;
      case 'corrupted':
        return <FileX size={36} color="#f43f5e" />;
      default:
        return <AlertCircle size={36} color="#f43f5e" />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'expired':
        return 'This QR Code Has Expired';
      case 'revoked':
        return 'Access Revoked';
      case 'exhausted':
        return 'One-Time Link Already Used';
      case 'not_found':
        return 'Spreadsheet Not Found';
      case 'corrupted':
        return 'Unable to Read Spreadsheet';
      default:
        return 'Access Error';
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'expired':
        return 'The owner set a time limit on this QR code and the expiration window has passed.';
      case 'revoked':
        return 'The owner of this spreadsheet has permanently revoked access to this QR link.';
      case 'exhausted':
        return 'This QR code was configured for one-time access and has already been scanned by a recipient.';
      case 'not_found':
        return 'The requested QR token is invalid, misspelled, or has been removed.';
      case 'corrupted':
        return 'The spreadsheet file structure could not be parsed properly. Ensure it is a valid .xlsx or .csv.';
      default:
        return 'An unexpected error occurred while loading this spreadsheet.';
    }
  };

  return (
    <div
      className="card"
      style={{
        maxWidth: '28rem',
        margin: '4rem auto',
        textAlign: 'center',
        padding: '2.5rem 1.5rem',
      }}
    >
      <div
        style={{
          width: '4.5rem',
          height: '4.5rem',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem auto',
        }}
      >
        {getIcon()}
      </div>

      <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
        {title || getDefaultTitle()}
      </h2>

      <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.75rem' }}>
        {message || getDefaultMessage()}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <Link to={actionLink} className="btn btn-primary" style={{ width: '100%' }}>
          <ArrowLeft size={16} />
          <span>{actionText}</span>
        </Link>
        <Link to="/upload" className="btn btn-outline" style={{ width: '100%' }}>
          <Plus size={16} />
          <span>Upload New Spreadsheet</span>
        </Link>
      </div>
    </div>
  );
};
