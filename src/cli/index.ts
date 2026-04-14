#!/usr/bin/env node

import { loadState, saveState, loadConfig, saveConfig, createPet, feedPet, patPet, ensureDataDir } from '../core/pet.js';
import { generateDNA } from '../core/dna.js';
import { getRarityDisplay, RARITY_INFO } from '../core/rarity.js';
import { renderStatusLine } from '../render/statusline.js';
import { SPECIES_NAMES } from '../render/sprites.js';
import { handleHook } from '../hooks/handler.js';
import { startDaemon, stopDaemon, isDaemonRunning } from '../daemon/server.js';
import { installHooks } from './install.js';
import { fg, RESET, BOLD } from '../render/pixel.js';
import { triggerAnim } from '../render/anim-state.js';
import { loadAuth, saveAuth, sendCode, verifyCode, syncPetToServer, fetchPetFromServer, redeemCode } from '../core/sync.js';
import type { PetConfig } from '../core/types.js';
import { createInterface } from 'node:readline';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'init':
      await initPet();
      break;

    case 'status':
      showStatus();
      break;

    case 'feed':
      doFeed();
      break;

    case 'pat':
      doPat();
      break;

    case 'rename': {
      const newName = args[1];
      if (!newName) {
        console.log('Usage: claude-minipet rename <name>');
        process.exit(1);
      }
      doRename(newName);
      break;
    }

    case 'hook':
      await handleHook();
      break;

    case 'statusline':
      showStatusLine();
      break;

    case 'login':
      await doLogin(args[1]);
      break;

    case 'sync':
      await doSync();
      break;

    case 'redeem':
      await doRedeem(args[1]);
      break;

    case 'daemon':
      handleDaemon(args[1]);
      break;

    case 'help':
    default:
      showHelp();
      break;
  }
}

