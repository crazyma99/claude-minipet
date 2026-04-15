import type { PetState, Color } from '../core/types.js';
import { parseDNA, getShinyColors } from '../core/dna.js';
import { RARITY_INFO, getRarityDisplay } from '../core/rarity.js';
import { getEvolutionInfo } from '../core/evolution.js';
import { SPECIES_NAMES, getSprite } from './sprites.js';
import { renderSprite, buildPalette, progressBar, fg, RESET, BOLD, padEnd } from './pixel.js';
import { getCurrentFrame, getEyeForAnim, getMouthForAnim, getAnimDecoration } from './frames.js';
import { loadAnimState } from './anim-state.js';
import { loadAuth } from '../core/sync.js';
import { loadSyncStatus } from '../core/sync-status.js';
import { getStatusBubble, renderBubble } from './bubble.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PKG_VERSION: string = (() => {
  try { return require('../../package.json').version ?? '?'; }
  catch { return '?'; }
})();

/** Render the full status line output */
export function renderStatusLine(state: PetState): string {
  const dna = parseDNA(state.dna);
  const rarityInfo = RARITY_INFO[state.rarity];

  // Get colors (shiny inverts)
  let primary = dna.primaryColor;
  let secondary = dna.secondaryColor;
  if (state.rarity === 'shiny') {
    const shiny = getShinyColors(dna);
    primary = shiny.primary;
    secondary = shiny.secondary;
  }

  // Animation state
  const animState = loadAnimState();
  const { trigger, frame } = getCurrentFrame(animState);

  // Eye/mouth colors change per animation frame
  let eyeColor: Color;
  let mouthColor: Color;

  if (trigger === 'idle' && frame === 1) {
    // Blink: eyes become body color (closed)
    eyeColor = primary;
    mouthColor = { r: 255, g: 200, b: 200 };
  } else if (trigger === 'exp' || trigger === 'levelup') {
    // Excited: bright yellow eyes
    eyeColor = { r: 255, g: 255, b: 100 };
    mouthColor = { r: 255, g: 150, b: 150 };
  } else if (trigger === 'feed') {
    // Eating: eyes squint (darker), mouth orange
    eyeColor = frame === 1 ? primary : { r: 200, g: 200, b: 255 };
    mouthColor = { r: 255, g: 180, b: 100 };
  } else if (trigger === 'pat') {
    // Content: soft pink eyes
    eyeColor = { r: 255, g: 200, b: 230 };
    mouthColor = { r: 255, g: 180, b: 180 };
  } else if (trigger === 'hungry' || trigger === 'sad') {
    // Sad: dim eyes
    eyeColor = { r: 150, g: 150, b: 150 };
    mouthColor = { r: 180, g: 150, b: 150 };
  } else if (trigger === 'evolve') {
    // Evolving: glowing eyes
    eyeColor = frame === 0 ? { r: 255, g: 255, b: 255 } : { r: 255, g: 200, b: 50 };
    mouthColor = { r: 255, g: 200, b: 100 };
  } else {
    // Default idle
    eyeColor = { r: 255, g: 255, b: 255 };
    mouthColor = { r: 255, g: 200, b: 200 };
  }

  const palette = buildPalette(primary, secondary, eyeColor, mouthColor, rarityInfo.color);

  // Get sprite — deep copy so we can modify for animation
  const baseSprite = getSprite(state.species, state.stage);
  const sprite = baseSprite.map(row => [...row]);

  // Animation frame 2 (idle yawn): open mouth wider — swap mouth pixels to eye color
  if (trigger === 'idle' && frame === 2) {
    mouthColor.r = 100; mouthColor.g = 50; mouthColor.b = 50; // dark mouth = open
  }

  const petLines = renderSprite(sprite, palette);

  // The sprite visible width = grid width (each pixel = 1 visible char)
  const spriteWidth = sprite[0]?.length ?? 0;

  // Build stats section
  const speciesName = SPECIES_NAMES[state.species].zh;
  const rarityDisplay = getRarityDisplay(state.rarity, 'zh');
  const evoName = state.evolution
    ? getEvolutionInfo(state.species, state.evolution)?.nameZh ?? state.evolution
    : speciesName;

  const rc = fg(rarityInfo.color);
  const expColor: Color = { r: 69, g: 170, b: 242 };
  const heartColor: Color = { r: 255, g: 107, b: 107 };
  const hungerColor: Color = { r: 255, g: 177, b: 66 };
  const bondColor: Color = { r: 162, g: 155, b: 254 };
  const dimColor: Color = { r: 100, g: 100, b: 100 };

  const expPct = Math.round((state.exp / state.expToNext) * 100);
  const expBar = progressBar(state.exp, state.expToNext, 8, expColor, dimColor);

  // Shiny sparkle
  const shinyPrefix = state.rarity === 'shiny' ? `${fg(rarityInfo.color)}✦${RESET} ` : '';

  // Colored Unicode symbol icons + Chinese text labels
  const moodColor = state.mood >= 60 ? heartColor : state.mood >= 30 ? {r:255,g:200,b:100} as Color : {r:200,g:50,b:50} as Color;
  const hungerColorDyn = state.hunger >= 40 ? hungerColor : state.hunger >= 20 ? {r:200,g:150,b:50} as Color : {r:200,g:50,b:50} as Color;

  // Animation decoration (e.g. "+EXP!", "nom~")
  const animDeco = getAnimDecoration(trigger, frame);
  const decoStr = animDeco ? `${fg(rarityInfo.color)}${animDeco}${RESET}` : '';

  const statsLines = [
    `${shinyPrefix}${BOLD}${state.name}${RESET} ${rc}Lv.${state.level}${RESET} ${rarityDisplay}${decoStr}`,
    `⭐ 经验 ${expBar} ${expPct}%`,
    `💗 心情 ${state.mood} 🍖 饱食 ${Math.round(state.hunger)} 💎 亲密 ${Math.floor(state.bond)}`,
    `${fg(dimColor)}>${RESET} ${evoName} 🧬 ${fg(dimColor)}${state.dna}${RESET}`,
  ];

  // Side-by-side layout: pet art left, stats right
  const gap = '  ';
  const output: string[] = [];
  const totalLines = Math.max(petLines.length, statsLines.length);

  for (let i = 0; i < totalLines; i++) {
    const petPart = i < petLines.length ? padEnd(petLines[i], spriteWidth) : ' '.repeat(spriteWidth);
    const statsPart = i < statsLines.length ? statsLines[i] : '';
    output.push(`${petPart}${gap}${statsPart}`);
  }

  // Speech bubble (always shown — real-time status awareness)
  const bubbleText = getStatusBubble(state);
  const bubbleWidth = 50;
  output.push(renderBubble(bubbleText, bubbleWidth));

  // Cloud connection status
  const auth = loadAuth();
  const syncStatus = loadSyncStatus();
  const greenDot: Color = { r: 80, g: 220, b: 100 };
  const yellowDot: Color = { r: 255, g: 200, b: 50 };
  const redDot: Color = { r: 220, g: 60, b: 60 };

  let statusDot: string;
  let statusText: string;

  if (!auth) {
    statusDot = `${fg(redDot)}●${RESET}`;
    statusText = `${fg(dimColor)}未登录${RESET}`;
  } else if (!syncStatus) {
    statusDot = `${fg(yellowDot)}●${RESET}`;
    statusText = `${fg(dimColor)}等待同步${RESET}`;
  } else if (syncStatus.connected) {
    // Check if sync is recent (within 5 min)
    const age = Date.now() - new Date(syncStatus.lastSyncTime).getTime();
    if (age < 5 * 60 * 1000) {
      statusDot = `${fg(greenDot)}●${RESET}`;
      statusText = `${fg(dimColor)}已连接${RESET}`;
    } else {
      statusDot = `${fg(yellowDot)}●${RESET}`;
      statusText = `${fg(dimColor)}同步中断${RESET}`;
    }
  } else {
    statusDot = `${fg(redDot)}●${RESET}`;
    statusText = `${fg(dimColor)}连接失败${RESET}`;
  }

  const emailDisplay = auth ? ` ${fg(dimColor)}${auth.email}${RESET}` : '';
  const versionStr = ` ${fg(dimColor)}v${PKG_VERSION}${RESET}`;

  // Update hint if newer version available
  let updateHint = '';
  if (syncStatus?.needsUpdate && syncStatus.latestVersion) {
    const warnColor: Color = { r: 255, g: 180, b: 50 };
    updateHint = `\n${fg(warnColor)}>> 新版本 v${syncStatus.latestVersion} 可用${RESET} ${fg(dimColor)}运行: ! npm install -g claude-minipet@latest${RESET}`;
  }

  output.push(`${statusDot} ${statusText}${versionStr}${emailDisplay}${updateHint}`);

  return output.join('\n');
}
