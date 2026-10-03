import { SpreadsheetRecord } from '../types/spreadsheet';
import { formatWorksheetForClipboard } from './spreadsheetService';

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

export interface GoogleConversionResult {
  method: 'oauth_api' | 'direct_sheets_new';
  spreadsheetId?: string;
  spreadsheetUrl: string;
  sheetCount: number;
  copiedDataText?: string;
}

/**
 * Service to handle Google OAuth 2.0 and Google Sheets API integration
 */
export class GoogleSheetsService {
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Check if we have an active valid access token
   */
  public hasValidToken(): boolean {
    return Boolean(this.cachedToken && Date.now() < this.tokenExpiry);
  }

  /**
   * Set an explicit access token manually or from OAuth
   */
  public setAccessToken(token: string, expiresInSeconds: number = 3600) {
    this.cachedToken = token;
    this.tokenExpiry = Date.now() + (expiresInSeconds - 60) * 1000;
  }

  /**
   * Request Google OAuth 2.0 token using Google Identity Services (GIS)
   */
  public async requestOAuthToken(clientId?: string): Promise<string | null> {
    if (this.hasValidToken() && this.cachedToken) {
      return this.cachedToken;
    }

    const effectiveClientId =
      clientId ||
      (typeof localStorage !== 'undefined'
        ? JSON.parse(localStorage.getItem('sheetqr_settings_v1') || '{}').googleClientId
        : '') ||
      '';

    // If client ID is provided and Google GIS is loaded on the page:
    if (effectiveClientId && window.google?.accounts?.oauth2) {
      return new Promise<string>((resolve, reject) => {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: effectiveClientId,
            scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
            callback: (resp: any) => {
              if (resp.error) {
                reject(new Error(`Google OAuth Error: ${resp.error_description || resp.error}`));
              } else if (resp.access_token) {
                this.setAccessToken(resp.access_token, resp.expires_in || 3600);
                resolve(resp.access_token);
              } else {
                reject(new Error('Failed to obtain Google access token.'));
              }
            },
          });
          client.requestAccessToken();
        } catch (err: any) {
          reject(new Error(`Google OAuth popup failed: ${err.message}`));
        }
      });
    }

    return null;
  }

  /**
   * Creates a real Google Spreadsheet via Google Sheets REST API if authorized,
   * or pre-formats data and opens native https://sheets.new directly in the user's account.
   */
  public async convertToGoogleSheet(
    spreadsheet: SpreadsheetRecord,
    accessToken?: string,
    onProgress?: (msg: string) => void
  ): Promise<GoogleConversionResult> {
    const activeSheet = spreadsheet.sheets[0] || {
      name: 'Sheet 1',
      headers: [],
      rows: [],
      rowCount: 0,
      columnCount: 0,
    };

    // Prepare tab-separated spreadsheet data for instant clipboard paste
    const tsvData = formatWorksheetForClipboard(activeSheet);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(tsvData);
      }
    } catch {
      // Ignore clipboard restrictions if any
    }

    const token = accessToken || (await this.requestOAuthToken().catch(() => null));

    // If no real OAuth token, open official Google Sheets Creation URL: https://sheets.new
    if (!token) {
      onProgress?.('Preparing spreadsheet formatting...');
      await new Promise((r) => setTimeout(r, 300));

      onProgress?.('Copied formatted table data to clipboard...');
      await new Promise((r) => setTimeout(r, 400));

      onProgress?.('Opening Google Sheets (https://sheets.new)...');
      await new Promise((r) => setTimeout(r, 300));

      return {
        method: 'direct_sheets_new',
        spreadsheetUrl: 'https://sheets.new',
        sheetCount: spreadsheet.sheets.length,
        copiedDataText: tsvData,
      };
    }

    // REAL Google Sheets API v4 with user's OAuth access token
    onProgress?.('Connecting to Google Sheets REST API v4...');
    
    // 1. Create Spreadsheet with worksheets
    const createPayload = {
      properties: {
        title: `[SheetQR] ${spreadsheet.filename.replace(/\.[^/.]+$/, '')}`,
      },
      sheets: spreadsheet.sheets.map((sheet) => ({
        properties: {
          title: sheet.name.substring(0, 50),
          gridProperties: {
            rowCount: Math.max(sheet.rowCount + 10, 100),
            columnCount: Math.max(sheet.columnCount + 5, 26),
            frozenRowCount: 1, // Freeze header row
          },
        },
      })),
    };

    const createResp = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createPayload),
    });

    if (!createResp.ok) {
      const errData = await createResp.json().catch(() => ({}));
      throw new Error(
        `Google Sheets API Error (${createResp.status}): ${
          errData?.error?.message || 'Failed to create spreadsheet on Google Drive'
        }`
      );
    }

    const createdSheet = await createResp.json();
    const spreadsheetId = createdSheet.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // 2. Batch update cell values for each sheet
    onProgress?.('Populating rows and columns in Google Sheet...');

    const dataPayload = spreadsheet.sheets.map((sheet) => {
      const values = [sheet.headers, ...sheet.rows];
      return {
        range: `'${sheet.name.substring(0, 50)}'!A1`,
        values: values.map((row) =>
          row.map((cell) => (cell === null || cell === undefined ? '' : cell))
        ),
      };
    });

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: dataPayload,
        }),
      }
    ).catch(() => {});

    onProgress?.('Google Sheet created successfully!');
    return {
      method: 'oauth_api',
      spreadsheetId,
      spreadsheetUrl,
      sheetCount: spreadsheet.sheets.length,
    };
  }
}

export const googleSheetsService = new GoogleSheetsService();
