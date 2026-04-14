import { TRANSPARENT as T, PRIMARY as P, SECONDARY as S, EYE as E, MOUTH as M, ACCENT as A } from './pixel.js';
import type { Species, Stage } from '../core/types.js';

/**
 * Sprite data: 2D arrays where each number maps to a palette entry.
 * T = transparent, P = primary color, S = secondary, E = eye, M = mouth, A = accent
 */

// ============================================================
// BITCAT (位猫) - Cat
// ============================================================

const BITCAT_BABY: number[][] = [
  [T, P, P, T, T, P, P, T],
  [P, P, P, P, P, P, P, P],
  [P, E, T, P, P, T, E, P],
  [P, P, P, S, S, P, P, P],
  [P, P, M, M, M, M, P, P],
  [T, P, P, P, P, P, P, T],
  [T, T, P, T, T, P, T, T],
  [T, T, P, T, T, P, T, T],
];

const BITCAT_GROWTH: number[][] = [
  [T, T, P, P, T, T, T, T, P, P, T, T],
  [T, P, P, P, P, T, T, P, P, P, P, T],
  [P, P, P, P, P, P, P, P, P, P, P, P],
  [P, P, E, T, P, P, P, P, T, E, P, P],
  [P, P, P, P, S, S, S, S, P, P, P, P],
  [P, S, P, M, M, M, M, M, M, P, S, P],
  [T, P, P, P, P, P, P, P, P, P, P, T],
  [T, P, S, S, P, P, P, P, S, S, P, T],
  [T, T, P, P, P, P, P, P, P, P, T, T],
  [T, T, P, T, T, T, T, T, T, P, T, T],
  [T, T, P, T, T, T, T, T, T, P, T, T],
  [T, T, P, P, T, T, T, T, P, P, T, T],
];

