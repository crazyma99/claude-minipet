#!/usr/bin/env node

/**
 * Postinstall script — runs after npm install -g claude-minipet.
 * Only shows a welcome message since npm doesn't support interactive input.
 */

const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const PURPLE = '\x1b[38;2;108;92;231m';

// Skip in CI
if (process.env.CI || process.env.DOCKER) process.exit(0);

console.log('');
console.log(`  ${PURPLE}🐾${RESET} ${BOLD}Claude MiniPet 安装成功!${RESET}`);
console.log('');
console.log(`  运行以下命令开始配置:`);
console.log('');
console.log(`  ${BOLD}claude-minipet init${RESET}`);
console.log('');
