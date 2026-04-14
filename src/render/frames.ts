import { TRANSPARENT as T, PRIMARY as P, SECONDARY as S, EYE as E, MOUTH as M, ACCENT as A } from './pixel.js';
import type { Species, Stage } from '../core/types.js';

/**
 * Animation system: each sprite has multiple frames.
 * Frame 0 = default idle
 * Frame 1 = idle variant (blink/breathe/sway)
 * Frame 2 = happy (EXP gain, pat)
 * Frame 3 = eating (feed)
 * Frame 4 = excited (level up)
 *
 * We only define variant pixels — the rest falls through to the base sprite.
 * A "frame override" is a sparse map of [y][x] → pixel value.
 */

export type FrameOverride = Map<string, number>; // key = "y,x"

/** Animation trigger types */
export type AnimTrigger = 'idle' | 'exp' | 'feed' | 'pat' | 'levelup' | 'evolve' | 'hungry' | 'sad';

/** Animation state stored on disk */
export interface AnimState {
  trigger: AnimTrigger;
  triggeredAt: number; // Date.now()
  frame: number;
}

/** How long each triggered animation lasts (ms) */
export const ANIM_DURATION: Record<AnimTrigger, number> = {
  idle: 0,       // permanent cycle
  exp: 3000,     // 3 seconds
  feed: 4000,    // 4 seconds
  pat: 3000,
  levelup: 6000,
  evolve: 8000,
  hungry: 5000,
  sad: 5000,
};

/** Number of frames per trigger animation */
export const ANIM_FRAMES: Record<AnimTrigger, number> = {
  idle: 3,
  exp: 2,
  feed: 3,
  pat: 2,
  levelup: 3,
  evolve: 2,
  hungry: 2,
  sad: 2,
};

/**
 * Get the current animation frame index based on time.
 * For idle: cycles through frames based on current time.
 * For triggered: cycles through frames within duration, then returns to idle.
 */
export function getCurrentFrame(anim: AnimState | null): { trigger: AnimTrigger; frame: number } {
  if (!anim || anim.trigger === 'idle') {
    // Idle: cycle through 3 frames, switching every 5 seconds
    const frame = Math.floor(Date.now() / 2000) % ANIM_FRAMES.idle;
    return { trigger: 'idle', frame };
  }

  const elapsed = Date.now() - anim.triggeredAt;
  const duration = ANIM_DURATION[anim.trigger];

  if (elapsed > duration) {
    // Animation expired, back to idle
    const frame = Math.floor(Date.now() / 2000) % ANIM_FRAMES.idle;
    return { trigger: 'idle', frame };
  }

  // Cycle through animation frames during duration
  const totalFrames = ANIM_FRAMES[anim.trigger];
  const frameTime = duration / (totalFrames * 2); // each frame shows twice
  const frame = Math.floor(elapsed / frameTime) % totalFrames;
  return { trigger: anim.trigger, frame };
}

/**
 * Eye overrides per mood and animation state.
 * Returns the character to use for eyes in the sprite.
 */
export function getEyeForAnim(trigger: AnimTrigger, frame: number, mood: number): string {
  switch (trigger) {
    case 'idle':
      if (frame === 1) return '-'; // blink
      if (mood >= 80) return '*';  // star eyes
      if (mood >= 40) return 'o';
      return '.';
    case 'exp':
      return frame === 0 ? '^' : '*'; // excited
    case 'feed':
      return frame === 1 ? '-' : '>'; // happy eating
    case 'pat':
      return frame === 0 ? '~' : '^'; // content
    case 'levelup':
      return ['*', '!', '*'][frame] ?? '*'; // sparkling
    case 'evolve':
      return frame === 0 ? '!' : '*';
    case 'hungry':
      return frame === 0 ? '.' : ';'; // sad/weak
    case 'sad':
      return frame === 0 ? 'T' : ';';
    default:
      return 'o';
  }
}

/**
 * Mouth overrides per animation state.
 */
export function getMouthForAnim(trigger: AnimTrigger, frame: number, mood: number): string {
  switch (trigger) {
    case 'idle':
      if (frame === 2) return 'o'; // yawn
      if (mood >= 60) return 'v';  // smile
      if (mood >= 30) return '-';
      return '~';
    case 'exp':
      return frame === 0 ? 'v' : 'V'; // grin
    case 'feed':
      return ['o', 'O', 'v'][frame] ?? 'o'; // nom nom
    case 'pat':
      return frame === 0 ? 'v' : 'w'; // purr
    case 'levelup':
      return ['V', 'O', 'V'][frame] ?? 'V'; // celebrating
    case 'evolve':
      return frame === 0 ? 'O' : 'V';
    case 'hungry':
      return frame === 0 ? '~' : '.'; // weak
    case 'sad':
      return frame === 0 ? 'n' : '~';
    default:
      return '-';
  }
}

/**
 * Body position offset for bouncy animations.
 * Returns [dx, dy] to shift the sprite.
 */
export function getBodyOffset(trigger: AnimTrigger, frame: number): [number, number] {
  switch (trigger) {
    case 'exp':
      return frame === 1 ? [0, -1] : [0, 0]; // bounce up
    case 'pat':
      return frame === 1 ? [0, 0] : [0, 0];
    case 'levelup':
      return [0, frame === 1 ? -1 : 0]; // bounce
    case 'feed':
      return [frame === 1 ? 1 : 0, 0]; // lean forward
    default:
      return [0, 0];
  }
}

/**
 * Status line decoration text per animation.
 */
export function getAnimDecoration(trigger: AnimTrigger, frame: number): string {
  switch (trigger) {
    case 'exp':
      return frame === 0 ? ' +EXP!' : '  +EXP!';
    case 'feed':
      return ['  nom~', ' nom nom~', '  yum!'][frame] ?? '';
    case 'pat':
      return frame === 0 ? '  purr~' : '   purr~~';
    case 'levelup':
      return ['  LEVEL UP!', ' ★LEVEL UP!★', '  LEVEL UP!'][frame] ?? '';
    case 'evolve':
      return frame === 0 ? '  EVOLVING...' : '  ★EVOLVED!★';
    case 'hungry':
      return frame === 0 ? '  hungry...' : '  feed me...';
    case 'sad':
      return frame === 0 ? '  ...' : '  zzz';
    default:
      return '';
  }
}
