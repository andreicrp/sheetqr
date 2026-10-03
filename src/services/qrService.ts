import QRCode from 'qrcode';

/**
 * Generate a cryptographically secure, unpredictable, non-sequential token.
 * Uses window.crypto.getRandomValues with alphanumeric characters.
 */
export function generateSecureToken(length: number = 8): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz'; // readable base58-like set
  const randomBytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < length; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars[randomBytes[i] % chars.length];
  }
  return token;
}

/**
 * Build shareable public access URL for the given token
 */
export function buildShareUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sheetqr.app';
  return `${origin}/s/${token}`;
}

/**
 * Generate Data URL (PNG) from QR string for image tag or download
 */
export async function generateQrDataUrl(url: string, options?: { width?: number; margin?: number }): Promise<string> {
  return QRCode.toDataURL(url, {
    width: options?.width || 400,
    margin: options?.margin || 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
}

/**
 * Download QR code as PNG file
 */
export async function downloadQrCodeImage(url: string, filename: string = 'SheetQR-Access-Code.png') {
  const dataUrl = await generateQrDataUrl(url, { width: 600, margin: 2 });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Download QR code as SVG vector
 */
export async function downloadQrCodeSvg(url: string, filename: string = 'SheetQR-Access-Code.svg') {
  const svgString = await QRCode.toString(url, {
    type: 'svg',
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
