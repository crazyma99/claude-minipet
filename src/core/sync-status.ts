import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SYNC_STATUS_FILE = join(homedir(), '.claude-minipet', 'sync-status.json');
const EVENTS_DIR = join(homedir(), '.claude-minipet', 'events');
const FAILURE_THRESHOLD = 3;

export interface SyncStatus {
  connected: boolean;
  lastSyncTime: string;       // ISO timestamp of last successful sync
  lastAttemptTime: string;    // ISO timestamp of last attempt (success or fail)
  consecutiveFailures: number;
  lastError?: string;
  latestVersion?: string;
  needsUpdate?: boolean;
}

export interface SyncEvent {
  type: 'sync_result';
  ok: boolean;
  error?: string;
  timestamp: string;  // ISO
}

/** Save sync status — only called by daemon (single writer) */
export function saveSyncStatus(status: SyncStatus): void {
  try {
    writeFileSync(SYNC_STATUS_FILE, JSON.stringify(status), 'utf-8');
  } catch { /* ignore */ }
}

/** Load last sync status (fills defaults for fields missing in old format) */
export function loadSyncStatus(): SyncStatus | null {
  try {
    const raw = JSON.parse(readFileSync(SYNC_STATUS_FILE, 'utf-8'));
    return {
      connected: raw.connected ?? false,
      lastSyncTime: raw.lastSyncTime ?? '',
      lastAttemptTime: raw.lastAttemptTime ?? raw.lastSyncTime ?? '',
      consecutiveFailures: raw.consecutiveFailures ?? 0,
      lastError: raw.lastError,
      latestVersion: raw.latestVersion,
      needsUpdate: raw.needsUpdate,
    };
  } catch {
    return null;
  }
}

/** Write a sync event to the inbox (called by hook handler, synchronous) */
export function writeSyncEvent(event: SyncEvent): void {
  try {
    mkdirSync(EVENTS_DIR, { recursive: true });
    const filename = `${Date.now()}-${process.pid}.json`;
    writeFileSync(join(EVENTS_DIR, filename), JSON.stringify(event), 'utf-8');
  } catch { /* ignore */ }
}

/** Consume sync events from inbox, discarding stale ones (called by daemon on each tick) */
export function consumeSyncEvents(): SyncEvent[] {
  const events: SyncEvent[] = [];
  const maxAgeMs = 5 * 60 * 1000; // Discard events older than 5 minutes
  const cutoff = Date.now() - maxAgeMs;
  try {
    const files = readdirSync(EVENTS_DIR).filter(f => f.endsWith('.json')).sort();
    for (const file of files) {
      const filepath = join(EVENTS_DIR, file);
      try {
        const data = JSON.parse(readFileSync(filepath, 'utf-8')) as SyncEvent;
        // Skip stale events (check timestamp from filename prefix or event data)
        const eventTime = new Date(data.timestamp).getTime();
        if (eventTime >= cutoff) {
          events.push(data);
        }
      } catch { /* corrupt file, skip */ }
      try { unlinkSync(filepath); } catch { /* ignore */ }
    }
  } catch { /* events dir doesn't exist yet, return empty */ }
  return events;
}

/** Compute new connection status from current state + new results (threshold logic) */
export function computeConnectionStatus(
  current: SyncStatus | null,
  results: Array<{ ok: boolean; error?: string }>,
  versionInfo?: { latestVersion?: string; needsUpdate?: boolean },
): SyncStatus {
  const now = new Date().toISOString();
  let consecutiveFailures = current?.consecutiveFailures ?? 0;
  let lastSyncTime = current?.lastSyncTime ?? now;
  let lastError = current?.lastError;

  for (const r of results) {
    if (r.ok) {
      consecutiveFailures = 0;
      lastSyncTime = now;
      lastError = undefined;
    } else {
      consecutiveFailures++;
      lastError = r.error;
    }
  }

  return {
    connected: consecutiveFailures < FAILURE_THRESHOLD,
    lastSyncTime,
    lastAttemptTime: now,
    consecutiveFailures,
    lastError,
    latestVersion: versionInfo?.latestVersion ?? current?.latestVersion,
    needsUpdate: versionInfo?.needsUpdate ?? current?.needsUpdate,
  };
}
