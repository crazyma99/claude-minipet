import type { PetState, Species, Stage, LangCategory, CodingStyle } from './types.js';

/** Evolution branch definition */
export interface EvolutionBranch {
  name: string;
  nameZh: string;
  description: string;
}

/** Per-species evolution tree */
export interface SpeciesEvolutionTree {
  growth: Record<LangCategory, EvolutionBranch>;
  final: Record<CodingStyle, EvolutionBranch>;
}

/** Full evolution tree: 6 species × (7 first-evo + 5 second-evo) */
export const EVOLUTION_TREE: Record<Species, SpeciesEvolutionTree> = {
  bitcat: {
    growth: {
      python:     { name: 'serpent_cat',  nameZh: '蛇语猫', description: 'Speaks the tongue of Python' },
      frontend:   { name: 'pixel_cat',   nameZh: '像素猫', description: 'Paints interfaces with precision' },
      backend:    { name: 'iron_cat',    nameZh: '铁猫',   description: 'Hardened by systems-level code' },
      scripting:  { name: 'script_cat',  nameZh: '脚本猫', description: 'Swift and nimble, automating everything' },
      docs:       { name: 'scroll_cat',  nameZh: '卷轴猫', description: 'Keeper of knowledge and docs' },
      ops:        { name: 'deploy_cat',  nameZh: '部署猫', description: 'Guardian of pipelines' },
      fullstack:  { name: 'shadow_cat',  nameZh: '影猫',   description: 'Master of all trades' },
    },
    final: {
      craftsman:    { name: 'void_cat',    nameZh: '虚空猫', description: 'Meticulous craft transcends digital' },
      speedster:    { name: 'storm_cat',   nameZh: '雷猫',   description: 'Blazing speed crystallized' },
      collaborator: { name: 'bond_cat',    nameZh: '羁绊猫', description: 'Woven from threads of teamwork' },
      nightcoder:   { name: 'phantom_cat', nameZh: '幽灵猫', description: 'Stalks code under moonlight' },
      scholar:      { name: 'sage_cat',    nameZh: '贤者猫', description: 'Wisdom from deep code reading' },
    },
  },
  shelldragon: {
    growth: {
      python:     { name: 'venom_dragon',  nameZh: '蛇毒龙', description: 'Venomous Python strikes with precision' },
      frontend:   { name: 'prism_dragon',  nameZh: '棱镜龙', description: 'Refracts light into interfaces' },
      backend:    { name: 'forge_dragon',  nameZh: '锻造龙', description: 'Hammers raw metal into systems' },
      scripting:  { name: 'wind_dragon',   nameZh: '疾风龙', description: 'Commands flow like wind' },
      docs:       { name: 'lore_dragon',   nameZh: '典籍龙', description: 'Guarding sacred scrolls' },
      ops:        { name: 'siege_dragon',  nameZh: '攻城龙', description: 'Breaches any deployment barrier' },
      fullstack:  { name: 'fire_dragon',   nameZh: '焰龙',   description: 'All-consuming flame of versatility' },
    },
    final: {
      craftsman:    { name: 'crystal_dragon', nameZh: '晶龙',   description: 'Crystallized perfection' },
      speedster:    { name: 'storm_dragon',   nameZh: '雷暴龙', description: 'Command-line devastation' },
      collaborator: { name: 'twin_dragon',    nameZh: '双生龙', description: 'Two heads, united' },
      nightcoder:   { name: 'abyss_dragon',   nameZh: '深渊龙', description: 'Rises from midnight depths' },
      scholar:      { name: 'elder_dragon',   nameZh: '太古龙', description: 'Wisdom across ages' },
    },
  },
  codeslime: {
    growth: {
      python:     { name: 'acid_slime',   nameZh: '酸液史莱姆',   description: 'Dissolves problems with elegance' },
      frontend:   { name: 'gel_cube',      nameZh: '凝胶方块',     description: 'Structured and styled' },
      backend:    { name: 'metal_slime',   nameZh: '金属史莱姆',   description: 'Hard as steel' },
      scripting:  { name: 'spark_slime',   nameZh: '电光史莱姆',   description: 'Crackling with energy' },
      docs:       { name: 'ink_slime',     nameZh: '墨汁史莱姆',   description: 'Absorbs all knowledge' },
      ops:        { name: 'nano_slime',    nameZh: '纳米史莱姆',   description: 'Infiltrates every container' },
      fullstack:  { name: 'plasma_slime',  nameZh: '等离子史莱姆', description: 'Adapts to any environment' },
    },
    final: {
      craftsman:    { name: 'omega_slime',   nameZh: '终极史莱姆', description: 'Perfection through dedication' },
      speedster:    { name: 'quantum_slime', nameZh: '量子史莱姆', description: 'Superposition of output' },
      collaborator: { name: 'colony_slime',  nameZh: '群体史莱姆', description: 'Many merged through teamwork' },
      nightcoder:   { name: 'shadow_slime',  nameZh: '暗影史莱姆', description: 'Thrives in darkness' },
      scholar:      { name: 'archive_slime', nameZh: '典藏史莱姆', description: 'A living library' },
    },
  },
  gitfox: {
    growth: {
      python:     { name: 'charm_fox',   nameZh: '蛊惑狐', description: 'Enchants with Python spells' },
      frontend:   { name: 'mirror_fox',  nameZh: '镜狐',   description: 'Reflects perfect layouts' },
      backend:    { name: 'steel_fox',   nameZh: '钢狐',   description: 'Tough and reliable' },
      scripting:  { name: 'swift_fox',   nameZh: '迅狐',   description: 'Faster than any script' },
      docs:       { name: 'scroll_fox',  nameZh: '书卷狐', description: 'Reads every scroll' },
      ops:        { name: 'tunnel_fox',  nameZh: '隧道狐', description: 'Burrows through infra' },
      fullstack:  { name: 'branch_fox',  nameZh: '分支狐', description: 'Master of all paths' },
    },
    final: {
      craftsman:    { name: 'origin_fox',  nameZh: '源狐',   description: 'Origin of well-crafted branches' },
      speedster:    { name: 'flash_fox',   nameZh: '闪光狐', description: 'Merges at light speed' },
      collaborator: { name: 'pack_fox',    nameZh: '群狐',   description: 'Leading the pack' },
      nightcoder:   { name: 'phantom_fox', nameZh: '幻影狐', description: 'Appears under starlight' },
      scholar:      { name: 'sage_fox',    nameZh: '智慧狐', description: 'Keeper of repo wisdom' },
    },
  },
  bugowl: {
    growth: {
      python:     { name: 'serpent_owl',   nameZh: '蛇瞳枭', description: 'Sees every exception' },
      frontend:   { name: 'prism_owl',     nameZh: '棱镜枭', description: 'Multi-spectral UI vision' },
      backend:    { name: 'iron_owl',      nameZh: '铁枭',   description: 'Sentinel of stability' },
      scripting:  { name: 'echo_owl',      nameZh: '回声枭', description: 'Hears every shell echo' },
      docs:       { name: 'tome_owl',      nameZh: '古书枭', description: 'Perched on documentation' },
      ops:        { name: 'sentinel_owl',  nameZh: '哨兵枭', description: 'Watches over deployments' },
      fullstack:  { name: 'debug_owl',     nameZh: '调试枭', description: 'Sharp eyes spot any bug' },
    },
    final: {
      craftsman:    { name: 'sage_owl',     nameZh: '贤者枭', description: 'Test-driven wisdom' },
      speedster:    { name: 'gale_owl',     nameZh: '烈风枭', description: 'Swoops at breakneck speed' },
      collaborator: { name: 'chorus_owl',   nameZh: '合唱枭', description: 'Hoots in harmony' },
      nightcoder:   { name: 'spectral_owl', nameZh: '幽灵枭', description: 'Silent midnight presence' },
      scholar:      { name: 'oracle_owl',   nameZh: '神谕枭', description: 'Sees truth in code' },
    },
  },
  pixiebot: {
    growth: {
      python:     { name: 'cipher_bot',   nameZh: '密码机器人',     description: 'Encrypts with Python logic' },
      frontend:   { name: 'chrome_bot',   nameZh: '铬合金机器人',   description: 'Polished for UI perfection' },
      backend:    { name: 'titan_bot',    nameZh: '泰坦机器人',     description: 'Massive processing power' },
      scripting:  { name: 'spark_bot',    nameZh: '火花机器人',     description: 'Crackling with energy' },
      docs:       { name: 'archive_bot',  nameZh: '档案机器人',     description: 'Perfect documentation memory' },
      ops:        { name: 'drone_bot',    nameZh: '无人机器人',     description: 'Autonomous deployment' },
      fullstack:  { name: 'alloy_bot',    nameZh: '合金机器人',     description: 'Versatile alloy for any task' },
    },
    final: {
      craftsman:    { name: 'quantum_bot', nameZh: '量子机器人', description: 'Crafted at edge of possibility' },
      speedster:    { name: 'plasma_bot',  nameZh: '等离子机器人', description: 'Raw speed in plasma circuits' },
      collaborator: { name: 'network_bot', nameZh: '联网机器人', description: 'Connected to every signal' },
      nightcoder:   { name: 'aurora_bot',  nameZh: '极光机器人', description: 'Glows brightest in darkness' },
      scholar:      { name: 'cortex_bot',  nameZh: '皮质机器人', description: 'A brain that never stops' },
    },
  },
};

