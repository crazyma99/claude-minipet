import { loadState, saveState } from '../core/pet.js';
import { checkEvolution, applyEvolution } from '../core/evolution.js';
import { triggerAnim } from '../render/anim-state.js';
import { syncPetToServer, sendHeartbeat, loadAuth } from '../core/sync.js';
import { saveSyncStatus } from '../core/sync-status.js';
import { saveBubble } from '../render/bubble.js';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';

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

/** Check if daemon is already running */
export function isDaemonRunning(): boolean {
  if (!existsSync(PID_FILE)) return false;
  try {
    const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim());
    // Check if process exists
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

  // Sync + heartbeat to server if logged in
  if (loadAuth()) {
    sendHeartbeat(PKG_VERSION).then(hb => {
      if (hb.needsUpdate && hb.message) {
        saveBubble(hb.message);
      }
      // Save sync status with version info from heartbeat
      syncPetToServer(state)
        .then(ok => saveSyncStatus(ok, undefined, hb.latestVersion, hb.needsUpdate))
        .catch(() => saveSyncStatus(false, 'sync failed', hb.latestVersion, hb.needsUpdate));
    }).catch(() => {
      syncPetToServer(state)
        .then(ok => saveSyncStatus(ok))
        .catch(() => saveSyncStatus(false, 'sync failed'));
    });
  }
}

/** Start the daemon loop */
export function startDaemon(): void {
  if (isDaemonRunning()) {
    console.log('Daemon is already running.');
    process.exit(0);
  }

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
    try {
      const { unlinkSync } = require('node:fs');
      unlinkSync(PID_FILE);
    } catch { /* ignore */ }
    process.exit(0);
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);

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
  try {
    process.kill(pid, 'SIGTERM');
    console.log(`Daemon stopped (PID: ${pid})`);
    return true;
  } catch {
    console.log('Daemon process not found, cleaning up PID file.');
    try {
      const { unlinkSync } = require('node:fs');
      unlinkSync(PID_FILE);
    } catch { /* ignore */ }
    return false;
  }
}
