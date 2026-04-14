import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { PetState, PetConfig, Species, Rarity, Stage, Stats, HookInput } from './types.js';
import { EXP_REWARDS, SPECIES_BONUSES } from './types.js';

const DATA_DIR = join(homedir(), '.claude-minipet');
const STATE_FILE = join(DATA_DIR, 'state.json');
const CONFIG_FILE = join(DATA_DIR, 'config.json');

export function getDataDir(): string {
  return DATA_DIR;
}

export function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

/** Read pet state from disk */
export function loadState(): PetState | null {
  try {
    const raw = readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(raw) as PetState;
  } catch {
    return null;
  }
}

/** Write pet state to disk */
export function saveState(state: PetState): void {
  ensureDataDir();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

/** Read config from disk */
export function loadConfig(): PetConfig {
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw) as PetConfig;
  } catch {
    return { language: 'zh', animationsEnabled: true, statusLineRows: 3 };
  }
}

/** Write config to disk */
export function saveConfig(config: PetConfig): void {
  ensureDataDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/** Calculate EXP required to reach a given level */
export function expForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

/** Determine stage from level */
export function stageFromLevel(level: number): Stage {
  if (level < 16) return 'baby';
  if (level < 41) return 'growth';
  return 'final';
}

/** Create initial pet state */
export function createPet(name: string, species: Species, dna: string, rarity: Rarity): PetState {
  const now = new Date().toISOString();
  const today = new Date().toISOString().slice(0, 10);
  return {
    name,
    species,
    dna,
    rarity,
    level: 1,
    exp: 0,
    expToNext: expForLevel(2),
    hunger: 100,
    mood: 80,
    bond: 0,
    stage: 'baby',
    evolution: null,
    pendingEvolution: null,
    createdAt: now,
    lastFed: now,
    lastInteraction: now,
    stats: {
      totalEdits: 0,
      totalBash: 0,
      totalReads: 0,
      totalCommits: 0,
      totalPRs: 0,
      totalTests: 0,
      totalSessions: 0,
      sessionMinutes: 0,
      loginStreak: 1,
      lastLoginDate: today,
      moodHistory: [80],
    },
  };
}

/** Award EXP and handle level ups. Returns messages for display. */
export function awardExp(state: PetState, baseExp: number, type: string): string[] {
  const messages: string[] = [];
  const bonus = SPECIES_BONUSES[state.species];

  let exp = baseExp;

  // Apply species bonus
  if (bonus.type === type) {
    exp = Math.floor(exp * bonus.multiplier);
  }
  // Codeslime's bonus is applied at level-up check (lower requirements)

  // Starving penalty
  if (state.hunger <= 0) {
    exp = Math.floor(exp / 2);
  }

  state.exp += exp;
  state.lastInteraction = new Date().toISOString();

  // Check level up
  while (state.exp >= state.expToNext && state.level < 100) {
    state.exp -= state.expToNext;
    state.level++;

    // Codeslime gets reduced EXP requirements
    const nextExp = expForLevel(state.level + 1);
    state.expToNext = state.species === 'codeslime'
      ? Math.floor(nextExp * 0.8)
      : nextExp;

    const newStage = stageFromLevel(state.level);
    if (newStage !== state.stage) {
      state.stage = newStage;
      messages.push(`stage_up:${newStage}`);
    }

    messages.push(`level_up:${state.level}`);
  }

  // Mood boost from activity
  state.mood = Math.min(100, state.mood + 1);
  // Bond slowly increases
  state.bond = Math.min(100, state.bond + 0.1);

  return messages;
}

/** Process a hook event and return messages */
export function processHookEvent(state: PetState, input: HookInput): string[] {
  const messages: string[] = [];

  switch (input.hook_event_name) {
    case 'SessionStart': {
      state.stats.totalSessions++;
      const today = new Date().toISOString().slice(0, 10);
      if (state.stats.lastLoginDate !== today) {
        const lastDate = new Date(state.stats.lastLoginDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000);
        state.stats.loginStreak = diffDays === 1 ? state.stats.loginStreak + 1 : 1;
        state.stats.lastLoginDate = today;

        // Record mood history
        state.stats.moodHistory.push(state.mood);
        if (state.stats.moodHistory.length > 7) {
          state.stats.moodHistory.shift();
        }
      }
      state.mood = Math.min(100, state.mood + 5);
      messages.push('greeting');
      break;
    }

    case 'UserPromptSubmit': {
      messages.push(...awardExp(state, EXP_REWARDS.prompt, 'prompt'));
      break;
    }

    case 'PostToolUse': {
      const toolName = input.tool_name?.toLowerCase() ?? '';
      if (toolName === 'bash') {
        state.stats.totalBash++;
        // Check for git commit
        const cmd = String(input.tool_input?.command ?? '');
        if (cmd.includes('git commit')) {
          state.stats.totalCommits++;
          messages.push(...awardExp(state, EXP_REWARDS.git_commit, 'git'));
        } else if (cmd.includes('git push') || cmd.includes('gh pr create')) {
          state.stats.totalPRs++;
          messages.push(...awardExp(state, EXP_REWARDS.git_pr, 'git'));
        } else if (cmd.includes('test') || cmd.includes('vitest') || cmd.includes('jest') || cmd.includes('pytest')) {
          state.stats.totalTests++;
          const response = input.tool_response ?? '';
          if (response.includes('passed') || response.includes('PASS')) {
            messages.push(...awardExp(state, EXP_REWARDS.test_pass, 'test'));
          } else {
            messages.push(...awardExp(state, EXP_REWARDS.bash, 'bash'));
          }
        } else {
          messages.push(...awardExp(state, EXP_REWARDS.bash, 'bash'));
        }
      } else if (toolName === 'edit' || toolName === 'write') {
        state.stats.totalEdits++;
        messages.push(...awardExp(state, EXP_REWARDS.edit, 'edit'));
      } else if (toolName === 'read') {
        state.stats.totalReads++;
        messages.push(...awardExp(state, EXP_REWARDS.read, 'read'));
      }
      break;
    }

    case 'Stop': {
      // Session ending - small bond boost for engagement
      state.bond = Math.min(100, state.bond + 0.5);
      break;
    }
  }

  // Check pending evolution
  if (state.pendingEvolution) {
    messages.push(`evolution:${state.pendingEvolution}`);
  }

  saveState(state);
  return messages;
}

/** Feed the pet */
export function feedPet(state: PetState): void {
  state.hunger = Math.min(100, state.hunger + 30);
  state.mood = Math.min(100, state.mood + 5);
  state.lastFed = new Date().toISOString();
  saveState(state);
}

/** Pat the pet */
export function patPet(state: PetState): void {
  state.mood = Math.min(100, state.mood + 10);
  state.bond = Math.min(100, state.bond + 2);
  state.lastInteraction = new Date().toISOString();
  saveState(state);
}
