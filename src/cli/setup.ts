#!/usr/bin/env node

/**
 * Postinstall script — runs after npm install -g claude-minipet.
 * Restarts daemon if running (to pick up new code), shows welcome message.
 */

import { spawn, execSync } from 'node:child_process';
import { unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const PURPLE = '\x1b[38;2;108;92;231m';
const GREEN = '\x1b[38;2;80;220;100m';

// Skip in CI
if (process.env.CI || process.env.DOCKER) process.exit(0);

// Check if any daemon was running, kill all, then restart
let wasRunning = false;
try {
  const out = execSync("ps ax -o pid,command | grep 'minipet daemon start' | grep -v grep", {
    encoding: 'utf-8', timeout: 5000,
  }).trim();
  wasRunning = out.length > 0;
} catch { /* grep exits 1 = no match = not running */ }

if (wasRunning) {
  // Kill all minipet daemon processes
  try { execSync("pkill -f 'minipet daemon start'", { timeout: 5000 }); } catch { /* ignore */ }
  // Wait up to 5s for all to die
  for (let i = 0; i < 50; i++) {
    try {
      execSync("pgrep -f 'minipet daemon start'", { timeout: 3000 });
      execSync('sleep 0.1', { stdio: 'ignore' });
    } catch { break; } // pgrep exits 1 = no match = all dead
  }
  // Clean PID file
  const PID_FILE = join(homedir(), '.claude-minipet', 'daemon.pid');
  try { unlinkSync(PID_FILE); } catch { /* ignore */ }
  // Start new daemon
  const child = spawn('claude-minipet', ['daemon', 'start'], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  console.log(`  ${GREEN}✓${RESET} Daemon 已自动重启`);
}

console.log('');
console.log(`  ${PURPLE}🐾${RESET} ${BOLD}Claude MiniPet 安装成功!${RESET}`);
console.log('');
console.log(`  首次使用请运行: ${BOLD}claude-minipet init${RESET}`);
console.log('');
