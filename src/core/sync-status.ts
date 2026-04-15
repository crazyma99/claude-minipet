import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SYNC_STATUS_FILE = join(homedir(), '.claude-minipet', 'sync-status.json');

export interface SyncStatus {
  connected: boolean;
  lastSyncTime: string;  // ISO timestamp
  lastError?: string;
  latestVersion?: string;
  needsUpdate?: boolean;
}

/** Save sync status after each sync attempt */
export function saveSyncStatus(connected: boolean, error?: string, latestVersion?: string, needsUpdate?: boolean): void {
  const data: SyncStatus = {
    connected,
    lastSyncTime: new Date().toISOString(),
    lastError: error,
    latestVersion,
    needsUpdate,
  };
  try {
    writeFileSync(SYNC_STATUS_FILE, JSON.stringify(data), 'utf-8');
  } catch {
    // ignore
  }
}

/** Load last sync status */
export function loadSyncStatus(): SyncStatus | null {
  try {
    return JSON.parse(readFileSync(SYNC_STATUS_FILE, 'utf-8')) as SyncStatus;
  } catch {
    return null;
  }
}
