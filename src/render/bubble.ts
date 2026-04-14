import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { fg, RESET, visibleLength } from './pixel.js';
import type { Color, PetState } from '../core/types.js';

const BUBBLE_FILE = join(homedir(), '.claude-minipet', 'bubble.json');

type BubbleMode = 'coding' | 'done' | 'comment';

interface BubbleData {
  mode: BubbleMode;
  text: string;
  timestamp: number;
  /** Duration in seconds for the current task (coding mode) */
  startedAt?: number;
}

/** Save bubble state */
function writeBubble(data: BubbleData): void {
  writeFileSync(BUBBLE_FILE, JSON.stringify(data), 'utf-8');
}

/** Read bubble state */
function readBubble(): BubbleData | null {
  try {
    const raw = readFileSync(BUBBLE_FILE, 'utf-8');
    return JSON.parse(raw) as BubbleData;
  } catch {
    return null;
  }
}

// ── Hook-called writers ──

/** Called on UserPromptSubmit / PostToolUse — Claude is working */
export function setBubbleCoding(): void {
  const existing = readBubble();
  // Keep startedAt if already coding
  const startedAt = (existing?.mode === 'coding' && existing.startedAt)
    ? existing.startedAt
    : Date.now();
  writeBubble({ mode: 'coding', text: '', timestamp: Date.now(), startedAt });
}

/** Called on Stop — Claude finished */
export function setBubbleDone(): void {
  const existing = readBubble();
  let duration = '';
  if (existing?.mode === 'coding' && existing.startedAt) {
    const secs = Math.floor((Date.now() - existing.startedAt) / 1000);
    if (secs >= 60) {
      duration = ` (用时 ${Math.floor(secs / 60)}分${secs % 60}秒)`;
    } else if (secs > 5) {
      duration = ` (用时 ${secs}秒)`;
    }
  }
  writeBubble({ mode: 'done', text: `任务完成了！${duration}`, timestamp: Date.now() });
}

/** Called for comments/easter eggs/levelup — priority message */
export function saveBubble(text: string): void {
  writeBubble({ mode: 'comment', text, timestamp: Date.now() });
}

// ── Statusline reader ──

/** Animated dots: cycles through . .. ... based on time */
function animDots(): string {
  const phase = Math.floor(Date.now() / 600) % 3; // ~0.6s per phase
  return '.'.repeat(phase + 1) + ' '.repeat(2 - phase);
}

/** Format elapsed time nicely */
function formatElapsed(ms: number): string {
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  if (mins < 60) return `${mins}m${remSecs > 0 ? remSecs + 's' : ''}`;
  return `${Math.floor(mins / 60)}h${mins % 60}m`;
}

/** Get the current bubble text for statusline display */
export function getStatusBubble(state: PetState): string {
  const data = readBubble();

  if (data) {
    // Comment/easter egg/levelup — show for 30s
    if (data.mode === 'comment') {
      if (Date.now() - data.timestamp < 30_000) {
        // Strip pet name prefix
        const m = data.text.match(/^🐾\s*.+?:\s*/);
        return m ? data.text.slice(m[0].length) : data.text;
      }
    }

    // Done — show for 60s
    if (data.mode === 'done') {
      if (Date.now() - data.timestamp < 60_000) {
        return `[ok] ${data.text}`;
      }
    }

    // Coding — show with animated dots + elapsed time
    if (data.mode === 'coding') {
      // If no activity for >5 min, Claude probably isn't working anymore
      if (state.lastActivityTime) {
        const idleMs = Date.now() - new Date(state.lastActivityTime).getTime();
        if (idleMs > 5 * 60 * 1000) {
          // Fall through to idle status below
        } else {
          const elapsed = data.startedAt ? formatElapsed(Date.now() - data.startedAt) : '';
          const dots = animDots();
          const timeStr = elapsed ? ` [${elapsed}]` : '';
          return `>> 疯狂Coding中${dots}${timeStr}`;
        }
      } else {
        const dots = animDots();
        return `>> 疯狂Coding中${dots}`;
      }
    }
  }

  // ── Fallback: state-based status ──
  const hour = new Date().getHours();

  let idleMinutes = 0;
  if (state.lastActivityTime) {
    idleMinutes = Math.floor((Date.now() - new Date(state.lastActivityTime).getTime()) / 60000);
  }

  // Critical notifications
  if (state.hunger <= 10) return '好饿...主人快喂我!';
  if (state.mood <= 20) return '心情好差...摸摸我好吗?';
  if ((state.recentFailures ?? 0) >= 3) return '连续报错了，主人别急~';

  // Idle states
  if (idleMinutes >= 2 && idleMinutes < 10) {
    const msgs = ['主人在思考吗?', '*歪头等待中*', '稍微休息一下也好~'];
    return msgs[Math.floor(Date.now() / 10000) % msgs.length];  // deterministic per 10s
  }
  if (idleMinutes >= 10 && idleMinutes < 60) {
    return `zzZ 待机中...已经 ${idleMinutes} 分钟了`;
  }
  if (idleMinutes >= 60) {
    const hrs = Math.floor(idleMinutes / 60);
    return hrs >= 2 ? `zzZ 主人离开 ${hrs} 小时了...` : 'zzZ 主人还在吗? 想你~';
  }

  // Time-based
  if (hour >= 23 || hour < 5) return '好晚了...主人注意休息哦~';
  if (hour >= 5 && hour < 8) return '早安! 今天也要加油~';
  if (hour >= 12 && hour < 13) return '午饭时间到了哦~';

  // Default idle — use deterministic message to avoid flicker
  const defaults = [
    '~ 宠物在这里陪你~',
    '今天的代码会很顺利的!',
    '*摇尾巴等待中*',
    '随时准备陪主人编码!',
  ];
  return defaults[Math.floor(Date.now() / 15000) % defaults.length];  // rotate every 15s
}

/** Render a speech bubble with box-drawing characters */
export function renderBubble(text: string, maxWidth: number): string {
  const dimColor: Color = { r: 140, g: 140, b: 160 };
  const textColor: Color = { r: 220, g: 220, b: 230 };
  const dim = fg(dimColor);
  const txt = fg(textColor);

  let msg = text;

  // Truncate if too long
  if (visibleLength(msg) > maxWidth - 4) {
    msg = msg.slice(0, maxWidth - 7) + '...';
  }

  // Fixed width — keeps bubble stable across refreshes
  const innerWidth = Math.max(maxWidth - 4, visibleLength(msg));
  const padding = Math.max(0, innerWidth - visibleLength(msg));
  const top    = `${dim}╭${'─'.repeat(innerWidth + 2)}╮${RESET}`;
  const middle = `${dim}│${RESET} ${txt}${msg}${RESET}${' '.repeat(padding)} ${dim}│${RESET}`;
  const bottom = `${dim}╰${'─'.repeat(innerWidth + 2)}╯${RESET}`;

  return `${top}\n${middle}\n${bottom}`;
}
