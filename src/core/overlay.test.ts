import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pushToOverlay } from './overlay.js';

describe('pushToOverlay', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does nothing when desktopPetUrl is undefined', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    pushToOverlay(undefined, { type: 'test', petState: 'sitting' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does nothing when desktopPetUrl is empty string', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    pushToOverlay('', { type: 'test', petState: 'sitting' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends correct payload structure', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'));

    pushToOverlay('http://localhost:3210', {
      type: 'coding_start',
      petState: 'moving',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:3210/event',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'coding_start', petState: 'moving' }),
      }),
    );
  });

  it('sends level and mood when provided', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'));

    pushToOverlay('http://localhost:3210', {
      type: 'level_up',
      petState: 'happy',
      level: 5,
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(body).toEqual({ type: 'level_up', petState: 'happy', level: 5 });
  });

  it('does not throw when overlay is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

    // Should not throw
    expect(() => {
      pushToOverlay('http://localhost:9999', { type: 'test', petState: 'sitting' });
    }).not.toThrow();
  });

  it('supports https URLs', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'));

    pushToOverlay('https://example.com', { type: 'test', petState: 'sitting' });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.com/event',
      expect.anything(),
    );
  });
});
