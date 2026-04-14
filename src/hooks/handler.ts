import { loadState, saveState, processHookEvent } from '../core/pet.js';
import { checkEvolution, applyEvolution, getEvolutionInfo } from '../core/evolution.js';
import { RARITY_INFO } from '../core/rarity.js';
import { evolutionAnimation, levelUpNotification, stageUpNotification, greetingMessage } from '../render/animation.js';
import { triggerAnim } from '../render/anim-state.js';
import { syncPetToServer, loadAuth } from '../core/sync.js';
import type { HookInput } from '../core/types.js';

/** Main hook handler - reads stdin JSON, processes event, outputs response */
export async function handleHook(): Promise<void> {
  const state = loadState();
  if (!state) {
    // No pet initialized yet, silently exit
    process.exit(0);
  }

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

  // Process the event
  const messages = processHookEvent(state, input);

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
      triggerAnim('levelup');
    } else if (msg.startsWith('stage_up:')) {
      const stage = msg.split(':')[1];
      const color = RARITY_INFO[state.rarity].color;
      systemMessages.push(stageUpNotification(state.name, stage, color));
      triggerAnim('levelup');
    } else if (msg.startsWith('evolution:')) {
      const evoName = msg.split(':')[1];
      const evo = getEvolutionInfo(state.species, evoName);
      if (evo) {
        const color = RARITY_INFO[state.rarity].color;
        const fromName = state.species;
        systemMessages.push(evolutionAnimation(state.name, fromName, evo.name, evo.nameZh, color));
        // Clear pending evolution after showing
        state.pendingEvolution = null;
        saveState(state);
      }
    }
  }

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
