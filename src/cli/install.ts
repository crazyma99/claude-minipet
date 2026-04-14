import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CLAUDE_DIR = join(homedir(), '.claude');
const SETTINGS_FILE = join(CLAUDE_DIR, 'settings.json');

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
}
