import type { PetState, Species, Stage } from './types.js';

/** Evolution branch definition */
export interface EvolutionBranch {
  name: string;
  nameZh: string;
  condition: (state: PetState) => boolean;
  description: string;
}

/** Evolution tree: species → stage → branches */
export const EVOLUTION_TREE: Record<Species, Record<string, EvolutionBranch[]>> = {
  bitcat: {
    growth: [
      {
        name: 'shadow_cat',
        nameZh: '影猫',
        condition: (s) => editRatio(s) > 0.6,
        description: 'Born from countless lines of code written in silence',
      },
      {
        name: 'solar_cat',
        nameZh: '日猫',
        condition: (s) => bashRatio(s) > 0.6,
        description: 'Empowered by the blazing speed of shell commands',
      },
    ],
    final: [
      {
        name: 'void_cat',
        nameZh: '虚空猫',
        condition: (s) => s.bond > 80,
        description: 'Deep bond transcends the digital realm',
      },
      {
        name: 'storm_cat',
        nameZh: '雷猫',
        condition: (s) => avgMood(s) > 70,
        description: 'Perpetual joy crystallized into lightning',
      },
    ],
  },
  shelldragon: {
    growth: [
      {
        name: 'fire_dragon',
        nameZh: '焰龙',
        condition: (s) => bashRatio(s) > 0.6,
        description: 'Forged in the fires of a thousand shell commands',
      },
      {
        name: 'ice_dragon',
        nameZh: '冰龙',
        condition: (s) => readRatio(s) > 0.5,
        description: 'Cool and methodical, born from careful code reading',
      },
    ],
    final: [
      {
        name: 'storm_dragon',
        nameZh: '雷暴龙',
        condition: (s) => s.stats.totalBash > 500,
        description: 'Absolute mastery of the command line',
      },
      {
        name: 'crystal_dragon',
        nameZh: '晶龙',
        condition: (s) => s.bond > 80,
        description: 'Crystallized from unbreakable trust',
      },
    ],
  },
  codeslime: {
    growth: [
      {
        name: 'gel_cube',
        nameZh: '凝胶方块',
        condition: (s) => s.level >= 16 && editRatio(s) > 0.5,
        description: 'Structured and organized, code given form',
      },
      {
        name: 'plasma_slime',
        nameZh: '等离子史莱姆',
        condition: (s) => s.stats.totalTests > 50,
        description: 'Energized by the spark of passing tests',
      },
    ],
    final: [
      {
        name: 'omega_slime',
        nameZh: '终极史莱姆',
        condition: (s) => s.stats.sessionMinutes > 3000,
        description: 'Evolved through sheer dedication and time',
      },
      {
        name: 'quantum_slime',
        nameZh: '量子史莱姆',
        condition: (s) => avgMood(s) > 75,
        description: 'Exists in superposition of pure happiness',
      },
    ],
  },
  gitfox: {
    growth: [
      {
        name: 'branch_fox',
        nameZh: '分支狐',
        condition: (s) => s.stats.totalCommits > 30,
        description: 'Master of branching timelines',
      },
      {
        name: 'merge_fox',
        nameZh: '合流狐',
        condition: (s) => s.stats.totalPRs > 10,
        description: 'Bringing code together in harmony',
      },
    ],
    final: [
      {
        name: 'origin_fox',
        nameZh: '源狐',
        condition: (s) => s.stats.totalCommits > 100,
        description: 'The origin of all branches, keeper of history',
      },
      {
        name: 'phantom_fox',
        nameZh: '幻影狐',
        condition: (s) => s.stats.loginStreak > 14,
        description: 'Appears faithfully every day without fail',
      },
    ],
  },
  bugowl: {
    growth: [
      {
        name: 'debug_owl',
        nameZh: '调试枭',
        condition: (s) => s.stats.totalTests > 50,
        description: 'Sharp eyes that spot every bug',
      },
      {
        name: 'night_owl',
        nameZh: '夜枭',
        condition: (s) => s.stats.sessionMinutes > 1000,
        description: 'Burns the midnight oil, ever vigilant',
      },
    ],
    final: [
      {
        name: 'sage_owl',
        nameZh: '贤者枭',
        condition: (s) => s.bond > 80 && s.stats.totalTests > 100,
        description: 'Wisdom earned through countless test cycles',
      },
      {
        name: 'spectral_owl',
        nameZh: '幽灵枭',
        condition: (s) => s.stats.loginStreak > 14,
        description: 'A silent presence that never leaves your side',
      },
    ],
  },
  pixiebot: {
    growth: [
      {
        name: 'chrome_bot',
        nameZh: '铬合金机器人',
        condition: (s) => editRatio(s) > 0.5,
        description: 'Polished and refined through code crafting',
      },
      {
        name: 'spark_bot',
        nameZh: '火花机器人',
        condition: (s) => bashRatio(s) > 0.5,
        description: 'Crackling with command-line energy',
      },
    ],
    final: [
      {
        name: 'quantum_bot',
        nameZh: '量子机器人',
        condition: (s) => s.stats.totalEdits > 500,
        description: 'Computing at the edge of possibility',
      },
      {
        name: 'aurora_bot',
        nameZh: '极光机器人',
        condition: (s) => avgMood(s) > 80,
        description: 'Radiating pure digital bliss',
      },
    ],
  },
};

