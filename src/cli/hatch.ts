import { loadState, saveState, createPet } from '../core/pet.js';
import { parseDNA } from '../core/dna.js';
import { getRarityDisplay, RARITY_INFO } from '../core/rarity.js';
import { SPECIES_NAMES } from '../render/sprites.js';
import { fg, RESET, BOLD, visibleLength } from '../render/pixel.js';
import { loadAuth } from '../core/sync.js';
import type { Rarity } from '../core/types.js';
import { createInterface } from 'node:readline';
import { randomBytes } from 'node:crypto';

const HATCH_MIN_LEVEL = 8;

//稀有度 → DNA 末字节映射，确保 parseDNA 结果与 hatchedRarity 一致
const RARITY_BYTE: Record<Rarity, number> = {
  shiny:     0x01,
  legendary: 0x08,
  rare:      0x18,
  uncommon:  0x40,
  common:    0x80,
};

//服务端孵化冷却校验（72h），防止无限刷宠
interface HatchCooldownResult {
  ok: boolean;
  cooldown?: boolean;
  remainingSeconds?: number;
  error?: string;
}

async function checkHatchCooldown(friendDna: string): Promise<HatchCooldownResult> {
  const auth = loadAuth();
  if (!auth) return { ok: false, error: '未登录' };

  try {
    const res = await fetch(`${auth.serverUrl}/pets/hatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ friendDna }),
      signal: AbortSignal.timeout(5000),
    });
    return await res.json();
  } catch {
    return { ok: false, error: '无法连接服务器，请检查网络后重试' };
  }
}

function formatCooldown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}小时${m}分钟`;
  return `${m}分钟`;
}

/** 孵化稀有度权重表: 普通60% 优秀25% 稀有10% 传说4% 异色1% */
const HATCH_RARITY_TABLE: { rarity: Rarity; weight: number }[] = [
  { rarity: 'common',    weight: 60 },
  { rarity: 'uncommon',  weight: 25 },
  { rarity: 'rare',      weight: 10 },
  { rarity: 'legendary', weight: 4 },
  { rarity: 'shiny',     weight: 1 },
];

//用 crypto.randomBytes 生成真随机 DNA，末字节编码指定稀有度
function generateHatchDNA(rarity: Rarity): string {
  const bytes = randomBytes(8);
  bytes[7] = RARITY_BYTE[rarity];  // 末字节对齐 determineRarity 区间
  return Array.from(bytes).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('-');
}

/** 加权随机抽取孵化稀有度 */
function rollHatchRarity(): Rarity {
  const total = HATCH_RARITY_TABLE.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * total;
  for (const entry of HATCH_RARITY_TABLE) {
    roll -= entry.weight;
    if (roll <= 0) return entry.rarity;
  }
  return 'common';
}

/** 终端交互式输入 */
function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/** 延迟 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** 显示孵化进度条（25 步 × 400ms = 10 秒，比升级动画慢），支持 Ctrl+C 中断 */
async function showHatchProgress(): Promise<void> {
  const steps = 25;
  const delay = 400;
  let aborted = false;
  const onSigint = () => { aborted = true; };
  process.on('SIGINT', onSigint);
  console.log('');
  try {
    for (let i = 0; i <= steps; i++) {
      if (aborted) break;
      const filled = '\u2588'.repeat(i);
      const empty = '\u2591'.repeat(steps - i);
      const percent = Math.round((i / steps) * 100);
      process.stdout.write(`\r  \u{1F95A} 孵化中 [${filled}${empty}] ${percent}%`);
      if (i < steps) await sleep(delay);
    }
    console.log('');
  } finally {
    process.removeListener('SIGINT', onSigint);
  }
  if (aborted) {
    console.log('  已取消孵化');
    process.exit(0);
  }
}

/** 配对孵化主入口 */
export async function doHatch(friendCode?: string): Promise<void> {
  // 检查本地宠物
  const state = loadState();
  if (!state) {
    console.log('  \u274C 你还没有宠物。请先运行: claude-minipet init');
    return;
  }

  // 检查等级
  if (state.level < HATCH_MIN_LEVEL) {
    console.log(`  \u274C 孵化功能需要 LV${HATCH_MIN_LEVEL} 解锁，当前 LV${state.level}`);
    return;
  }

  // 获取码链
  if (!friendCode) {
    friendCode = await prompt('  \u{1F517} 请输入好友 DNA 码链: ');
  }
  if (!friendCode) {
    console.log('  已取消');
    return;
  }

  // 解析好友 DNA
  let friendDNA;
  try {
    friendDNA = parseDNA(friendCode);
  } catch {
    console.log('  \u274C 无效的 DNA 码链格式（正确格式: XX-XX-XX-XX-XX-XX-XX-XX）');
    return;
  }

  //阻止自我配对
  if (friendCode === state.dna) {
    console.log('  \u274C 不能和自己的宠物配对，请使用好友的 DNA 码链');
    return;
  }

  // 品种匹配
  const mySpecies = state.species;
  const friendSpecies = friendDNA.species;
  const myName = SPECIES_NAMES[mySpecies];
  const friendName = SPECIES_NAMES[friendSpecies];

  if (mySpecies !== friendSpecies) {
    console.log('');
    console.log(`  \u274C 孵化失败：品种不一致`);
    console.log(`     你的宠物: ${myName.zh}(${myName.en})  好友宠物: ${friendName.zh}(${friendName.en})`);
    console.log(`     仅支持同品种配对孵化`);
    return;
  }

  //服务端冷却校验（72h）
  console.log('');
  console.log('  \u23F3 正在校验孵化冷却...');
  const cooldownResult = await checkHatchCooldown(friendCode);
  if (!cooldownResult.ok) {
    if (cooldownResult.cooldown && cooldownResult.remainingSeconds) {
      console.log(`  \u274C 孵化冷却中，剩余 ${formatCooldown(cooldownResult.remainingSeconds)}`);
    } else {
      console.log(`  \u274C ${cooldownResult.error ?? '孵化请求失败'}`);
    }
    return;
  }

  // 配对成功 → 孵化
  console.log(`  \u{1F95A} 配对成功！${myName.zh} \u00D7 ${myName.zh} 开始孵化...`);
  await showHatchProgress();

  //随机稀有度 + 真随机 DNA（末字节编码稀有度，保证一致性）
  const hatchedRarity = rollHatchRarity();
  const newDNAString = generateHatchDNA(hatchedRarity);
  const newDNA = parseDNA(newDNAString);
  const rarityInfo = RARITY_INFO[hatchedRarity];
  const rc = fg(rarityInfo.color);
  const baseName = state.name.replace(/(之子)+$/, '');
  const childName = `${baseName}之子`;
  const newPet = createPet(childName, mySpecies, newDNAString, hatchedRarity);

  // 展示新宠物（用 visibleLength 计算真实列宽，正确对齐中文/emoji）
  const BOX_W = 40;
  const pad = (text: string) => {
    const gap = BOX_W - 2 - visibleLength(text);
    return text + ' '.repeat(Math.max(0, gap));
  };

  console.log(`  \u2728 孵化完成！`);
  console.log('');
  console.log(`  \u2554${'═'.repeat(BOX_W)}\u2557`);
  console.log(`  \u2551${pad(`  \u{1F423} ${BOLD}新宠物诞生！${RESET}`)}\u2551`);
  console.log(`  \u2551${pad(`  品种: ${fg(newDNA.primaryColor)}${BOLD}${myName.zh}${RESET} (${myName.en})`)}\u2551`);
  console.log(`  \u2551${pad(`  稀有度: ${rc}${getRarityDisplay(hatchedRarity, 'zh')}${RESET}`)}\u2551`);
  console.log(`  \u2551${pad(`  \u{1F9EC} DNA: ${newDNA.raw}`)}\u2551`);
  console.log(`  \u255A${'═'.repeat(BOX_W)}\u255D`);
  console.log('');

  // 询问是否替换
  const answer = await prompt(`  是否替换当前宠物？新宠物将从 LV1 开始 (y/n): `);
  if (answer.toLowerCase() === 'y') {
    saveState(newPet);
    console.log(`  \u2705 已替换！${childName} 从 LV1 开始新旅程`);
    console.log(`  用 ${BOLD}claude-minipet rename <名字>${RESET} 给新宠物起个名字吧!`);
  } else {
    console.log(`  \u{1F44C} 已取消替换，继续陪伴 ${state.name}`);
  }
}
