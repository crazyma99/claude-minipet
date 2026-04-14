import type { Color } from '../core/types.js';
import { fg, RESET, BOLD, BLINK } from './pixel.js';

/** Mood-based eye characters */
export function getEyeChars(mood: number): string {
  if (mood >= 80) return '★';
  if (mood >= 60) return '●';
  if (mood >= 40) return '●';
  if (mood >= 20) return '◦';
  return 'x';
}

/** Mood-based mouth characters */
export function getMouthChars(mood: number): string {
  if (mood >= 80) return '▽';
  if (mood >= 60) return '‿';
  if (mood >= 40) return '─';
  if (mood >= 20) return '╥';
  return '∿';
}

/** Generate evolution animation text */
export function evolutionAnimation(
  petName: string,
  fromName: string,
  toName: string,
  toNameZh: string,
  rarityColor: Color,
): string {
  const c = fg(rarityColor);
  const gold = fg({ r: 255, g: 214, b: 10 });
  const lines = [
    '',
    `${gold}  ✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨${RESET}`,
    `${gold}  ✨                            ✨${RESET}`,
    `${gold}  ✨  ${BOLD}${petName} 正在进化...!${RESET}${gold}     ✨${RESET}`,
    `${gold}  ✨                            ✨${RESET}`,
    `${gold}  ✨  ${c}${fromName}${RESET}${gold} → ${c}${BOLD}${toNameZh} ${toName}${RESET}${gold}  ✨${RESET}`,
    `${gold}  ✨                            ✨${RESET}`,
    `${gold}  ✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨${RESET}`,
    '',
  ];
  return lines.join('\n');
}

/** Generate level up notification */
export function levelUpNotification(petName: string, level: number, color: Color): string {
  const c = fg(color);
  return `${c}⬆${RESET} ${BOLD}${petName}${RESET} 升到了 ${c}${BOLD}Lv.${level}${RESET}!`;
}

/** Generate stage up notification */
export function stageUpNotification(petName: string, stage: string, color: Color): string {
  const c = fg(color);
  const stageNames: Record<string, string> = {
    baby: '幼年体',
    growth: '成长体',
    final: '完全体',
  };
  const stageName = stageNames[stage] ?? stage;
  return [
    '',
    `${c}  ═══════════════════════${RESET}`,
    `${c}  ║  ${BOLD}${petName} 成长了!${RESET}${c}      ║${RESET}`,
    `${c}  ║  进入 ${BOLD}${stageName}${RESET}${c} 阶段!  ║${RESET}`,
    `${c}  ═══════════════════════${RESET}`,
    '',
  ].join('\n');
}

/** Generate greeting message */
export function greetingMessage(petName: string, mood: number, hunger: number): string {
  let msg: string;
  if (hunger < 20) {
    msg = `${petName} 饿坏了...快喂喂它吧！`;
  } else if (mood >= 80) {
    msg = `${petName} 很开心地迎接你！`;
  } else if (mood >= 50) {
    msg = `${petName} 看到你来了，轻轻叫了一声。`;
  } else {
    msg = `${petName} 看起来有点低落...`;
  }
  return msg;
}

/** Shiny border frame */
export function shinyBorder(lines: string[], color: Color): string[] {
  const c = fg(color);
  const sparkles = [BLINK, '✦', '✧', '⋆'];
  const s = sparkles[Math.floor(Date.now() / 500) % sparkles.length];
  return [
    `${c}${s} ─────────────── ${s}${RESET}`,
    ...lines.map(l => `${c}│${RESET} ${l} ${c}│${RESET}`),
    `${c}${s} ─────────────── ${s}${RESET}`,
  ];
}
