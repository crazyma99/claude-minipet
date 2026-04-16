// 2026-04-16 Eric: 宠物配对孵化功能
// 用户 LV8+ 可用好友 DNA 码链进行同品种配对孵化，生成全新宠物

import { loadState, saveState, createPet } from '../core/pet.js';
import { parseDNA, generateDNA } from '../core/dna.js';
import { getRarityDisplay, RARITY_INFO } from '../core/rarity.js';
import { SPECIES_NAMES } from '../render/sprites.js';
import { fg, RESET, BOLD } from '../render/pixel.js';
import type { Rarity } from '../core/types.js';
import { createInterface } from 'node:readline';

const HATCH_MIN_LEVEL = 8;

/** 孵化稀有度权重表: 普通60% 优秀25% 稀有10% 传说4% 异色1% */
const HATCH_RARITY_TABLE: { rarity: Rarity; weight: number }[] = [
  { rarity: 'common',    weight: 60 },
  { rarity: 'uncommon',  weight: 25 },
  { rarity: 'rare',      weight: 10 },
  { rarity: 'legendary', weight: 4 },
  { rarity: 'shiny',     weight: 1 },
];

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

/** 显示孵化进度条（25 步 × 400ms = 10 秒，比升级动画慢） */
async function showHatchProgress(): Promise<void> {
  const steps = 25;
  const delay = 400;
  console.log('');
  for (let i = 0; i <= steps; i++) {
    const filled = '\u2593'.repeat(i);
    const empty = '\u2591'.repeat(steps - i);
    const percent = Math.round((i / steps) * 100);
    process.stdout.write(`\r  \u{1F95A} 孵化中 [${filled}${empty}] ${percent}%`);
    await sleep(delay);
  }
  console.log('');
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

  // 配对成功 → 孵化
  console.log('');
  console.log(`  \u{1F95A} 配对成功！${myName.zh} \u00D7 ${myName.zh} 开始孵化...`);
  await showHatchProgress();

  // 随机稀有度 + 生成新 DNA
  const hatchedRarity = rollHatchRarity();
  const newDNA = generateDNA();
  const rarityInfo = RARITY_INFO[hatchedRarity];
  const rc = fg(rarityInfo.color);
  const childName = `${state.name}之子`;
  const newPet = createPet(childName, mySpecies, newDNA.raw, hatchedRarity);

  // 展示新宠物
  console.log(`  \u2728 孵化完成！`);
  console.log('');
  console.log(`  \u2554${'═'.repeat(38)}\u2557`);
  console.log(`  \u2551  \u{1F423} ${BOLD}新宠物诞生！${RESET}${' '.repeat(20)}\u2551`);
  console.log(`  \u2551  品种: ${fg(newDNA.primaryColor)}${BOLD}${myName.zh}${RESET} (${myName.en})${' '.repeat(Math.max(0, 20 - myName.zh.length - myName.en.length))}\u2551`);
  console.log(`  \u2551  稀有度: ${rc}${getRarityDisplay(hatchedRarity, 'zh')}${RESET}${' '.repeat(Math.max(0, 22 - getRarityDisplay(hatchedRarity, 'zh').length))}\u2551`);
  console.log(`  \u2551  \u{1F9EC} DNA: ${newDNA.raw}${' '.repeat(Math.max(0, 15 - newDNA.raw.length + 23))}\u2551`);
  console.log(`  \u255A${'═'.repeat(38)}\u255D`);
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
