import type { Color } from '../core/types.js';

/** Special pixel values */
export const TRANSPARENT = -1;
export const PRIMARY = 1;
export const SECONDARY = 2;
export const EYE = 3;
export const MOUTH = 4;
export const ACCENT = 5;

/** Set foreground color using 24-bit ANSI */
export function fg(c: Color): string {
  return `\x1b[38;2;${c.r};${c.g};${c.b}m`;
}

/** Set background color using 24-bit ANSI */
export function bg(c: Color): string {
  return `\x1b[48;2;${c.r};${c.g};${c.b}m`;
}

/** Reset all ANSI formatting */
export const RESET = '\x1b[0m';

/** Bold text */
export const BOLD = '\x1b[1m';

/** Blink text (for legendary/shiny glow) */
export const BLINK = '\x1b[5m';

/**
 * Render a sprite grid to terminal string using half-block characters.
 * Each cell in the grid represents one pixel.
 * We pair rows (top + bottom) and use ▀ with fg=top, bg=bottom.
 * This gives 2x vertical resolution.
 *
 * Returns lines with consistent visible width (= grid width characters).
 */
export function renderSprite(
  grid: number[][],
  palette: Map<number, Color>,
  transparent?: Color, // background color for transparent pixels
): string[] {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const lines: string[] = [];
  // Terminal background color — used for "transparent" pixels so every cell
  // renders the same block character (▀), avoiding width mismatches between
  // plain spaces and Unicode blocks in some terminal fonts.
  const BG: Color = transparent ?? { r: 30, g: 30, b: 46 }; // Claude Code dark theme bg

  // Process two rows at a time
  for (let y = 0; y < height; y += 2) {
    let line = '';
    for (let x = 0; x < width; x++) {
      const topPixel = grid[y]?.[x] ?? TRANSPARENT;
      const bottomPixel = grid[y + 1]?.[x] ?? TRANSPARENT;

      const topColor = topPixel === TRANSPARENT ? BG : (palette.get(topPixel) ?? BG);
      const bottomColor = bottomPixel === TRANSPARENT ? BG : (palette.get(bottomPixel) ?? BG);

      // Always use ▀ with explicit fg+bg — uniform character width
      line += `${fg(topColor)}${bg(bottomColor)}▀${RESET}`;
    }
    lines.push(line);
  }

  return lines;
}

/**
 * Calculate the visible (display) width of a string.
 * Strips ANSI escapes and accounts for double-width characters:
 * - CJK characters (Chinese, Japanese, Korean)
 * - Most emoji (including skin-tone modifiers, ZWJ sequences)
 */
export function visibleLength(str: string): number {
  // Strip ANSI escape sequences
  const clean = str.replace(/\x1b\[[0-9;]*m/g, '');
  let width = 0;
  for (const ch of clean) {
    const cp = ch.codePointAt(0) ?? 0;
    if (isDoubleWidth(cp)) {
      width += 2;
    } else if (cp >= 0xFE00 && cp <= 0xFE0F) {
      // Variation selectors (VS1-VS16) — zero width
    } else if (cp === 0x200D) {
      // Zero-Width Joiner — zero width
    } else {
      width += 1;
    }
  }
  return width;
}

/** Check if a Unicode code point occupies 2 terminal columns */
function isDoubleWidth(cp: number): boolean {
  // CJK Unified Ideographs
  if (cp >= 0x4E00 && cp <= 0x9FFF) return true;
  // CJK Extension A
  if (cp >= 0x3400 && cp <= 0x4DBF) return true;
  // CJK Compatibility Ideographs
  if (cp >= 0xF900 && cp <= 0xFAFF) return true;
  // Fullwidth forms
  if (cp >= 0xFF01 && cp <= 0xFF60) return true;
  if (cp >= 0xFFE0 && cp <= 0xFFE6) return true;
  // CJK Radicals / Kangxi
  if (cp >= 0x2E80 && cp <= 0x2FDF) return true;
  // CJK Symbols and Punctuation, Hiragana, Katakana, Bopomofo, etc.
  if (cp >= 0x3000 && cp <= 0x33FF) return true;
  // Hangul Syllables
  if (cp >= 0xAC00 && cp <= 0xD7AF) return true;
  // Hangul Jamo Extended / Compatibility
  if (cp >= 0x1100 && cp <= 0x11FF) return true;
  // Emoji: Miscellaneous Symbols and Pictographs
  if (cp >= 0x1F300 && cp <= 0x1F5FF) return true;
  // Emoji: Emoticons
  if (cp >= 0x1F600 && cp <= 0x1F64F) return true;
  // Emoji: Transport and Map Symbols
  if (cp >= 0x1F680 && cp <= 0x1F6FF) return true;
  // Emoji: Supplemental Symbols and Pictographs
  if (cp >= 0x1F900 && cp <= 0x1F9FF) return true;
  // Emoji: Symbols and Pictographs Extended-A
  if (cp >= 0x1FA00 && cp <= 0x1FA6F) return true;
  if (cp >= 0x1FA70 && cp <= 0x1FAFF) return true;
  // Enclosed Alphanumeric Supplement (circled numbers, etc.)
  if (cp >= 0x1F100 && cp <= 0x1F1FF) return true;
  return false;
}

/** Pad a string with ANSI codes to a target visible width */
export function padEnd(str: string, targetWidth: number): string {
  const visible = visibleLength(str);
  if (visible >= targetWidth) return str;
  return str + ' '.repeat(targetWidth - visible);
}

/** Build a color palette from DNA colors + mood-based eye/mouth colors */
export function buildPalette(
  primary: Color,
  secondary: Color,
  eyeColor: Color,
  mouthColor: Color,
  accentColor?: Color,
): Map<number, Color> {
  const map = new Map<number, Color>();
  map.set(PRIMARY, primary);
  map.set(SECONDARY, secondary);
  map.set(EYE, eyeColor);
  map.set(MOUTH, mouthColor);
  if (accentColor) map.set(ACCENT, accentColor);
  return map;
}

/** Create a progress bar string */
export function progressBar(value: number, max: number, width: number, filledColor: Color, emptyColor: Color): string {
  const filled = Math.round((value / max) * width);
  let bar = '';
  for (let i = 0; i < width; i++) {
    if (i < filled) {
      bar += `${fg(filledColor)}▓${RESET}`;
    } else {
      bar += `${fg(emptyColor)}░${RESET}`;
    }
  }
  return bar;
}

/** Sparkle animation frame characters for shiny pets */
export const SPARKLE_FRAMES = ['✦', '✧', '⋆', '✦'];

/** Get sparkle character based on time */
export function getSparkle(): string {
  const idx = Math.floor(Date.now() / 500) % SPARKLE_FRAMES.length;
  return SPARKLE_FRAMES[idx];
}
