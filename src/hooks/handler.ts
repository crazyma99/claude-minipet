import { loadState, saveState, processHookEvent } from '../core/pet.js';
import { checkEvolution, applyEvolution, getEvolutionInfo } from '../core/evolution.js';
import { RARITY_INFO } from '../core/rarity.js';
import { evolutionAnimation, levelUpNotification, stageUpNotification, greetingMessage } from '../render/animation.js';
import { triggerAnim } from '../render/anim-state.js';
import { syncPetToServer, loadAuth } from '../core/sync.js';
import { generateCodeComment, reactToCodeQuality, checkEasterEgg } from '../core/comments.js';
import { saveBubble, setBubbleCoding, setBubbleDone } from '../render/bubble.js';
import type { HookInput } from '../core/types.js';

/** Main hook handler - reads stdin JSON, processes event, outputs response */
export async function handleHook(): Promise<void> {
  // Require both auth and pet state
  if (!loadAuth()) process.exit(0);
  const state = loadState();
  if (!state) process.exit(0);

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
  } else if (input.hook_event_name === 'Stop') {
    setBubbleDone();
  }

  // Process the event
  const messages = processHookEvent(state, input);

  // 2. Mood reacts to code quality (success/failure)
  const moodReaction = reactToCodeQuality(state, input);
  if (moodReaction.moodDelta !== 0) {
    state.mood = Math.max(0, Math.min(100, state.mood + moodReaction.moodDelta));
    saveState(state);
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
  }

  // Build output
  const output: string[] = [];
  const systemMessages: string[] = [];

  for (const msg of messages) {
    if (msg === 'greeting') {
      output.push(greetingMessage(state.name, state.mood, state.hunger));
    } else if (msg.startsWith('level_up:')) {
      const level = parseInt(msg.split(':')[1]);
      const color = RARITY_INFO[state.rarity].color;
      systemMessages.push(levelUpNotification(state.name, level, color));
      saveBubble(`🎉 升级了！Lv.${level}！`);
      triggerAnim('levelup');
    } else if (msg.startsWith('stage_up:')) {
      const stage = msg.split(':')[1];
      const color = RARITY_INFO[state.rarity].color;
      systemMessages.push(stageUpNotification(state.name, stage, color));
      saveBubble(`✨ 进化了！进入${stage === 'growth' ? '成长期' : '最终形态'}！`);
      triggerAnim('levelup');
    } else if (msg.startsWith('evolution:')) {
      const evoName = msg.split(':')[1];
      const evo = getEvolutionInfo(state.species, evoName);
      if (evo) {
        const color = RARITY_INFO[state.rarity].color;
        const fromName = state.species;
        systemMessages.push(evolutionAnimation(state.name, fromName, evo.name, evo.nameZh, color));
        saveBubble(`🧬 进化为 ${evo.nameZh}！`);
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
    saveState(state);
  }

  // 1. Code comments (stats-based, 5min cooldown, skip if egg triggered)
  if (!egg) {
    const comment = generateCodeComment(state, input);
    if (comment) {
      systemMessages.push(comment);
      saveBubble(comment);
      saveState(state);
    }
  }

  // Track activity time for idle detection (must be after easter egg check)
  state.lastActivityTime = new Date().toISOString();
  saveState(state);

  // Background sync to server (fire and forget)
  if (loadAuth()) {
    syncPetToServer(state).catch(() => {});
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