// ── Detection helpers ──

/** Get dominant programming language from file edit stats */
export function getDominantLang(state: PetState): LangCategory {
  const le = state.stats.langEdits ?? {};
  const total = Object.values(le).reduce((a, b) => a + b, 0);
  if (total === 0) return 'fullstack';

  let maxCat = 'fullstack';
  let maxVal = 0;
  for (const [cat, count] of Object.entries(le)) {
    if (count > maxVal) { maxVal = count; maxCat = cat; }
  }

  // Need at least 30% dominance
  if (maxVal / total < 0.3) return 'fullstack';
  return maxCat as LangCategory;
}

/** Get coding style from habits */
export function getCodingStyle(state: PetState): CodingStyle {
  const s = state.stats;
  const totalActions = s.totalEdits + s.totalBash + s.totalReads;

  // Collaborator: many PRs
  if (s.totalPRs >= 8) return 'collaborator';

  // Nightcoder: >40% of actions at night
  const nightRatio = totalActions > 0 ? (s.nightEdits ?? 0) / totalActions : 0;
  if (nightRatio > 0.4) return 'nightcoder';

  // Scholar: reads >> writes
  if (s.totalReads > s.totalEdits * 2 && s.totalReads > 20) return 'scholar';

  // Craftsman: high test ratio + frequent commits
  const testRatio = totalActions > 0 ? s.totalTests / totalActions : 0;
  const commitDensity = s.totalEdits > 0 ? s.totalCommits / s.totalEdits : 0;
  if (testRatio > 0.15 && commitDensity > 0.1) return 'craftsman';

  // Speedster: default
  return 'speedster';
}

