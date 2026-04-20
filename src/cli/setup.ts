#!/usr/bin/env node

/**
 * Postinstall script — runs after npm install -g claude-minipet.
 * Restarts daemon if running (to pick up new code), shows welcome message.
 */

import { findDaemonPids, killAllDaemons, spawnDetached } from '../core/platform.js';

const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const PURPLE = '\x1b[38;2;108;92;231m';
const GREEN = '\x1b[38;2;80;220;100m';

// Skip in CI
if (process.env.CI || process.env.DOCKER) process.exit(0);

// Check if any daemon was running, kill all, then restart
const wasRunning = findDaemonPids().length > 0;

if (wasRunning) {
  killAllDaemons();
  // Start new daemon
  spawnDetached('claude-minipet', ['daemon', 'start']);
  console.log(`  ${GREEN}✓${RESET} Daemon 已自动重启`);
}

console.log('');
console.log(`  ${PURPLE}🐾${RESET} ${BOLD}Claude MiniPet 安装成功!${RESET}`);
console.log('');
console.log(`  首次使用请运行: ${BOLD}claude-minipet init${RESET}`);
console.log('');
