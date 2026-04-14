import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CLAUDE_DIR = join(homedir(), '.claude');
const SETTINGS_FILE = join(CLAUDE_DIR, 'settings.json');
const CLAUDE_MD = join(CLAUDE_DIR, 'CLAUDE.md');

interface ClaudeSettings {
  hooks?: Record<string, unknown[]>;
  statusLine?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Install hooks and status line config into Claude Code settings */
export function installHooks(): void {
  if (!existsSync(CLAUDE_DIR)) {
    mkdirSync(CLAUDE_DIR, { recursive: true });
  }

  // Read existing settings
  let settings: ClaudeSettings = {};
  if (existsSync(SETTINGS_FILE)) {
    try {
      settings = JSON.parse(readFileSync(SETTINGS_FILE, 'utf-8'));
    } catch {
      // If settings file is corrupt, start fresh but warn
      console.warn('Warning: Could not parse existing settings.json, will create new one');
    }
  }

  // Ensure hooks object exists
  if (!settings.hooks) {
    settings.hooks = {};
  }

  const hooks = settings.hooks as Record<string, unknown[]>;

  // Helper to add a hook without duplicating
  const addHook = (event: string, matcher: string, command: string, options: Record<string, unknown> = {}) => {
    if (!hooks[event]) {
      hooks[event] = [];
    }
    const eventHooks = hooks[event] as Array<{ matcher: string; hooks: Array<{ command: string; type: string }> }>;

    // Check if our hook already exists
    const existing = eventHooks.find(h =>
      h.hooks?.some(hh => hh.command?.includes('claude-minipet'))
    );
    if (existing) return; // Already installed

    eventHooks.push({
      matcher,
      hooks: [{
        type: 'command',
        command,
        ...options,
      }],
    });
  };

  addHook('SessionStart', 'startup', 'claude-minipet hook');
  addHook('UserPromptSubmit', '', 'claude-minipet hook');
  addHook('PostToolUse', 'Bash|Write|Edit|Read', 'claude-minipet hook', { async: true });
  addHook('Stop', '', 'claude-minipet hook');

  // Install status line
  settings.statusLine = {
    type: 'command',
    command: 'claude-minipet statusline',
    refreshInterval: 2,
  };

  // Write settings
  writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');

  // Install CLAUDE.md pet knowledge
  installClaudeMd();
}

const MINIPET_MARKER_START = '<!-- claude-minipet-start -->';
const MINIPET_MARKER_END = '<!-- claude-minipet-end -->';

const MINIPET_KNOWLEDGE = `${MINIPET_MARKER_START}
## Claude MiniPet (虚拟宠物)

用户安装了 claude-minipet 终端虚拟宠物。当用户提到"宠物"、"喂食"、"摸摸"、"升级"等相关话题时，你应该知道：

- \`claude-minipet status\` — 查看宠物状态（等级/经验/心情/饱食/亲密度）
- \`claude-minipet feed\` — 喂食宠物（饱食度+30）
- \`claude-minipet pat\` — 摸摸宠物（心情+10，亲密度+2）
- \`claude-minipet rename <名字>\` — 重命名宠物
- \`claude-minipet sync\` — 同步宠物数据到云端
- \`claude-minipet redeem <兑换码>\` — 使用兑换码获取新宠物

宠物会在你编码时自动获取经验升级，状态栏实时显示在终端底部。当用户说"喂宠物"就执行 feed，说"看看宠物"就执行 status。
${MINIPET_MARKER_END}`;

/** Install pet knowledge into global CLAUDE.md */
function installClaudeMd(): void {
  let content = '';
  if (existsSync(CLAUDE_MD)) {
    content = readFileSync(CLAUDE_MD, 'utf-8');
  }

  // Already installed?
  if (content.includes(MINIPET_MARKER_START)) {
    // Replace existing block
    const re = new RegExp(
      MINIPET_MARKER_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '[\\s\\S]*?' +
      MINIPET_MARKER_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    );
    content = content.replace(re, MINIPET_KNOWLEDGE);
  } else {
    // Append
    content = content.trimEnd() + '\n\n' + MINIPET_KNOWLEDGE + '\n';
  }

  writeFileSync(CLAUDE_MD, content, 'utf-8');
}

/** Remove pet knowledge from global CLAUDE.md */
function uninstallClaudeMd(): void {
  if (!existsSync(CLAUDE_MD)) return;
  let content = readFileSync(CLAUDE_MD, 'utf-8');
  if (!content.includes(MINIPET_MARKER_START)) return;

  const re = new RegExp(
    '\\n*' +
    MINIPET_MARKER_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '[\\s\\S]*?' +
    MINIPET_MARKER_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '\\n*',
  );
  content = content.replace(re, '\n');
  writeFileSync(CLAUDE_MD, content, 'utf-8');
}

/** Remove hooks from Claude Code settings */
export function uninstallHooks(): void {
  if (!existsSync(SETTINGS_FILE)) return;

  let settings: ClaudeSettings;
  try {
    settings = JSON.parse(readFileSync(SETTINGS_FILE, 'utf-8'));
  } catch {
    return;
  }

  // Remove our hooks
  if (settings.hooks) {
    const hooks = settings.hooks as Record<string, Array<{ hooks: Array<{ command: string }> }>>;
    for (const [event, eventHooks] of Object.entries(hooks)) {
      hooks[event] = eventHooks.filter(h =>
        !h.hooks?.some(hh => hh.command?.includes('claude-minipet'))
      );
      if (hooks[event].length === 0) {
        delete hooks[event];
      }
    }
  }

  // Remove status line if it's ours
  if (settings.statusLine) {
    const sl = settings.statusLine as { command?: string };
    if (sl.command?.includes('claude-minipet')) {
      delete settings.statusLine;
    }
  }

  writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');

  // Remove CLAUDE.md pet knowledge
  uninstallClaudeMd();
}