async function initPet() {
  const existing = loadState();
  if (existing) {
    console.log(`你已经有一只宠物了: ${existing.name} (${SPECIES_NAMES[existing.species].zh})`);
    console.log('如果想重新开始，请先删除 ~/.claude-minipet/state.json');
    return;
  }

  ensureDataDir();

  // Generate DNA
  const dna = generateDNA();
  const speciesInfo = SPECIES_NAMES[dna.species];
  const rarityInfo = RARITY_INFO[dna.rarity];
  const rc = fg(rarityInfo.color);

  // Create pet with default name
  const defaultName = speciesInfo.zh;
  const state = createPet(defaultName, dna.species, dna.raw, dna.rarity);
  saveState(state);

  // Save default config
  const config: PetConfig = { language: 'zh', animationsEnabled: true, statusLineRows: 3 };
  saveConfig(config);

  // Show birth announcement
  console.log('');
  console.log(`  ✨ ${BOLD}一只新的宠物诞生了!${RESET} ✨`);
  console.log('');
  console.log(`  种族: ${fg(dna.primaryColor)}${BOLD}${speciesInfo.zh}${RESET} (${speciesInfo.en})`);
  console.log(`  稀有度: ${rc}${getRarityDisplay(dna.rarity, 'zh')}${RESET}`);
  console.log(`  DNA: ${dna.raw}`);
  console.log('');

  // Show the pet
  console.log(renderStatusLine(state));
  console.log('');
  console.log(`  用 ${BOLD}claude-minipet rename <名字>${RESET} 给它起个名字吧!`);
  console.log('');

  // Install hooks
  try {
    installHooks();
    console.log('  ✅ Claude Code hooks 已配置');
  } catch (err) {
    console.log(`  ⚠️  Hook 配置失败: ${err}`);
    console.log('  请手动配置 ~/.claude/settings.json');
  }

  // Start daemon
  if (!isDaemonRunning()) {
    console.log('  🔄 启动后台守护进程...');
    // Fork daemon as detached process
    const { spawn } = await import('node:child_process');
    const daemonPath = new URL('../daemon/server.js', import.meta.url).pathname;
    // We'll use the CLI entry point with daemon start
    const child = spawn(process.execPath, [process.argv[1], 'daemon', 'start'], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    console.log('  ✅ 守护进程已启动');
  }

  console.log('');
  console.log(`  ${BOLD}开始使用 Claude Code 吧，你的宠物会陪伴你! 🎉${RESET}`);
  console.log('');
}

function showStatus() {
  const state = loadState();
  if (!state) {
    console.log('还没有宠物。运行 claude-minipet init 创建一只!');
    return;
  }
  console.log('');
  console.log(renderStatusLine(state));
  console.log('');

  const speciesInfo = SPECIES_NAMES[state.species];
  console.log(`  名字: ${state.name}`);
  console.log(`  种族: ${speciesInfo.zh} (${speciesInfo.en})`);
  console.log(`  🧬 DNA: ${state.dna}`);
  console.log(`  等级: Lv.${state.level} (${state.exp}/${state.expToNext} EXP)`);
  console.log(`  阶段: ${state.stage === 'baby' ? '幼年体' : state.stage === 'growth' ? '成长体' : '完全体'}`);
  if (state.evolution) {
    console.log(`  进化: ${state.evolution}`);
  }
  console.log(`  心情: ${state.mood}/100`);
  console.log(`  饱食: ${state.hunger}/100`);
  console.log(`  亲密: ${Math.floor(state.bond)}/100`);
  console.log('');
  console.log(`  -- 统计 --`);
  console.log(`  编辑文件: ${state.stats.totalEdits}`);
  console.log(`  命令执行: ${state.stats.totalBash}`);
  console.log(`  文件阅读: ${state.stats.totalReads}`);
  console.log(`  Git提交: ${state.stats.totalCommits}`);
  console.log(`  会话数: ${state.stats.totalSessions}`);
  console.log(`  连续登录: ${state.stats.loginStreak} 天`);
  console.log('');
}

function showStatusLine() {
  const state = loadState();
  if (!state) {
    process.exit(0);
  }
  // Status line reads stdin (session data from Claude Code) but we don't need it
  // Just output the rendered status
  process.stdout.write(renderStatusLine(state));
}

function doFeed() {
  const state = loadState();
  if (!state) {
    console.log('还没有宠物。运行 claude-minipet init 创建一只!');
    return;
  }
  const before = state.hunger;
  feedPet(state);
  triggerAnim('feed');
  console.log(`◆ 喂食成功! 饱食度: ${before} → ${state.hunger}`);
}

function doPat() {
  const state = loadState();
  if (!state) {
    console.log('还没有宠物。运行 claude-minipet init 创建一只!');
    return;
  }
  const beforeMood = state.mood;
  const beforeBond = Math.floor(state.bond);
  patPet(state);
  triggerAnim('pat');
  console.log(`♥ 摸摸 ${state.name}! 心情: ${beforeMood} → ${state.mood}, 亲密: ${beforeBond} → ${Math.floor(state.bond)}`);
}

function doRename(newName: string) {
  const state = loadState();
  if (!state) {
    console.log('还没有宠物。运行 claude-minipet init 创建一只!');
    return;
  }
  const oldName = state.name;
  state.name = newName;
  saveState(state);
  console.log(`✏️  ${oldName} 现在叫 ${BOLD}${newName}${RESET} 了!`);
}

function handleDaemon(subcommand: string | undefined) {
  switch (subcommand) {
    case 'start':
      startDaemon();
      break;
    case 'stop':
      stopDaemon();
      break;
    case 'status':
      if (isDaemonRunning()) {
        console.log('Daemon is running.');
      } else {
        console.log('Daemon is not running.');
      }
      break;
    default:
      console.log('Usage: claude-minipet daemon <start|stop|status>');
  }
}

/** Prompt user for input in terminal */
function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/** Login with email verification code */
async function doLogin(serverUrl?: string) {
  const url = serverUrl ?? 'http://localhost:3456';

  console.log(`  服务器: ${url}`);
  const email = await prompt('  请输入邮箱: ');
  if (!email || !email.includes('@')) {
    console.log('  邮箱格式不正确');
    return;
  }

  console.log('  发送验证码中...');
  const sendResult = await sendCode(url, email);
  if (!sendResult.ok) {
    console.log(`  ❌ ${sendResult.error ?? '发送失败'}`);
    return;
  }
  console.log('  ✅ 验证码已发送到邮箱');

  const code = await prompt('  请输入验证码: ');
  if (!code) {
    console.log('  已取消');
    return;
  }

  const verifyResult = await verifyCode(url, email, code);
  if (!verifyResult.ok || !verifyResult.token) {
    console.log(`  ❌ ${verifyResult.error ?? '验证失败'}`);
    return;
  }

  saveAuth({
    token: verifyResult.token,
    email,
    userId: verifyResult.userId!,
    serverUrl: url,
  });

  console.log(`  ✅ 登录成功! (${email})`);

  // Sync pet to server if exists
  const state = loadState();
  if (state) {
    await syncPetToServer(state);
    console.log('  ✅ 宠物数据已同步到服务器');
  }
}

/** Sync pet data with server */
async function doSync() {
  const auth = loadAuth();
  if (!auth) {
    console.log('  未登录。请先运行: claude-minipet login <服务器地址>');
    return;
  }

  const localState = loadState();
  const remoteState = await fetchPetFromServer();

  if (localState && remoteState) {
    // Both exist — use the one with more recent interaction
    const localTime = new Date(localState.lastInteraction).getTime();
    const remoteTime = new Date(remoteState.lastInteraction).getTime();
    if (localTime >= remoteTime) {
      await syncPetToServer(localState);
      console.log('  ✅ 本地数据已同步到服务器 (本地较新)');
    } else {
      saveState(remoteState);
      console.log('  ✅ 服务器数据已同步到本地 (服务器较新)');
    }
  } else if (localState && !remoteState) {
    await syncPetToServer(localState);
    console.log('  ✅ 本地数据已上传到服务器');
  } else if (!localState && remoteState) {
    saveState(remoteState);
    console.log('  ✅ 服务器数据已下载到本地');
  } else {
    console.log('  本地和服务器都没有宠物数据');
  }
}

/** Redeem a code to get a new pet */
async function doRedeem(code?: string) {
  const auth = loadAuth();
  if (!auth) {
    console.log('  未登录。请先运行: claude-minipet login');
    return;
  }
  if (!code) {
    code = await prompt('  🎫 请输入兑换码: ');
  }
  if (!code) {
    console.log('  已取消');
    return;
  }

  console.log('  兑换中...');
  const result = await redeemCode(code);
  if (!result.ok) {
    console.log(`  ❌ ${result.error ?? '兑换失败'}`);
    return;
  }

  // Save new pet locally
  if (result.pet) {
    saveState(result.pet);
    console.log(`  ✅ ${result.message}`);
    console.log('');
    console.log(renderStatusLine(result.pet));
    console.log('');
    console.log(`  用 ${BOLD}claude-minipet rename <名字>${RESET} 给新宠物起个名字吧!`);
  }
}

function showHelp() {
  console.log(`
${BOLD}claude-minipet${RESET} - Claude Code 终端宠物

${BOLD}命令:${RESET}
  init              创建新宠物并配置 hooks
  login <url>       登录服务器 (如: login https://minipet.crazyma99.xyz)
  sync              同步宠物数据到服务器
  redeem <code>     兑换码兑换宠物 (宠物重新培养)
  status            查看宠物详细状态
  feed              喂食宠物 (饱食度 +30)
  pat               摸摸宠物 (心情 +10, 亲密 +2)
  rename <name>     给宠物改名
  daemon start      启动后台守护进程
  daemon stop       停止守护进程
  daemon status     查看守护进程状态
  help              显示帮助
`);
}

main().catch(console.error);
