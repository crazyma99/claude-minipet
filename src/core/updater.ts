import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { execSync } from 'node:child_process';

const UPDATE_CHECK_FILE = join(homedir(), '.claude-minipet', 'last-update-check');
const CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
const PACKAGE_NAME = 'claude-minipet';

/** Get current installed version */
function getCurrentVersion(): string {
  try {
    const pkgPath = new URL('../../package.json', import.meta.url).pathname;
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version;
  } catch {
    return '0.0.0';
  }
}

/** Get latest version from npm registry */
async function getLatestVersion(): Promise<string | null> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${PACKAGE_NAME}/latest`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json() as { version: string };
    return data.version;
  } catch {
    return null;
  }
}

/** Compare semver: returns true if latest > current */
function isNewer(current: string, latest: string): boolean {
  const c = current.split('.').map(Number);
  const l = latest.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((l[i] ?? 0) > (c[i] ?? 0)) return true;
    if ((l[i] ?? 0) < (c[i] ?? 0)) return false;
  }
  return false;
}

/** Should we check for updates? (throttled to once per 6 hours) */
function shouldCheck(): boolean {
  try {
    if (!existsSync(UPDATE_CHECK_FILE)) return true;
    const lastCheck = parseInt(readFileSync(UPDATE_CHECK_FILE, 'utf-8').trim());
    return Date.now() - lastCheck > CHECK_INTERVAL;
  } catch {
    return true;
  }
}

/** Record that we just checked */
function recordCheck(): void {
  try {
    writeFileSync(UPDATE_CHECK_FILE, String(Date.now()), 'utf-8');
  } catch { /* ignore */ }
}

/** Auto-update: check and install if newer version available */
export async function checkAndUpdate(): Promise<void> {
  if (!shouldCheck()) return;
  recordCheck();

  const current = getCurrentVersion();
  const latest = await getLatestVersion();
  if (!latest || !isNewer(current, latest)) return;

  console.log(`  🔄 发现新版本 v${latest} (当前 v${current})，自动更新中...`);

  try {
    execSync(`npm install -g ${PACKAGE_NAME}@${latest}`, {
      stdio: 'pipe',
      timeout: 60000,
    });
    console.log(`  ✅ 已更新到 v${latest}`);
  } catch {
    console.log(`  ⚠️  自动更新失败，请手动运行: npm install -g ${PACKAGE_NAME}`);
  }
}
