import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { PetState } from './types.js';

const DATA_DIR = join(homedir(), '.claude-minipet');
const AUTH_FILE = join(DATA_DIR, 'auth.json');
const CONFIG_FILE = join(DATA_DIR, 'config.json');

interface AuthData {
  token: string;
  email: string;
  userId: number;
  serverUrl: string;
}

/** Load auth data */
export function loadAuth(): AuthData | null {
  try {
    return JSON.parse(readFileSync(AUTH_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

/** Save auth data */
export function saveAuth(data: AuthData): void {
  writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/** Get server URL from config or default */
export function getServerUrl(): string {
  const auth = loadAuth();
  return auth?.serverUrl ?? 'http://localhost:3456';
}

/** Make authenticated API request */
async function apiRequest(method: string, path: string, body?: unknown): Promise<any> {
  const auth = loadAuth();
  if (!auth) return null;

  const url = `${auth.serverUrl}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${auth.token}`,
  };

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return await res.json();
  } catch {
    // Silently fail — offline mode
    return null;
  }
}

/** Sync full pet state to server */
export async function syncPetToServer(state: PetState): Promise<boolean> {
  const result = await apiRequest('PUT', '/pets', { state });
  return result?.ok ?? false;
}

/** Fetch pet state from server */
export async function fetchPetFromServer(): Promise<PetState | null> {
  const result = await apiRequest('GET', '/pets');
  return result?.pet ?? null;
}

/** Redeem a code to get a new pet */
export async function redeemCode(code: string): Promise<{ ok: boolean; pet?: PetState; message?: string; error?: string }> {
  const result = await apiRequest('POST', '/redeem', { code });
  return result ?? { ok: false, error: '无法连接服务器' };
}

/** Send verification code */
export async function sendCode(serverUrl: string, email: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${serverUrl}/auth/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      signal: AbortSignal.timeout(10000),
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: `无法连接服务器: ${err}` };
  }
}

/** Verify code and get token */
export async function verifyCode(serverUrl: string, email: string, code: string): Promise<{ ok: boolean; token?: string; userId?: number; error?: string }> {
  try {
    const res = await fetch(`${serverUrl}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
      signal: AbortSignal.timeout(10000),
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: `无法连接服务器: ${err}` };
  }
}
