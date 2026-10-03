import { SpreadsheetRecord, ShareLink, AccessLog, GoogleExportRecord } from '../types/spreadsheet';
import { generateSecureToken } from './qrService';

const SPREADSHEETS_KEY = 'sheetqr_spreadsheets_v1';
const SHARE_LINKS_KEY = 'sheetqr_share_links_v1';
const ACCESS_LOGS_KEY = 'sheetqr_access_logs_v1';
const GOOGLE_EXPORTS_KEY = 'sheetqr_google_exports_v1';
const SETTINGS_KEY = 'sheetqr_settings_v1';

export interface AppSettings {
  defaultExpirationDays: number;
  requirePasswordByDefault: boolean;
  allowDownloadByDefault: boolean;
  allowGoogleSheetsByDefault: boolean;
  googleClientId: string;
  autoOpenConvertedSheet: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultExpirationDays: 7,
  requirePasswordByDefault: false,
  allowDownloadByDefault: true,
  allowGoogleSheetsByDefault: true,
  googleClientId: '',
  autoOpenConvertedSheet: true,
};

/**
 * Storage Service for managing spreadsheets, share links, access logs, and settings.
 */
class StorageService {
  private getItem<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage save failed (possibly quota exceeded):', e);
    }
  }

  // SPREADSHEETS
  public getAllSpreadsheets(): SpreadsheetRecord[] {
    const list = this.getItem<SpreadsheetRecord[]>(SPREADSHEETS_KEY, []);
    return list.filter((s) => s.status !== 'deleted');
  }

  public getSpreadsheet(id: string): SpreadsheetRecord | null {
    const list = this.getAllSpreadsheets();
    return list.find((s) => s.id === id) || null;
  }

  public saveSpreadsheet(record: SpreadsheetRecord): void {
    const list = this.getItem<SpreadsheetRecord[]>(SPREADSHEETS_KEY, []);
    const index = list.findIndex((s) => s.id === record.id);
    if (index >= 0) {
      list[index] = record;
    } else {
      list.unshift(record);
    }
    this.setItem(SPREADSHEETS_KEY, list);
  }

  public deleteSpreadsheet(id: string): void {
    const list = this.getItem<SpreadsheetRecord[]>(SPREADSHEETS_KEY, []);
    const updated = list.map((s) => (s.id === id ? { ...s, status: 'deleted' as const } : s));
    this.setItem(SPREADSHEETS_KEY, updated);

    // Also revoke associated share links
    const shareLinks = this.getShareLinksForSpreadsheet(id);
    for (const link of shareLinks) {
      this.revokeShareLink(link.id);
    }
  }

  // SHARE LINKS
  public getShareLinks(): ShareLink[] {
    return this.getItem<ShareLink[]>(SHARE_LINKS_KEY, []);
  }

  public getShareLinksForSpreadsheet(spreadsheetId: string): ShareLink[] {
    return this.getShareLinks().filter((l) => l.spreadsheetId === spreadsheetId);
  }

  public getShareLinkByToken(token: string): ShareLink | null {
    const links = this.getShareLinks();
    return links.find((l) => l.token.toLowerCase() === token.toLowerCase()) || null;
  }

  public createShareLink(
    spreadsheetId: string,
    options: {
      expiresInDays?: number | null;
      password?: string;
      oneTime?: boolean;
      allowDownload?: boolean;
      allowGoogleSheets?: boolean;
    } = {}
  ): ShareLink {
    const now = new Date();
    let expiresAt: string | null = null;
    if (options.expiresInDays && options.expiresInDays > 0) {
      const expDate = new Date(now.getTime() + options.expiresInDays * 24 * 60 * 60 * 1000);
      expiresAt = expDate.toISOString();
    }

    const token = generateSecureToken(8);
    const newLink: ShareLink = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'link_' + Math.random().toString(36).substring(2, 9),
      spreadsheetId,
      token,
      createdAt: now.toISOString(),
      expiresAt,
      revokedAt: null,
      passwordHash: options.password ? this.simpleHash(options.password) : null,
      hasPassword: Boolean(options.password && options.password.trim().length > 0),
      oneTime: Boolean(options.oneTime),
      accessCount: 0,
      allowDownload: options.allowDownload ?? true,
      allowGoogleSheets: options.allowGoogleSheets ?? true,
      status: 'active',
    };

    const links = this.getShareLinks();
    links.unshift(newLink);
    this.setItem(SHARE_LINKS_KEY, links);

    this.logAccessEvent(spreadsheetId, 'qr_generated', token, 'QR Share Link Created');
    return newLink;
  }

  public updateShareLink(link: ShareLink): void {
    const links = this.getShareLinks();
    const index = links.findIndex((l) => l.id === link.id);
    if (index >= 0) {
      links[index] = link;
      this.setItem(SHARE_LINKS_KEY, links);
    }
  }

  public revokeShareLink(shareLinkId: string): void {
    const links = this.getShareLinks();
    const link = links.find((l) => l.id === shareLinkId);
    if (link) {
      link.status = 'revoked';
      link.revokedAt = new Date().toISOString();
      this.setItem(SHARE_LINKS_KEY, links);
      this.logAccessEvent(link.spreadsheetId, 'qr_revoked', link.token, 'QR Access revoked by owner');
    }
  }

  public recordLinkAccess(shareLink: ShareLink): ShareLink {
    shareLink.accessCount += 1;
    if (shareLink.oneTime && shareLink.accessCount >= 1) {
      shareLink.status = 'exhausted';
    }
    this.updateShareLink(shareLink);
    this.logAccessEvent(shareLink.spreadsheetId, 'qr_accessed', shareLink.token, `Scan/Access #${shareLink.accessCount}`);
    return shareLink;
  }

  // ACCESS LOGS
  public getAccessLogs(spreadsheetId?: string): AccessLog[] {
    const logs = this.getItem<AccessLog[]>(ACCESS_LOGS_KEY, []);
    if (spreadsheetId) {
      return logs.filter((l) => l.spreadsheetId === spreadsheetId);
    }
    return logs;
  }

  public logAccessEvent(
    spreadsheetId: string,
    eventType: AccessLog['eventType'],
    shareToken?: string,
    details?: string
  ): void {
    const newLog: AccessLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      spreadsheetId,
      shareToken,
      eventType,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      details,
    };

    const logs = this.getItem<AccessLog[]>(ACCESS_LOGS_KEY, []);
    logs.unshift(newLog);
    // Keep max 200 logs
    if (logs.length > 200) {
      logs.length = 200;
    }
    this.setItem(ACCESS_LOGS_KEY, logs);
  }

  // GOOGLE EXPORTS
  public getGoogleExports(spreadsheetId?: string): GoogleExportRecord[] {
    const list = this.getItem<GoogleExportRecord[]>(GOOGLE_EXPORTS_KEY, []);
    if (spreadsheetId) {
      return list.filter((e) => e.spreadsheetId === spreadsheetId);
    }
    return list;
  }

  public recordGoogleExport(record: GoogleExportRecord): void {
    const list = this.getItem<GoogleExportRecord[]>(GOOGLE_EXPORTS_KEY, []);
    list.unshift(record);
    this.setItem(GOOGLE_EXPORTS_KEY, list);
    this.logAccessEvent(
      record.spreadsheetId,
      'google_conversion_completed',
      undefined,
      `Exported to Google Sheets: ${record.googleSpreadsheetId}`
    );
  }

  // SETTINGS
  public getSettings(): AppSettings {
    return { ...DEFAULT_SETTINGS, ...this.getItem<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS) };
  }

  public saveSettings(settings: Partial<AppSettings>): AppSettings {
    const updated = { ...this.getSettings(), ...settings };
    this.setItem(SETTINGS_KEY, updated);
    return updated;
  }

  // Helper for password hash
  public simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return 'h_' + Math.abs(hash).toString(36);
  }

  public verifyPassword(input: string, targetHash?: string | null): boolean {
    if (!targetHash) return true;
    return this.simpleHash(input) === targetHash;
  }
}

export const storageService = new StorageService();
