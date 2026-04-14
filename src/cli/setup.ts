#!/usr/bin/env node

/**
 * Postinstall script — runs automatically after `npm install -g claude-minipet`.
 *
 * Full guided flow:
 * 1. Login with email verification code → server creates user
 * 2. Generate pet (DNA, species, rarity) → save locally + upload to server
 * 3. Configure Claude Code hooks + status line
 * 4. Start daemon
 */

import { loadState, saveState, saveConfig, createPet, ensureDataDir } from '../core/pet.js';
import { generateDNA } from '../core/dna.js';
import { getRarityDisplay, RARITY_INFO } from '../core/rarity.js';
import { SPECIES_NAMES } from '../render/sprites.js';
import { renderStatusLine } from '../render/statusline.js';
import { installHooks } from './install.js';
import { fg, RESET, BOLD } from '../render/pixel.js';
import { isDaemonRunning } from '../daemon/server.js';
import { loadAuth, saveAuth, sendCode, verifyCode, syncPetToServer, fetchPetFromServer } from '../core/sync.js';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import type { PetConfig } from '../core/types.js';

// Default server URL — change this to your production server
const DEFAULT_SERVER = 'https://minipet.crazyma99.xyz';

/** Prompt user for input */
function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  // Skip in CI environments
  if (process.env.CI || process.env.DOCKER) {
    return;
  }

  try {
    ensureDataDir();

    console.log('');
    console.log(`  ${BOLD}🐾 欢迎使用 Claude MiniPet!${RESET}`);
    console.log('');

    // ========== Step 1: Login ==========
    const existingAuth = loadAuth();
    if (!existingAuth) {
      console.log(`  首先，让我们创建你的账号。`);
      console.log('');

      const email = await prompt('  📧 请输入你的邮箱: ');
      if (!email || !email.includes('@')) {
        console.log('  ❌ 邮箱格式不正确，请稍后运行 claude-minipet login 重试');
        await setupLocalOnly();
        return;
      }

      console.log('  📤 发送验证码中...');
      const sendResult = await sendCode(DEFAULT_SERVER, email);
      if (!sendResult.ok) {
        console.log(`  ❌ ${sendResult.error ?? '无法连接服务器'}`);
        console.log('  将以离线模式运行，稍后可用 claude-minipet login 登录');
        await setupLocalOnly();
        return;
      }
      console.log('  ✅ 验证码已发送到你的邮箱');
      console.log('');

      const code = await prompt('  🔑 请输入验证码: ');
      if (!code) {
        console.log('  已跳过登录，稍后可用 claude-minipet login 登录');
        await setupLocalOnly();
        return;
      }

      const verifyResult = await verifyCode(DEFAULT_SERVER, email, code);
      if (!verifyResult.ok || !verifyResult.token) {
        console.log(`  ❌ ${verifyResult.error ?? '验证失败'}`);
        console.log('  将以离线模式运行，稍后可用 claude-minipet login 重试');
        await setupLocalOnly();
        return;
      }

      saveAuth({
        token: verifyResult.token,
        email,
        userId: verifyResult.userId!,
        serverUrl: DEFAULT_SERVER,
      });
      console.log(`  ✅ 登录成功! (${email})`);
      console.log('');
    } else {
      console.log(`  ✅ 已登录: ${existingAuth.email}`);
    }

    // ========== Step 2: Create or sync pet ==========
    const existingState = loadState();
    if (existingState) {
      console.log(`  🐾 宠物已存在: ${existingState.name} (${SPECIES_NAMES[existingState.species].zh})`);
      // Sync to server
      if (loadAuth()) {
        await syncPetToServer(existingState);
        console.log('  ☁️  数据已同步到云端');
      }
    } else {
      // Try to fetch from server first (returning user on new device)
      let state = null;
      if (loadAuth()) {
        console.log('  ☁️  检查云端数据...');
        state = await fetchPetFromServer();
        if (state) {
          saveState(state);
          console.log(`  ✅ 从云端恢复了你的宠物: ${state.name}!`);
        }
      }

      // No cloud data — create new pet
      if (!state) {
        const dna = generateDNA();
        const speciesInfo = SPECIES_NAMES[dna.species];
        const rarityInfo = RARITY_INFO[dna.rarity];
        const rc = fg(rarityInfo.color);

        state = createPet(speciesInfo.zh, dna.species, dna.raw, dna.rarity);
        saveState(state);

        const config: PetConfig = { language: 'zh', animationsEnabled: true, statusLineRows: 3 };
        saveConfig(config);

        console.log('');
        console.log(`  ✨ ${BOLD}一只新的宠物诞生了!${RESET} ✨`);
        console.log('');
        console.log(`  种族: ${fg(dna.primaryColor)}${BOLD}${speciesInfo.zh}${RESET} (${speciesInfo.en})`);
        console.log(`  稀有度: ${rc}${getRarityDisplay(dna.rarity, 'zh')}${RESET}`);
        console.log(`  🧬 DNA: ${dna.raw}`);
        console.log('');
        console.log(renderStatusLine(state));
        console.log('');
        console.log(`  用 ${BOLD}claude-minipet rename <名字>${RESET} 给它起个名字吧!`);

        // Upload new pet to server
        if (loadAuth()) {
          await syncPetToServer(state);
          console.log('  ☁️  宠物数据已上传到云端');
        }
      }
    }

    // ========== Step 3: Install hooks ==========
    installHooks();
    console.log('  ✅ Claude Code hooks 已配置');

    // ========== Step 4: Start daemon ==========
    if (!isDaemonRunning()) {
      try {
        const binPath = new URL('./index.js', import.meta.url).pathname;
        const child = spawn(process.execPath, [binPath, 'daemon', 'start'], {
          detached: true,
          stdio: 'ignore',
        });
        child.unref();
        console.log('  ✅ 守护进程已启动');
      } catch {
        console.log('  ⚠️  守护进程启动失败，可手动运行: claude-minipet daemon start');
      }
    }

    console.log('');
    console.log(`  ${BOLD}重启 Claude Code 就能看到你的宠物了! 🎉${RESET}`);
    console.log('');

  } catch (err) {
    console.log(`  ⚠️  配置失败: ${err}`);
    console.log('  请手动运行: claude-minipet init');
  }
}

/** Fallback: setup without server login */
async function setupLocalOnly() {
  const existing = loadState();
  if (!existing) {
    ensureDataDir();
    const dna = generateDNA();
    const speciesInfo = SPECIES_NAMES[dna.species];
    const state = createPet(speciesInfo.zh, dna.species, dna.raw, dna.rarity);
    saveState(state);
    const config: PetConfig = { language: 'zh', animationsEnabled: true, statusLineRows: 3 };
    saveConfig(config);

    console.log('');
    console.log(`  ✨ ${BOLD}一只新的宠物诞生了!${RESET} ✨`);
    console.log(`  种族: ${speciesInfo.zh} (${speciesInfo.en})`);
    console.log(`  🧬 DNA: ${dna.raw}`);
    console.log('');
    console.log(renderStatusLine(state));
  }

  installHooks();
  console.log('  ✅ Claude Code hooks 已配置');

  if (!isDaemonRunning()) {
    try {
      const binPath = new URL('./index.js', import.meta.url).pathname;
      const child = spawn(process.execPath, [binPath, 'daemon', 'start'], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      console.log('  ✅ 守护进程已启动');
    } catch { /* ignore */ }
  }

  console.log('');
  console.log(`  ${BOLD}重启 Claude Code 就能看到你的宠物了! 🎉${RESET}`);
  console.log('  (离线模式，稍后可用 claude-minipet login 登录同步)');
  console.log('');
}

main();
