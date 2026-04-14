/** All species available in the game */
export type Species = 'bitcat' | 'shelldragon' | 'codeslime' | 'gitfox' | 'bugowl' | 'pixiebot';

/** Rarity tiers with their visual properties */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary' | 'shiny';

/** Evolution stages */
export type Stage = 'baby' | 'growth' | 'final';

/** Pattern types for pet appearance */
export type Pattern = 'solid' | 'stripes' | 'spots' | 'gradient' | 'zigzag' | 'diamond' | 'swirl' | 'dots';

/** Eye styles */
export type EyeStyle = 'round' | 'star' | 'squint' | 'heterochromia' | 'dot' | 'wide' | 'angry' | 'sleepy';

/** Accessory types */
export type Accessory = 'none' | 'hat' | 'scarf' | 'bow' | 'horns' | 'crown' | 'glasses' | 'bandana';

/** RGB color */
export interface Color {
  r: number;
  g: number;
  b: number;
}

/** The DNA structure that determines all visual traits */
export interface DNA {
  raw: string;           // hex string e.g. "A3-F7-2B-E1-8C-D4-09-5F"
  species: Species;
  bodyVariation: number; // 0-255, subtle size/shape tweaks
  primaryColor: Color;
  secondaryColor: Color;
  pattern: Pattern;
  eyeStyle: EyeStyle;
  accessory: Accessory;
  rarity: Rarity;
}

/** Activity statistics for evolution conditions */
export interface Stats {
  totalEdits: number;
  totalBash: number;
  totalReads: number;
  totalCommits: number;
  totalPRs: number;
  totalTests: number;
  totalSessions: number;
  sessionMinutes: number;
  loginStreak: number;
  lastLoginDate: string; // YYYY-MM-DD
  moodHistory: number[]; // last 7 days average mood
}

/** The full pet state persisted to disk */
export interface PetState {
  name: string;
  species: Species;
  dna: string;
  rarity: Rarity;
  level: number;
  exp: number;
  expToNext: number;
  hunger: number;
  mood: number;
  bond: number;
  stage: Stage;
  evolution: string | null; // evolution branch name, null if base form
  pendingEvolution: string | null; // set when evolution ready, consumed by next hook
  createdAt: string;
  lastFed: string;
  lastInteraction: string;
  lastComment?: string;       // ISO timestamp of last pet comment
  lastActivityTime?: string;  // ISO timestamp for idle detection
  recentFailures?: number;    // consecutive bash failures counter
  stats: Stats;
}

/** User configuration */
export interface PetConfig {
  language: 'zh' | 'en';
  animationsEnabled: boolean;
  statusLineRows: number;
}

/** Hook event types from Claude Code */
export type HookEvent =
  | 'SessionStart'
  | 'UserPromptSubmit'
  | 'PostToolUse'
  | 'Stop'
  | 'PostToolUseFailure';

/** Data received from Claude Code hooks via stdin */
export interface HookInput {
  session_id: string;
  cwd: string;
  hook_event_name: HookEvent;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_response?: string;
  prompt?: string;
  source?: string;
  last_assistant_message?: string;
}

/** EXP reward table */
export const EXP_REWARDS: Record<string, number> = {
  prompt: 3,
  bash: 5,
  edit: 8,
  write: 8,
  read: 2,
  test_pass: 15,
  git_commit: 20,
  git_pr: 30,
  long_session: 35,
};

/** Species passive bonus descriptions */
export const SPECIES_BONUSES: Record<Species, { description: string; type: string; multiplier: number }> = {
  bitcat: { description: 'Happy when reading files', type: 'read', multiplier: 2 },
  shelldragon: { description: '2x EXP from Bash commands', type: 'bash', multiplier: 2 },
  codeslime: { description: 'Lower EXP requirements', type: 'exp_reduction', multiplier: 0.8 },
  gitfox: { description: 'Extra EXP from Git operations', type: 'git', multiplier: 2 },
  bugowl: { description: '2x EXP from debug/test', type: 'test', multiplier: 2 },
  pixiebot: { description: 'Slower mood decay', type: 'mood_decay', multiplier: 0.5 },
};
