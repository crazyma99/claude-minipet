/**
 * Cross-platform utilities for process management.
 * Handles differences between Unix (macOS/Linux) and Windows.
 */

import { execSync, spawn } from 'node:child_process';
import { unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export const isWin = process.platform === 'win32';
const PID_FILE = join(homedir(), '.claude-minipet', 'daemon.pid');

/**
 * Cross-platform synchronous sleep (no shell commands).
 * Uses Atomics.wait which is safe in Node.js >= 16 without flags.
 */
export function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Find all running minipet daemon PIDs (cross-platform) */
export function findDaemonPids(excludePid?: number): number[] {
  try {
    let out: string;
    if (isWin) {
      // PowerShell: find node.exe processes with "daemon start" and "minipet" in command line
      // Timeout is 10s (vs Unix 5s) because PowerShell + WMI startup is slower
      out = execSync(
        'powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name=\'node.exe\'\\" | Where-Object {$_.CommandLine -match \'daemon start\' -and $_.CommandLine -match \'minipet\'} | Select-Object -ExpandProperty ProcessId"',
        { encoding: 'utf-8', timeout: 10000 }
      ).trim();
    } else {
      out = execSync("ps ax -o pid,command | grep '[d]aemon start' | grep minipet", {
        encoding: 'utf-8', timeout: 5000,
      }).trim();
    }
    if (!out) return [];
    return out.split('\n')
      .map(l => parseInt(l.trim().split(/\s+/)[0]))
      .filter(pid => pid && pid !== excludePid);
  } catch {
    return []; // no matches
  }
}

/** Kill a process by PID (cross-platform) */
export function killPid(pid: number): void {
  try {
    // process.kill(pid) without signal: sends SIGTERM on Unix, forces termination on Windows
    process.kill(pid);
  } catch { /* already dead */ }
}

/** Kill all minipet daemon processes and wait until none remain */
export function killAllDaemons(): void {
  const myPid = process.pid;

  // Find and kill
  const pids = findDaemonPids(myPid);
  for (const pid of pids) {
    killPid(pid);
  }

  // Wait up to 5 seconds for all to die
  for (let i = 0; i < 50; i++) {
    const remaining = findDaemonPids(myPid);
    if (remaining.length === 0) break;
    sleepSync(100);
  }

  // Clean up PID file
  try { unlinkSync(PID_FILE); } catch { /* ignore */ }
}

/**
 * Spawn a detached background process (cross-platform).
 * SAFETY: shell:true is required on Windows for detached processes.
 * Only call with trusted, hardcoded arguments — never user input.
 */
export function spawnDetached(command: string, args: string[]): number | undefined {
  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
    ...(isWin ? { windowsHide: true, shell: true } : {}),
  });
  child.unref();
  return child.pid;
}