const BITCAT_FINAL: number[][] = [
  [T, T, T, P, P, T, T, T, T, T, T, P, P, T, T, T],
  [T, T, P, P, P, P, T, T, T, T, P, P, P, P, T, T],
  [T, P, P, A, P, P, P, T, T, P, P, A, P, P, P, T],
  [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
  [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
  [P, P, E, E, T, P, P, P, P, P, P, T, E, E, P, P],
  [P, P, P, P, P, S, S, S, S, S, S, P, P, P, P, P],
  [P, S, P, P, M, M, M, M, M, M, M, M, P, P, S, P],
  [T, P, P, P, P, P, P, P, P, P, P, P, P, P, P, T],
  [T, P, S, S, S, P, P, P, P, P, P, S, S, S, P, T],
  [T, T, P, P, P, P, P, P, P, P, P, P, P, P, T, T],
  [T, T, P, P, P, P, P, T, T, P, P, P, P, P, T, T],
  [T, T, T, P, P, T, T, T, T, T, T, P, P, T, T, T],
  [T, T, T, P, T, T, T, T, T, T, T, T, P, T, T, T],
  [T, T, T, P, P, T, T, T, T, T, T, P, P, T, T, T],
  [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
];

// ============================================================
// SHELLDRAGON (壳龙) - Small Dragon
// ============================================================

const SHELLDRAGON_BABY: number[][] = [
  [T, T, P, P, P, T, T, T],
  [T, P, P, P, P, P, T, T],
  [T, P, E, T, E, P, T, T],
  [T, P, P, M, P, P, T, T],
  [P, P, P, P, P, P, P, T],
  [T, S, P, P, P, S, T, T],
  [T, T, P, T, P, T, T, T],
  [T, T, P, T, P, T, T, T],
];

const SHELLDRAGON_GROWTH: number[][] = [
  [T, T, A, T, T, T, T, T, T, T, T, T],
  [T, T, A, P, P, P, P, T, T, T, T, T],
  [T, P, P, P, P, P, P, P, T, T, T, T],
  [T, P, P, E, T, E, P, P, T, T, T, T],
  [T, P, P, P, M, P, P, P, T, T, T, T],
  [P, P, P, P, P, P, P, P, P, T, T, T],
  [T, S, S, P, P, P, S, S, T, T, T, T],
  [T, T, P, P, P, P, P, T, T, T, T, T],
  [T, T, P, P, T, P, P, T, T, T, T, T],
  [T, T, P, T, T, T, P, P, P, P, T, T],
  [T, T, P, T, T, T, T, T, P, P, A, T],
  [T, T, P, P, T, T, T, T, T, P, A, T],
];

const SHELLDRAGON_FINAL: number[][] = [
  [T, T, T, A, A, T, T, T, T, T, T, T, T, T, T, T],
  [T, T, A, A, P, P, P, T, T, T, T, T, T, T, T, T],
  [T, T, T, P, P, P, P, P, P, T, T, T, T, T, T, T],
  [T, T, P, P, P, P, P, P, P, P, T, T, T, T, T, T],
  [T, P, P, P, E, E, T, E, E, P, P, T, T, T, T, T],
  [T, P, P, P, P, P, M, P, P, P, P, T, T, T, T, T],
  [A, P, P, P, P, P, P, P, P, P, P, A, T, T, T, T],
  [T, S, S, S, P, P, P, P, S, S, S, T, T, T, T, T],
  [T, T, P, P, P, P, P, P, P, P, T, T, T, T, T, T],
  [T, T, P, P, P, P, P, P, P, P, T, T, T, T, T, T],
  [T, T, P, P, T, T, T, T, P, P, T, T, T, T, T, T],
  [T, T, P, T, T, T, T, T, T, P, P, P, P, T, T, T],
  [T, T, P, T, T, T, T, T, T, T, P, P, P, A, T, T],
  [T, T, P, P, T, T, T, T, T, T, T, P, P, A, A, T],
  [T, T, T, T, T, T, T, T, T, T, T, T, P, A, T, T],
  [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
];

// ============================================================
// CODESLIME (码史莱姆) - Jelly Blob
// ============================================================

const CODESLIME_BABY: number[][] = [
  [T, T, T, T, T, T, T, T],
  [T, T, P, P, P, P, T, T],
  [T, P, P, P, P, P, P, T],
  [T, P, E, P, P, E, P, T],
  [T, P, P, M, M, P, P, T],
  [T, P, P, P, P, P, P, T],
  [P, P, P, P, P, P, P, P],
  [T, S, S, S, S, S, S, T],
];

const CODESLIME_GROWTH: number[][] = [
  [T, T, T, T, T, T, T, T, T, T, T, T],
  [T, T, T, P, P, P, P, P, P, T, T, T],
  [T, T, P, P, P, P, P, P, P, P, T, T],
  [T, P, P, P, P, P, P, P, P, P, P, T],
  [T, P, P, E, T, P, P, T, E, P, P, T],
  [T, P, P, P, P, P, P, P, P, P, P, T],
  [T, P, P, P, M, M, M, M, P, P, P, T],
  [T, P, P, P, P, P, P, P, P, P, P, T],
  [P, P, P, P, P, P, P, P, P, P, P, P],
  [P, P, P, P, P, P, P, P, P, P, P, P],
  [T, S, S, S, S, S, S, S, S, S, S, T],
  [T, T, S, S, S, S, S, S, S, S, T, T],
];

const CODESLIME_FINAL: number[][] = [
  [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
  [T, T, T, T, T, A, A, A, A, A, A, T, T, T, T, T],
  [T, T, T, T, P, P, P, P, P, P, P, P, T, T, T, T],
  [T, T, T, P, P, P, P, P, P, P, P, P, P, T, T, T],
  [T, T, P, P, P, P, P, P, P, P, P, P, P, P, T, T],
  [T, P, P, P, E, E, T, P, P, T, E, E, P, P, P, T],
  [T, P, P, P, P, P, P, P, P, P, P, P, P, P, P, T],
  [T, P, P, P, P, M, M, M, M, M, M, P, P, P, P, T],
  [T, P, P, P, P, P, P, P, P, P, P, P, P, P, P, T],
  [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
  [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
  [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
  [T, S, S, S, S, S, S, S, S, S, S, S, S, S, S, T],
  [T, T, S, S, S, S, S, S, S, S, S, S, S, S, T, T],
  [T, T, T, S, S, S, S, S, S, S, S, S, S, T, T, T],
  [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
];

// ============================================================
// GITFOX (吉狐) - Fox
// ============================================================

const GITFOX_BABY: number[][] = [
  [P, P, T, T, T, T, P, P],
  [P, P, P, T, T, P, P, P],
  [P, P, P, P, P, P, P, P],
  [P, E, T, S, S, T, E, P],
  [P, P, S, M, M, S, P, P],
  [T, P, S, S, S, S, P, T],
  [T, T, P, T, T, P, T, T],
  [T, T, P, T, T, P, T, T],
];

const GITFOX_GROWTH: number[][] = [
  [T, P, P, T, T, T, T, T, T, P, P, T],
  [P, P, P, P, T, T, T, T, P, P, P, P],
  [P, P, P, P, P, T, T, P, P, P, P, P],
  [T, P, P, P, P, P, P, P, P, P, P, T],
  [T, P, P, E, T, S, S, T, E, P, P, T],
  [T, P, P, P, S, S, S, S, P, P, P, T],
  [T, T, P, S, S, M, M, S, S, P, T, T],
  [T, T, P, P, S, S, S, S, P, P, T, T],
  [T, T, T, P, P, P, P, P, P, T, T, T],
  [T, T, T, P, T, T, T, T, P, T, T, T],
  [T, T, T, P, T, T, T, T, P, T, T, T],
  [T, T, P, P, T, T, T, T, P, P, T, T],
];

const GITFOX_FINAL: number[][] = [
  [T, T, P, P, T, T, T, T, T, T, T, T, T, P, P, T],
  [T, P, P, P, P, T, T, T, T, T, T, T, P, P, P, T],
  [P, P, A, P, P, P, T, T, T, T, T, P, P, A, P, P],
  [T, P, P, P, P, P, P, T, T, P, P, P, P, P, P, T],
  [T, T, P, P, P, P, P, P, P, P, P, P, P, P, T, T],
  [T, T, P, P, E, E, T, S, S, T, E, E, P, P, T, T],
  [T, T, P, P, P, P, S, S, S, S, P, P, P, P, T, T],
  [T, T, T, P, P, S, S, M, M, S, S, P, P, T, T, T],
  [T, T, T, P, P, P, S, S, S, S, P, P, P, T, T, T],
  [T, T, T, T, P, P, P, P, P, P, P, P, T, T, T, T],
  [T, T, T, T, P, P, T, T, T, T, P, P, T, T, T, T],
  [T, T, T, T, P, T, T, T, T, T, T, P, T, T, T, T],
  [T, T, T, P, P, T, T, T, T, T, T, P, P, T, T, T],
  [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
  [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
  [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
];

// ============================================================
// BUGOWL (虫枭) - Owl
// ============================================================

const BUGOWL_BABY: number[][] = [
  [T, P, P, P, P, P, P, T],
  [P, P, S, P, P, S, P, P],
  [P, S, E, S, S, E, S, P],
  [P, P, S, P, P, S, P, P],
  [T, P, P, M, M, P, P, T],
  [T, P, P, P, P, P, P, T],
  [T, T, P, P, P, P, T, T],
  [T, T, P, T, T, P, T, T],
];

const BUGOWL_GROWTH: number[][] = [
  [T, T, T, A, A, A, A, A, A, T, T, T],
  [T, T, P, P, P, P, P, P, P, P, T, T],
  [T, P, P, P, P, P, P, P, P, P, P, T],
  [P, P, P, S, S, P, P, S, S, P, P, P],
  [P, P, S, S, E, S, S, E, S, S, P, P],
  [P, P, P, S, S, P, P, S, S, P, P, P],
  [T, P, P, P, P, M, M, P, P, P, P, T],
  [T, P, P, P, P, P, P, P, P, P, P, T],
  [T, T, P, P, P, P, P, P, P, P, T, T],
  [T, P, T, P, P, P, P, P, P, T, P, T],
  [T, T, T, T, P, T, T, P, T, T, T, T],
  [T, T, T, T, P, T, T, P, T, T, T, T],
];

const BUGOWL_FINAL: number[][] = [
  [T, T, T, T, T, A, A, A, A, A, A, T, T, T, T, T],
  [T, T, T, T, A, A, A, A, A, A, A, A, T, T, T, T],
  [T, T, T, P, P, P, P, P, P, P, P, P, P, T, T, T],
  [T, T, P, P, P, P, P, P, P, P, P, P, P, P, T, T],
  [T, P, P, P, P, P, P, P, P, P, P, P, P, P, P, T],
  [P, P, P, S, S, S, P, P, P, P, S, S, S, P, P, P],
  [P, P, S, S, E, E, S, P, P, S, E, E, S, S, P, P],
  [P, P, P, S, S, S, P, P, P, P, S, S, S, P, P, P],
  [T, P, P, P, P, P, M, M, M, M, P, P, P, P, P, T],
  [T, P, P, P, P, P, P, P, P, P, P, P, P, P, P, T],
  [T, T, P, P, P, P, P, P, P, P, P, P, P, P, T, T],
  [T, P, P, T, P, P, P, P, P, P, P, P, T, P, P, T],
  [P, P, T, T, T, P, P, P, P, P, P, T, T, T, P, P],
  [T, T, T, T, T, T, P, T, T, P, T, T, T, T, T, T],
  [T, T, T, T, T, T, P, T, T, P, T, T, T, T, T, T],
  [T, T, T, T, T, P, P, T, T, P, P, T, T, T, T, T],
];

// ============================================================
// PIXIEBOT (像素精灵) - Robot
// ============================================================

const PIXIEBOT_BABY: number[][] = [
  [T, T, A, A, A, A, T, T],
  [T, P, P, P, P, P, P, T],
  [T, P, E, S, S, E, P, T],
  [T, P, S, S, S, S, P, T],
  [T, P, P, M, M, P, P, T],
  [T, S, P, P, P, P, S, T],
  [T, T, P, P, P, P, T, T],
  [T, T, P, T, T, P, T, T],
];

const PIXIEBOT_GROWTH: number[][] = [
  [T, T, T, T, A, A, A, A, T, T, T, T],
  [T, T, T, A, A, A, A, A, A, T, T, T],
  [T, T, P, P, P, P, P, P, P, P, T, T],
  [T, P, P, P, P, P, P, P, P, P, P, T],
  [T, P, P, E, S, S, S, S, E, P, P, T],
  [T, P, P, S, S, S, S, S, S, P, P, T],
  [T, P, P, P, M, M, M, M, P, P, P, T],
  [T, S, S, P, P, P, P, P, P, S, S, T],
  [T, T, P, P, P, P, P, P, P, P, T, T],
  [T, T, P, P, P, P, P, P, P, P, T, T],
  [T, T, T, P, P, T, T, P, P, T, T, T],
  [T, T, T, P, P, T, T, P, P, T, T, T],
];

const PIXIEBOT_FINAL: number[][] = [
  [T, T, T, T, T, A, A, A, A, A, A, T, T, T, T, T],
  [T, T, T, T, A, A, A, A, A, A, A, A, T, T, T, T],
  [T, T, T, P, P, P, P, P, P, P, P, P, P, T, T, T],
  [T, T, P, P, P, P, P, P, P, P, P, P, P, P, T, T],
  [T, P, P, P, P, P, P, P, P, P, P, P, P, P, P, T],
  [T, P, P, E, E, S, S, S, S, S, S, E, E, P, P, T],
  [T, P, P, P, S, S, S, S, S, S, S, S, P, P, P, T],
  [T, P, P, P, P, M, M, M, M, M, M, P, P, P, P, T],
  [T, S, S, S, P, P, P, P, P, P, P, P, S, S, S, T],
  [T, T, P, P, P, P, P, P, P, P, P, P, P, P, T, T],
  [T, T, P, P, P, P, P, P, P, P, P, P, P, P, T, T],
  [T, T, T, P, P, P, P, P, P, P, P, P, P, T, T, T],
  [T, T, T, T, P, P, T, T, T, T, P, P, T, T, T, T],
  [T, T, T, T, P, P, T, T, T, T, P, P, T, T, T, T],
  [T, T, T, P, P, P, T, T, T, T, P, P, P, T, T, T],
  [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
];

// ============================================================
// SPRITE REGISTRY
// ============================================================

const SPRITES: Record<Species, Record<Stage, number[][]>> = {
  bitcat:      { baby: BITCAT_BABY,      growth: BITCAT_GROWTH,      final: BITCAT_FINAL },
  shelldragon: { baby: SHELLDRAGON_BABY, growth: SHELLDRAGON_GROWTH, final: SHELLDRAGON_FINAL },
  codeslime:   { baby: CODESLIME_BABY,   growth: CODESLIME_GROWTH,   final: CODESLIME_FINAL },
  gitfox:      { baby: GITFOX_BABY,      growth: GITFOX_GROWTH,      final: GITFOX_FINAL },
  bugowl:      { baby: BUGOWL_BABY,      growth: BUGOWL_GROWTH,      final: BUGOWL_FINAL },
  pixiebot:    { baby: PIXIEBOT_BABY,    growth: PIXIEBOT_GROWTH,    final: PIXIEBOT_FINAL },
};

/** Get sprite grid for a species and stage */
export function getSprite(species: Species, stage: Stage): number[][] {
  return SPRITES[species][stage];
}

/** Species display names */
export const SPECIES_NAMES: Record<Species, { en: string; zh: string }> = {
  bitcat:      { en: 'Bitcat',      zh: '位猫' },
  shelldragon: { en: 'Shelldragon', zh: '壳龙' },
  codeslime:   { en: 'Codeslime',   zh: '码史莱姆' },
  gitfox:      { en: 'Gitfox',      zh: '吉狐' },
  bugowl:      { en: 'Bugowl',      zh: '虫枭' },
  pixiebot:    { en: 'Pixiebot',    zh: '像素精灵' },
};