// Helper functions for evolution conditions
function totalActions(s: PetState): number {
  return s.stats.totalEdits + s.stats.totalBash + s.stats.totalReads + s.stats.totalCommits + s.stats.totalPRs + s.stats.totalTests;
}

function editRatio(s: PetState): number {
  const total = totalActions(s);
  return total === 0 ? 0 : s.stats.totalEdits / total;
}

function bashRatio(s: PetState): number {
  const total = totalActions(s);
  return total === 0 ? 0 : s.stats.totalBash / total;
}

function readRatio(s: PetState): number {
  const total = totalActions(s);
  return total === 0 ? 0 : s.stats.totalReads / total;
}

function avgMood(s: PetState): number {
  const h = s.stats.moodHistory;
  if (h.length === 0) return s.mood;
  return h.reduce((a, b) => a + b, 0) / h.length;
}

/** Check if pet is ready to evolve, return the branch name or null */
export function checkEvolution(state: PetState): string | null {
  const stage = state.stage;
  const tree = EVOLUTION_TREE[state.species];

  // Already at the evolution for this stage?
  let targetStageKey: string | null = null;
  if (stage === 'growth' && !state.evolution) {
    targetStageKey = 'growth';
  } else if (stage === 'final' && state.evolution && !isFinalEvolution(state)) {
    targetStageKey = 'final';
  }

  if (!targetStageKey || !tree[targetStageKey]) return null;

  const branches = tree[targetStageKey];
  for (const branch of branches) {
    if (branch.condition(state)) {
      return branch.name;
    }
  }

  // Default to first branch if at the right level but no condition met
  // (fallback so pets always evolve eventually)
  return branches[0].name;
}

/** Check if the pet already has a final-stage evolution */
function isFinalEvolution(state: PetState): boolean {
  const tree = EVOLUTION_TREE[state.species];
  if (!tree.final) return false;
  return tree.final.some(b => b.name === state.evolution);
}

/** Get evolution info by name */
export function getEvolutionInfo(species: Species, name: string): EvolutionBranch | null {
  const tree = EVOLUTION_TREE[species];
  for (const branches of Object.values(tree)) {
    const found = branches.find(b => b.name === name);
    if (found) return found;
  }
  return null;
}

/** Apply evolution to pet state */
export function applyEvolution(state: PetState, branchName: string): void {
  state.evolution = branchName;
  state.pendingEvolution = branchName;
}
