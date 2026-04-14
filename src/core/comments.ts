import type { PetState, HookInput } from './types.js';

/** Minimum interval between comments (5 minutes) */
const COMMENT_COOLDOWN_MS = 5 * 60 * 1000;

/** Check if comment cooldown has passed */
function canComment(state: PetState): boolean {
  if (!state.lastComment) return true;
  return Date.now() - new Date(state.lastComment).getTime() >= COMMENT_COOLDOWN_MS;
}

/** Mark comment as sent */
function markCommented(state: PetState): void {
  state.lastComment = new Date().toISOString();
}

// ─── 1. Code Comments (stats-based) ───

interface CommentRule {
  condition: (state: PetState, input: HookInput) => boolean;
  messages: string[];
}

const CODE_COMMENTS: CommentRule[] = [
  // No tests
  {
    condition: (s) => s.stats.totalCommits > 5 && s.stats.totalTests === 0,
    messages: [
      '主人又在裸奔了...一个测试都没写 ~',
      '提交了这么多代码，测试呢？宠物有点慌...',
      'commit 了但没 test，主人胆子真大！',
    ],
  },
  // Write a lot but rarely read
  {
    condition: (s) => s.stats.totalEdits > 20 && s.stats.totalReads < s.stats.totalEdits * 0.3,
    messages: [
      '主人写代码不看文档的吗？',
      '写得比看得多好多...主人是凭感觉编程吗？',
      '建议主人偶尔也 Read 一下代码哦~',
    ],
  },
  // Consecutive failures
  {
    condition: (s) => (s.recentFailures ?? 0) >= 3,
    messages: [
      '又炸了...宠物捂脸 🫣',
      '连续报错了！主人要不要歇一会？',
      '错误连连...宠物默默递上咖啡 ~',
      '主人别急，bug 总会修好的！',
    ],
  },
  // Git commit spree
  {
    condition: (s) => s.stats.totalCommits > 0 && s.stats.totalCommits % 10 === 0,
    messages: [
      `哇，已经提交 ${0} 次了！主人好高产！`,  // placeholder, replaced at runtime
      '又一个 commit！主人今天状态不错~',
    ],
  },
  // High activity
  {
    condition: (s) => s.stats.totalEdits + s.stats.totalBash > 100,
    messages: [
      '主人今天好肝啊...注意身体哦！',
      '产出爆表！宠物为你骄傲 💪',
    ],
  },
  // Healthy balance
  {
    condition: (s) => s.stats.totalTests > 10 && s.stats.totalCommits > 5,
    messages: [
      '有提交有测试，主人是靠谱的工程师！',
      '测试覆盖不错！宠物心情很好~',
    ],
  },
];

/** Pick a random element */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generate a code comment based on stats */
export function generateCodeComment(state: PetState, input: HookInput): string | null {
  if (!canComment(state)) return null;

  // Shuffle and try rules
  const shuffled = [...CODE_COMMENTS].sort(() => Math.random() - 0.5);
  for (const rule of shuffled) {
    if (rule.condition(state, input)) {
      markCommented(state);
      let msg = pick(rule.messages);
      // Replace placeholder for commit count
      msg = msg.replace('${0}', String(state.stats.totalCommits));
      return `🐾 ${state.name}: ${msg}`;
    }
  }
  return null;
}

// ─── 2. Mood reaction to code quality ───

export interface MoodReaction {
  moodDelta: number;
  message: string | null;
  anim: 'idle' | 'exp' | 'feed' | 'pat' | 'levelup' | 'evolve' | 'hungry' | 'sad' | null;
}

/** Analyze tool response for success/failure signals */
export function reactToCodeQuality(state: PetState, input: HookInput): MoodReaction {
  if (input.hook_event_name !== 'PostToolUse' || !input.tool_response) {
    return { moodDelta: 0, message: null, anim: null };
  }

  const resp = input.tool_response.toLowerCase();
  const toolName = (input.tool_name ?? '').toLowerCase();

  // Test passed
  if (toolName === 'bash' && (resp.includes('passed') || resp.includes('pass') || resp.includes('✓'))) {
    if (resp.includes('test') || resp.includes('vitest') || resp.includes('jest') || resp.includes('pytest')) {
      state.recentFailures = 0;
      return { moodDelta: 5, message: null, anim: 'pat' };
    }
  }

  // Build/command failure
  if (toolName === 'bash') {
    const isError = resp.includes('error') || resp.includes('failed') || resp.includes('fail') ||
      resp.includes('exception') || resp.includes('exit code 1') || resp.includes('command not found');
    const isWarning = resp.includes('warning') || resp.includes('warn');

    if (isError) {
      state.recentFailures = (state.recentFailures ?? 0) + 1;
      const delta = state.recentFailures >= 3 ? -5 : -2;
      return { moodDelta: delta, message: null, anim: state.recentFailures >= 3 ? 'sad' : null };
    }
    if (isWarning) {
      return { moodDelta: -1, message: null, anim: null };
    }
    // Success — reset failure counter
    state.recentFailures = 0;
  }

  return { moodDelta: 0, message: null, anim: null };
}

// ─── 4. Easter eggs (time/behavior based) ───

/** Check for easter egg triggers */
export function checkEasterEgg(state: PetState, input: HookInput): string | null {
  if (!canComment(state)) return null;

  const hour = new Date().getHours();
  const rand = Math.random();

  // Late night coding (23:00 - 4:00)
  if (hour >= 23 || hour < 4) {
    if (rand < 0.3) {
      markCommented(state);
      return pick([
        `🐾 ${state.name}: 都这么晚了，主人该休息了 💤`,
        `🐾 ${state.name}: 宠物好困...主人还不睡吗？`,
        `🐾 ${state.name}: 深夜写代码，bug 会变多的哦...`,
        `🐾 ${state.name}: *打哈欠* 主人晚安~`,
      ]);
    }
  }

  // Early morning (5:00 - 7:00)
  if (hour >= 5 && hour < 7) {
    if (rand < 0.3) {
      markCommented(state);
      return pick([
        `🐾 ${state.name}: 主人起得好早！今天也要加油~`,
        `🐾 ${state.name}: 早起的程序员有 bug 修...不对`,
      ]);
    }
  }

  // Back after long idle (> 2 hours)
  if (state.lastActivityTime) {
    const idleMs = Date.now() - new Date(state.lastActivityTime).getTime();
    if (idleMs > 2 * 60 * 60 * 1000) {
      markCommented(state);
      return pick([
        `🐾 ${state.name}: 主人回来啦！宠物想你了~`,
        `🐾 ${state.name}: 好久不见！宠物等了你好久~`,
        `🐾 ${state.name}: 欢迎回来！准备继续写代码了吗？`,
      ]);
    }
  }

  // Random daily chat (2% chance per hook)
  if (rand < 0.02) {
    markCommented(state);
    return pick([
      `🐾 ${state.name}: 主人写的代码真好看~`,
      `🐾 ${state.name}: 宠物觉得这个函数很优雅！`,
      `🐾 ${state.name}: *蹭蹭* 继续加油！`,
      `🐾 ${state.name}: 宠物在认真学习主人的代码呢~`,
      `🐾 ${state.name}: 据说好的变量命名能延年益寿哦`,
      `🐾 ${state.name}: 主人知道吗？第一个 bug 是一只真的虫子 bug`,
    ]);
  }

  return null;
}
