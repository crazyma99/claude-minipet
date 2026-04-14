import type { Rarity } from './types.js';

/** Display info for each rarity tier */
export const RARITY_INFO: Record<Rarity, {
  label: string;
  labelZh: string;
  stars: string;
  color: { r: number; g: number; b: number };
  hasGlow: boolean;
  hasSparkle: boolean;
  hasBorder: boolean;
}> = {
  common: {
    label: 'Common',
    labelZh: '普通',
    stars: '☆',
    color: { r: 180, g: 180, b: 180 },
    hasGlow: false,
    hasSparkle: false,
    hasBorder: false,
  },
  uncommon: {
    label: 'Uncommon',
    labelZh: '优秀',
    stars: '★',
    color: { r: 46, g: 213, b: 115 },
    hasGlow: false,
    hasSparkle: false,
    hasBorder: false,
  },
  rare: {
    label: 'Rare',
    labelZh: '稀有',
    stars: '★★',
    color: { r: 69, g: 170, b: 242 },
    hasGlow: false,
    hasSparkle: false,
    hasBorder: false,
  },
  legendary: {
    label: 'Legendary',
    labelZh: '传说',
    stars: '★★★',
    color: { r: 255, g: 214, b: 10 },
    hasGlow: true,
    hasSparkle: false,
    hasBorder: false,
  },
  shiny: {
    label: 'Shiny',
    labelZh: '异色',
    stars: '✦✦✦',
    color: { r: 243, g: 104, b: 224 },
    hasGlow: true,
    hasSparkle: true,
    hasBorder: true,
  },
};

/** Get rarity display text */
export function getRarityDisplay(rarity: Rarity, lang: 'zh' | 'en' = 'zh'): string {
  const info = RARITY_INFO[rarity];
  const label = lang === 'zh' ? info.labelZh : info.label;
  return `${info.stars} [${label}]`;
}
