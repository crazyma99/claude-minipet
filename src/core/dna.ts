import { createHash } from 'node:crypto';
import { hostname, userInfo } from 'node:os';
import type { DNA, Species, Rarity, Pattern, EyeStyle, Accessory, Color } from './types.js';

const SPECIES_LIST: Species[] = ['bitcat', 'shelldragon', 'codeslime', 'gitfox', 'bugowl', 'pixiebot'];

const PATTERN_LIST: Pattern[] = ['solid', 'stripes', 'spots', 'gradient', 'zigzag', 'diamond', 'swirl', 'dots'];

const EYE_LIST: EyeStyle[] = ['round', 'star', 'squint', 'heterochromia', 'dot', 'wide', 'angry', 'sleepy'];

const ACCESSORY_LIST: Accessory[] = ['none', 'hat', 'scarf', 'bow', 'horns', 'crown', 'glasses', 'bandana'];

/** Curated color palette for pet primary/secondary colors */
const COLOR_PALETTE: Color[] = [
  { r: 255, g: 107, b: 107 }, // coral red
  { r: 255, g: 159, b: 67 },  // orange
  { r: 255, g: 214, b: 10 },  // yellow
  { r: 72, g: 219, b: 95 },   // green
  { r: 29, g: 209, b: 161 },  // teal
  { r: 69, g: 170, b: 242 },  // sky blue
  { r: 108, g: 92, b: 231 },  // purple
  { r: 200, g: 80, b: 192 },  // pink
  { r: 225, g: 112, b: 85 },  // salmon
  { r: 116, g: 185, b: 255 }, // light blue
  { r: 162, g: 155, b: 254 }, // lavender
  { r: 255, g: 177, b: 66 },  // amber
  { r: 99, g: 205, b: 218 },  // cyan
  { r: 253, g: 150, b: 68 },  // tangerine
  { r: 149, g: 225, b: 211 }, // mint
  { r: 243, g: 104, b: 224 }, // magenta
  { r: 209, g: 216, b: 224 }, // silver
  { r: 72, g: 52, b: 212 },   // indigo
  { r: 255, g: 234, b: 167 }, // cream
  { r: 46, g: 213, b: 115 },  // emerald
  { r: 30, g: 39, b: 46 },    // dark
  { r: 255, g: 255, b: 255 }, // white
  { r: 164, g: 176, b: 190 }, // gray
  { r: 238, g: 82, b: 83 },   // red
];

/** Generate a raw DNA hex string from seed inputs */
export function generateDNAString(username?: string, machineId?: string): string {
  const user = username ?? userInfo().username;
  const machine = machineId ?? hostname();
  const seed = `${user}:${machine}:${Date.now()}:${Math.random()}`;
  const hash = createHash('sha256').update(seed).digest('hex');
  // Take first 8 bytes (16 hex chars) and format as DNA
  const bytes: string[] = [];
  for (let i = 0; i < 16; i += 2) {
    bytes.push(hash.slice(i, i + 2).toUpperCase());
  }
  return bytes.join('-');
}

/** Determine rarity from the last DNA byte */
export function determineRarity(lastByte: number): Rarity {
  if (lastByte <= 0x02) return 'shiny';       // ~1.17%
  if (lastByte <= 0x0c) return 'legendary';    // ~3.9%
  if (lastByte <= 0x20) return 'rare';         // ~7.8%
  if (lastByte <= 0x5f) return 'uncommon';     // ~24.6%
  return 'common';                              // ~62.5%
}

/** Parse a DNA hex string into a full DNA object */
export function parseDNA(dnaString: string): DNA {
  const bytes = dnaString.split('-').map(b => parseInt(b, 16));

  if (bytes.length !== 8 || bytes.some(isNaN)) {
    throw new Error(`Invalid DNA string: ${dnaString}`);
  }

  const [speciesByte, bodyByte, primaryByte, secondaryByte, patternByte, eyeByte, accessoryByte, rarityByte] = bytes;

  return {
    raw: dnaString,
    species: SPECIES_LIST[speciesByte % SPECIES_LIST.length],
    bodyVariation: bodyByte,
    primaryColor: COLOR_PALETTE[primaryByte % COLOR_PALETTE.length],
    secondaryColor: COLOR_PALETTE[secondaryByte % COLOR_PALETTE.length],
    pattern: PATTERN_LIST[patternByte % PATTERN_LIST.length],
    eyeStyle: EYE_LIST[eyeByte % EYE_LIST.length],
    accessory: ACCESSORY_LIST[accessoryByte % ACCESSORY_LIST.length],
    rarity: determineRarity(rarityByte),
  };
}

/** Generate a complete DNA object */
export function generateDNA(username?: string, machineId?: string): DNA {
  const raw = generateDNAString(username, machineId);
  return parseDNA(raw);
}

/** Invert colors for shiny variants */
export function getShinyColors(dna: DNA): { primary: Color; secondary: Color } {
  const invert = (c: Color): Color => ({
    r: 255 - c.r,
    g: 255 - c.g,
    b: 255 - c.b,
  });
  return {
    primary: invert(dna.primaryColor),
    secondary: invert(dna.secondaryColor),
  };
}
