import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { AnimState, AnimTrigger } from './frames.js';

const ANIM_FILE = join(homedir(), '.claude-minipet', 'anim.json');

/** Read current animation state from disk */
export function loadAnimState(): AnimState | null {
  try {
    const raw = readFileSync(ANIM_FILE, 'utf-8');
    return JSON.parse(raw) as AnimState;
  } catch {
    return null;
  }
}

/** Write animation trigger to disk */
export function triggerAnim(trigger: AnimTrigger): void {
  const state: AnimState = {
    trigger,
    triggeredAt: Date.now(),
    frame: 0,
  };
  writeFileSync(ANIM_FILE, JSON.stringify(state), 'utf-8');
}
