#!/usr/bin/env node

/**
 * Postinstall script — runs after npm install -g claude-minipet.
 * Restarts daemon if running (to pick up new code), shows welcome message.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const PURPLE = '\x1b[38;2;108;92;231m';
const GREEN = '\x1b[38;2;80;220;100m';

// Skip in CI
if (process.env.CI || process.env.DOCKER) process.exit(0);

// Try to restart daemon if it was running
const PID_FILE = join(homedir(), '.claude-minipet', 'daemon.pid');
try {
  if (existsSync(PID_FILE)) {
    const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim());
    try {
      process.kill(pid, 0); // Check if alive
      process.kill(pid, 'SIGTERM'); // Stop old daemon
      // Start new daemon in background
      execSync('claude-minipet daemon start &', { stdio: 'ignore', timeout: 5000 });
      console.log(`  ${GREEN}✓${RESET} Daemon 已自动重启`);
    } catch {
      // Daemon wasn't running, no need to restart
    }
  }
} catch {
  // Ignore errors — daemon restart is best-effort
}

console.log('');
console.log(`  ${PURPLE}🐾${RESET} ${BOLD}Claude MiniPet 安装成功!${RESET}`);
console.log('');
console.log(`  首次使用请运行: ${BOLD}claude-minipet init${RESET}`);
console.log('');