// ── Evolution logic ──

/** Check if pet is ready to evolve, return the branch name or null */
export function checkEvolution(state: PetState): string | null {
  const tree = EVOLUTION_TREE[state.species];

  if (state.stage === 'growth' && !state.evolution) {
    // 1st evolution: language-based
    const lang = getDominantLang(state);
    return tree.growth[lang].name;
  }

  if (state.stage === 'final' && state.evolution && !isFinalEvolution(state)) {
    // 2nd evolution: style-based
    const style = getCodingStyle(state);
    return tree.final[style].name;
  }

  return null;
}

/** Check if the pet already has a final-stage evolution */
function isFinalEvolution(state: PetState): boolean {
  const tree = EVOLUTION_TREE[state.species];
  return Object.values(tree.final).some(b => b.name === state.evolution);
}

/** Get evolution info by name */
export function getEvolutionInfo(species: Species, name: string): EvolutionBranch | null {
  const tree = EVOLUTION_TREE[species];
  // Search growth branches
  for (const branch of Object.values(tree.growth)) {
    if (branch.name === name) return branch;
  }
  // Search final branches
  for (const branch of Object.values(tree.final)) {
    if (branch.name === name) return branch;
  }
  return null;
}

/** Apply evolution to pet state */
export function applyEvolution(state: PetState, branchName: string): void {
  state.evolution = branchName;
  state.pendingEvolution = branchName;
}
