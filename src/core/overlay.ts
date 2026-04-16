/**
 * Desktop pet overlay bridge — pushes structured events to minipet-overlay.
 *
 * Design: only structured data is sent (type, petState, level, mood).
 * Display text and persona are decided by the overlay, not here.
 */

import type { PetConfig } from './types.js';

export type OverlayPetState =
  | 'sleeping' | 'sitting' | 'eating' | 'moving'
  | 'happy' | 'cute' | 'talking' | 'waving';

export interface OverlayEvent {
  type: string;
  petState?: OverlayPetState;
  level?: number;
  mood?: number;
}

/**
 * Push a structured event to the desktop overlay pet.
 * Fire-and-forget: never throws, logs errors to stderr in debug mode.
 */
export function pushToOverlay(
  desktopPetUrl: string | undefined,
  event: OverlayEvent,
): void {
  if (!desktopPetUrl) return;

  const url = `${desktopPetUrl}/event`;
  const data = JSON.stringify(event);

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data,
    signal: AbortSignal.timeout(3000),
  }).catch((err) => {
    if (process.env.DEBUG) {
      process.stderr.write(`[overlay] push failed: ${err?.message ?? err}\n`);
    }
  });
}
