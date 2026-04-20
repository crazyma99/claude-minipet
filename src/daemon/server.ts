import { loadState, saveState } from '../core/pet.js';
import { checkEvolution, applyEvolution } from '../core/evolution.js';
import { triggerAnim } from '../render/anim-state.js';
import { syncPetToServer, sendHeartbeat, loadAuth } from '../core/sync.js';
import { loadSyncStatus, saveSyncStatus, consumeSyncEvents, computeConnectionStatus } from '../core/sync-status.js';
import { saveBubble } from '../render/bubble.js';
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { killAllDaemons, isWin } from '../core/platform.js';
import type { PetState } from '../core/types.js';

const require = createRequire(import.meta.url);
const PKG_VERSION: string = (() => {
  try {
    const pkg = require('../../package.json');
    return pkg.version ?? 'unknown';
  } catch { return 'unknown'; }
})();

const PID_FILE = join(homedir(), '.claude-minipet', 'daemon.pid');
const DECAY_INTERVAL_MS = 60 * 1000; // Check every minute
const HUNGER_DECAY_PER_HOUR = 5;
const MOOD_DECAY_PER_HOUR = 3;
const MOOD_DECAY_HUNGER_THRESHOLD = 30;

/** Write PID file */
function writePid(): void {
  writeFileSync(PID_FILE, String(process.pid), 'utf-8');
}

/** Check if daemon is already running (cross-platform) */
export function isDaemonRunning(): boolean {
  if (!existsSync(PID_FILE)) return false;
  try {
    const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim());
    if (!pid) return false;
    if (isWin) {
      // tasklist exits 0 even if no match; check output for the PID
      const out = execSync(`tasklist /FI "PID eq ${pid}" /NH /FO CSV`, { encoding: 'utf-8', timeout: 3000 }).trim();
      return out.includes(String(pid));
    }
    // Unix: signal 0 checks process existence
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Get daemon PID */
export function getDaemonPid(): number | null {
  if (!existsSync(PID_FILE)) return null;
  try {
    return parseInt(readFileSync(PID_FILE, 'utf-8').trim());
  } catch {
    return null;
  }
}

/** Apply time-based decay to pet stats */
function applyDecay(): void {
  const state = loadState();
  if (!state) return;

  // Always sync (consume events + heartbeat) regardless of decay timing
  syncTick(state);

  const now = Date.now();
  const lastInteraction = new Date(state.lastInteraction).getTime();
  const minutesSinceInteraction = (now - lastInteraction) / 60000;

  // Only decay if some time has passed
  if (minutesSinceInteraction < 1) return;

  // Hunger decay: -5 per hour → -5/60 per minute
  const hungerDecay = (HUNGER_DECAY_PER_HOUR / 60) * Math.min(minutesSinceInteraction, 60);
  state.hunger = Math.max(0, state.hunger - hungerDecay);

  // Trigger hungry animation when food drops below threshold
  if (state.hunger < 20) {
    triggerAnim('hungry');
  } else if (state.mood < 30) {
    triggerAnim('sad');
  }

  // Mood decay when hungry
  if (state.hunger < MOOD_DECAY_HUNGER_THRESHOLD) {
    // Pixiebot has slower mood decay
    const moodMultiplier = state.species === 'pixiebot' ? 0.5 : 1;
    const moodDecay = (MOOD_DECAY_PER_HOUR / 60) * Math.min(minutesSinceInteraction, 60) * moodMultiplier;
    state.mood = Math.max(0, state.mood - moodDecay);
  }

  // Check evolution conditions periodically
  const evoCandidate = checkEvolution(state);
  if (evoCandidate && evoCandidate !== state.evolution) {
    applyEvolution(state, evoCandidate);
  }

  saveState(state);
}

// In-memory sync status — daemon is the single writer, no need to read from disk on every async callback
let currentSyncStatus: import('../core/sync-status.js').SyncStatus | null = null;

function updateAndSaveStatus(
  results: Array<{ ok: boolean; error?: string }>,
  versionInfo?: { latestVersion?: string; needsUpdate?: boolean },
): void {
  currentSyncStatus = computeConnectionStatus(currentSyncStatus, results, versionInfo);
  saveSyncStatus(currentSyncStatus);
}

/** Consume event inbox + sync to server (runs every tick regardless of decay) */
function syncTick(state: PetState): void {
  // Initialize from disk on first tick
  if (currentSyncStatus === null) {
    currentSyncStatus = loadSyncStatus();
  }

  const hookEvents = consumeSyncEvents();
  const hookResults = hookEvents.map(e => ({ ok: e.ok, error: e.error }));

  if (loadAuth()) {
    sendHeartbeat(PKG_VERSION).then(hb => {
      if (hb.needsUpdate && hb.message) {
        saveBubble(hb.message);
      }
      const versionInfo = { latestVersion: hb.latestVersion, needsUpdate: hb.needsUpdate };
      syncPetToServer(state, PKG_VERSION)
        .then(ok => updateAndSaveStatus([...hookResults, { ok }], versionInfo))
        .catch(() => updateAndSaveStatus([...hookResults, { ok: false, error: 'daemon sync failed' }], versionInfo));
    }).catch(() => {
      syncPetToServer(state, PKG_VERSION)
        .then(ok => updateAndSaveStatus([...hookResults, { ok }]))
        .catch(() => updateAndSaveStatus([...hookResults, { ok: false, error: 'sync failed' }]));
    });
  } else if (hookResults.length > 0) {
    updateAndSaveStatus(hookResults);
  }
}

/** Start the daemon loop */
export function startDaemon(): void {
  // Kill ALL existing minipet daemon processes (not just the PID file one)
  killAllDaemons();

  writePid();

  console.log(`MiniPet daemon started (PID: ${process.pid})`);

  // Run decay check periodically
  const interval = setInterval(() => {
    try {
      applyDecay();
    } catch (err) {
      console.error('Decay error:', err);
    }
  }, DECAY_INTERVAL_MS);

  // Initial decay check
  applyDecay();

  // Handle graceful shutdown
  const cleanup = () => {
    clearInterval(interval);
    try { unlinkSync(PID_FILE); } catch { /* ignore */ }
    process.exit(0);
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
  // Windows: 'exit' event as last-resort cleanup (SIGTERM not reliably delivered)
  process.on('exit', () => { try { unlinkSync(PID_FILE); } catch {} });

  // Keep process alive
  process.stdin.resume();
}

/** Stop the daemon */
export function stopDaemon(): boolean {
  const pid = getDaemonPid();
  if (!pid) {
    console.log('No daemon running.');
    return false;
  }
  killAllDaemons();
  console.log('Daemon stopped.');
  return true;
}
