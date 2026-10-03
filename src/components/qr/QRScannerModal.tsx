import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  Camera,
  Keyboard,
  ArrowRight,
  UploadCloud,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  VideoOff,
  SwitchCamera,
  Zap,
  ZapOff,
} from 'lucide-react';
import { storageService } from '../../services/storageService';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ScanMode = 'camera' | 'text';

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ScanMode>('camera');
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeLinks = storageService.getShareLinks().filter((l) => l.status === 'active');

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setTorchOn(false);
    setHasTorch(false);
    setIsScanning(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && (track.getCapabilities as any)?.().torch) {
      const nextState = !torchOn;
      try {
        await (track.applyConstraints as any)({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
        navigator?.vibrate?.(10);
      } catch (err) {
        console.warn('Could not toggle flashlight:', err);
      }
    }
  };

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      if (track && (track.getCapabilities as any)?.().torch) {
        setHasTorch(true);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      // Check for native BarcodeDetector API
      const BarcodeDetectorClass = (window as any).BarcodeDetector;
      if (BarcodeDetectorClass) {
        const barcodeDetector = new BarcodeDetectorClass({ formats: ['qr_code'] });
        scanIntervalRef.current = window.setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const scannedRaw = barcodes[0].rawValue;
                if (scannedRaw) {
                  navigator?.vibrate?.([30, 50, 30]);
                  stopCamera();
                  handleNavigate(scannedRaw);
                }
              }
            } catch (e) {
              // Ignore frame detection failures
            }
          }
        }, 300);
      }
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setIsScanning(false);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. Please allow camera access in browser settings, or use Text/Token mode.'
          : err.message || 'Unable to access camera.'
      );
    }
  };

  useEffect(() => {
    if (isOpen && mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, mode, facingMode]);

  if (!isOpen) return null;

  const handleNavigate = (tokenOrUrl: string) => {
    setError(null);
    let token = tokenOrUrl.trim();

    // Extract token if full URL was pasted/scanned
    if (token.includes('/s/')) {
      const parts = token.split('/s/');
      token = parts[parts.length - 1].split('?')[0].split('#')[0].trim();
    }

    if (!token) {
      setError('Please enter or scan a valid QR code/token');
      return;
    }

    navigator?.vibrate?.(20);
    stopCamera();
    onClose();
    navigate(`/s/${token}`);
  };

  const decodeImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const BarcodeDetectorClass = (window as any).BarcodeDetector;
        if (BarcodeDetectorClass) {
          try {
            const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
            const codes = await detector.detect(img);
            if (codes && codes.length > 0) {
              handleNavigate(codes[0].rawValue);
              return;
            }
          } catch {}
        }
        setError('Could not detect a valid QR code in the uploaded image.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      decodeImage(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      decodeImage(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '30rem', padding: '1.25rem', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                flexShrink: 0,
              }}
            >
              <QrCode size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Scan QR Code
              </h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                Open a shared spreadsheet
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '1.25rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Mode Selector Tabs (Camera vs Text) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.4rem',
            background: 'var(--bg-subtle)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => setMode('camera')}
            className={`btn btn-sm ${mode === 'camera' ? 'btn-primary' : 'btn-outline'}`}
            style={{
              border: 'none',
              gap: '0.4rem',
              boxShadow: mode === 'camera' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <Camera size={16} />
            <span>Live Camera</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('text')}
            className={`btn btn-sm ${mode === 'text' ? 'btn-primary' : 'btn-outline'}`}
            style={{
              border: 'none',
              gap: '0.4rem',
              boxShadow: mode === 'text' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <Keyboard size={16} />
            <span>Text / Token</span>
          </button>
        </div>

        {/* 📷 CAMERA OPTION */}
        {mode === 'camera' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDrop}
          >
            {cameraError ? (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.08)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem 1rem',
                  textAlign: 'center',
                  width: '100%',
                  marginBottom: '1rem',
                }}
              >
                <VideoOff size={36} color="var(--accent-rose)" style={{ margin: '0 auto 0.75rem auto' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-rose)' }}>Camera Unavailable</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', marginBottom: '1rem' }}>
                  {cameraError}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button type="button" onClick={startCamera} className="btn btn-secondary btn-sm">
                    <RefreshCw size={14} />
                    <span>Try Again</span>
                  </button>
                  <button type="button" onClick={() => setMode('text')} className="btn btn-primary btn-sm">
                    <Keyboard size={14} />
                    <span>Use Text / Token</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '320px',
                  aspectRatio: '1',
                  background: '#000000',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  border: isDraggingOver ? '2px dashed var(--primary)' : '2px solid var(--border-default)',
                  boxShadow: 'var(--shadow-md)',
                  marginBottom: '1rem',
                }}
              >
                <video
                  ref={videoRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  autoPlay
                  playsInline
                  muted
                />

                {/* Viewfinder Target Box Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: '18%',
                    border: '2px dashed #10b981',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Glowing Laser Scan Line */}
                  <div
                    style={{
                      width: '100%',
                      height: '2px',
                      background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
                      boxShadow: '0 0 8px #10b981',
                    }}
                    className="animate-pulse-slow"
                  />
                </div>

                {/* Controls in camera viewport */}
                <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                  {hasTorch && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className="btn btn-secondary btn-sm btn-icon"
                      style={{
                        borderRadius: '50%',
                        background: torchOn ? 'var(--primary)' : 'rgba(15, 23, 42, 0.85)',
                        color: torchOn ? '#ffffff' : 'var(--text-primary)',
                        backdropFilter: 'blur(4px)',
                      }}
                      title={torchOn ? 'Turn Flashlight Off' : 'Turn Flashlight On'}
                    >
                      {torchOn ? <ZapOff size={16} /> : <Zap size={16} />}
                    </button>
                  )}

                  {/* Flip Camera Button */}
                  <button
                    type="button"
                    onClick={() => {
                      navigator?.vibrate?.(10);
                      setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
                    }}
                    className="btn btn-secondary btn-sm btn-icon"
                    style={{
                      borderRadius: '50%',
                      background: 'rgba(15, 23, 42, 0.85)',
                      color: 'var(--text-primary)',
                      backdropFilter: 'blur(4px)',
                    }}
                    title="Switch Camera (Front/Back)"
                  >
                    <SwitchCamera size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Upload QR screenshot / image fallback */}
            <div style={{ width: '100%', textAlign: 'center' }}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-outline btn-sm"
                style={{ width: '100%', fontSize: '0.8rem', gap: '0.4rem' }}
              >
                <UploadCloud size={15} />
                <span>Upload or Drop QR Image</span>
              </button>
            </div>
          </div>
        )}

        {/* ✍️ TEXT / TOKEN OPTION */}
        {mode === 'text' && (
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNavigate(tokenInput);
              }}
              style={{ marginBottom: '1.25rem' }}
            >
              <label className="input-label">Enter Token or Scanned URL</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 8F4K92XQ or https://.../s/8F4K92XQ"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 1rem', flexShrink: 0 }}>
                  <ArrowRight size={18} />
                </button>
              </div>
              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: '#f43f5e',
                    fontSize: '0.8rem',
                    marginTop: '0.4rem',
                  }}
                >
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}
            </form>

            {/* Quick Simulation List for Active Links in Browser */}
            {activeLinks.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Quick Jump to Active QR Codes:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '160px', overflowY: 'auto' }}>
                  {activeLinks.slice(0, 4).map((link) => {
                    const sheet = storageService.getSpreadsheet(link.spreadsheetId);
                    return (
                      <button
                        key={link.id}
                        type="button"
                        onClick={() => handleNavigate(link.token)}
                        className="btn btn-outline btn-sm"
                        style={{
                          justifyContent: 'space-between',
                          textAlign: 'left',
                          padding: '0.55rem 0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                          <FileSpreadsheet size={14} color="var(--primary)" />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                            {sheet?.filename || 'Spreadsheet'}
                          </span>
                        </div>
                        <span className="badge badge-slate" style={{ fontFamily: 'var(--font-mono)' }}>
                          {link.token}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
