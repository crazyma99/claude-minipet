import { loadState, saveState, processHookEvent, loadConfig } from '../core/pet.js';
import { checkEvolution, applyEvolution, getEvolutionInfo } from '../core/evolution.js';
import { RARITY_INFO } from '../core/rarity.js';
import { evolutionAnimation, levelUpNotification, stageUpNotification, greetingMessage } from '../render/animation.js';
import { triggerAnim } from '../render/anim-state.js';
import { syncPetToServer, loadAuth } from '../core/sync.js';
import { writeSyncEvent, loadSyncStatus } from '../core/sync-status.js';
import { generateCodeComment, reactToCodeQuality, checkEasterEgg } from '../core/comments.js';
import { saveBubble, setBubbleCoding, setBubbleDone } from '../render/bubble.js';
import { pushToOverlay } from '../core/overlay.js';
import type { HookInput } from '../core/types.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PKG_VERSION: string = (() => {
  try { return require('../../package.json').version ?? 'unknown'; }
  catch { return 'unknown'; }
})();

/** Main hook handler - reads stdin JSON, processes event, outputs response */
export async function handleHook(): Promise<void> {
  // Require both auth and pet state
  if (!loadAuth()) process.exit(0);
  const state = loadState();
  if (!state) process.exit(0);

  // Read config once for the entire handler
  const config = loadConfig();
  const overlayUrl = config.desktopPetUrl;
  const push = (event: Parameters<typeof pushToOverlay>[1]) => pushToOverlay(overlayUrl, event);

  // Read stdin
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  const inputStr = Buffer.concat(chunks).toString('utf-8');

  let input: HookInput;
  try {
    input = JSON.parse(inputStr) as HookInput;
  } catch {
    process.exit(0);
  }

  // Set bubble mode based on Claude's work state
  if (input.hook_event_name === 'UserPromptSubmit' || input.hook_event_name === 'PostToolUse') {
    setBubbleCoding();
    if (input.hook_event_name === 'UserPromptSubmit') {
      push({ type: 'coding_start', petState: 'moving' });
    }
  } else if (input.hook_event_name === 'Stop') {
    setBubbleDone();
    push({ type: 'coding_done', petState: 'happy' });
  }

  // Process the event
  const messages = processHookEvent(state, input);

  // 2. Mood reacts to code quality (success/failure)
  const moodReaction = reactToCodeQuality(state, input);
  if (moodReaction.moodDelta !== 0) {
    state.mood = Math.max(0, Math.min(100, state.mood + moodReaction.moodDelta));
    saveState(state);
    if (moodReaction.moodDelta > 0) {
      push({ type: 'mood_up', mood: state.mood, petState: 'happy' });
    } else if (state.mood < 30) {
      push({ type: 'mood_low', mood: state.mood, petState: 'cute' });
    }
  }
  if (moodReaction.anim) {
    triggerAnim(moodReaction.anim);
  }

  // Check for evolution opportunity
  const prevEvolution = state.evolution;
  const evoCandidate = checkEvolution(state);
  if (evoCandidate && evoCandidate !== state.evolution) {
    applyEvolution(state, evoCandidate);
    saveState(state);
  }

  // Trigger animations based on event type
  if (input.hook_event_name === 'PostToolUse') {
    triggerAnim('exp');
  } else if (input.hook_event_name === 'UserPromptSubmit') {
    triggerAnim('exp');
  } else if (input.hook_event_name === 'SessionStart') {
    triggerAnim('pat'); // greeting animation
    push({ type: 'session_start', petState: 'waving' });
  }

  // Build output
  const output: string[] = [];
  const systemMessages: string[] = [];

  // SessionStart: check for version update
  if (input.hook_event_name === 'SessionStart') {
    const syncInfo = loadSyncStatus();
    if (syncInfo?.needsUpdate && syncInfo.latestVersion) {
      output.push(`⚠️ MiniPet 有新版本 v${syncInfo.latestVersion}（当前 v${PKG_VERSION}），请运行: ! npm install -g claude-minipet@latest`);
    }
  }

  for (const msg of messages) {
    if (msg === 'greeting') {
      output.push(greetingMessage(state.name, state.mood, state.hunger));
    } else if (msg.startsWith('level_up:')) {
      const level = parseInt(msg.split(':')[1]);
      const color = RARITY_INFO[state.rarity].color;
      systemMessages.push(levelUpNotification(state.name, level, color));
      saveBubble(`🎉 升级了！Lv.${level}！`);
      triggerAnim('levelup');
      push({ type: 'level_up', level, petState: 'happy' });
    } else if (msg.startsWith('stage_up:')) {
      const stage = msg.split(':')[1];
      const color = RARITY_INFO[state.rarity].color;
      systemMessages.push(stageUpNotification(state.name, stage, color));
      saveBubble(`✨ 进化了！进入${stage === 'growth' ? '成长期' : '最终形态'}！`);
      triggerAnim('levelup');
      push({ type: 'stage_up', petState: 'happy' });
    } else if (msg.startsWith('evolution:')) {
      const evoName = msg.split(':')[1];
      const evo = getEvolutionInfo(state.species, evoName);
      if (evo) {
        const color = RARITY_INFO[state.rarity].color;
        const fromName = state.species;
        systemMessages.push(evolutionAnimation(state.name, fromName, evo.name, evo.nameZh, color));
        saveBubble(`🧬 进化为 ${evo.nameZh}！`);
        push({ type: 'evolution', petState: 'happy' });
        // Clear pending evolution after showing
        state.pendingEvolution = null;
        saveState(state);
      }
    }
  }

  // 4. Easter eggs first (idle return, late night, etc.)
  const egg = checkEasterEgg(state, input);
  if (egg) {
    systemMessages.push(egg);
    saveBubble(egg);
    push({ type: 'easter_egg', petState: 'happy' });
    saveState(state);
  }

  // 1. Code comments (stats-based, 5min cooldown, skip if egg triggered)
  if (!egg) {
    const comment = generateCodeComment(state, input);
    if (comment) {
      systemMessages.push(comment);
      saveBubble(comment);
      push({ type: 'comment', petState: 'talking' });
      saveState(state);
    }
  }

  // Track activity time for idle detection (must be after easter egg check)
  state.lastActivityTime = new Date().toISOString();
  saveState(state);

  // Background sync to server (write event file for daemon to consume)
  if (loadAuth()) {
    syncPetToServer(state, PKG_VERSION)
      .then(ok => {
        writeSyncEvent({ type: 'sync_result', ok, timestamp: new Date().toISOString() });
      })
      .catch(() => {
        writeSyncEvent({ type: 'sync_result', ok: false, error: 'hook sync failed', timestamp: new Date().toISOString() });
      });
  }

  // Output for Claude Code hooks:
  // - For SessionStart: stdout text becomes context Claude sees
  // - For other hooks: use JSON with systemMessage for user-visible output
  if (input.hook_event_name === 'SessionStart') {
    // Plain text output for SessionStart context
    if (output.length > 0) {
      process.stdout.write(output.join('\n') + '\n');
    }
  }

  // System messages are shown to user in TUI
  if (systemMessages.length > 0) {
    const response = JSON.stringify({
      systemMessage: systemMessages.join('\n'),
    });
    process.stdout.write(response);
  }
}
