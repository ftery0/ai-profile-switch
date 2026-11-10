// Reads what Claude Code saved in a profile, for display only. Nothing is written,
// and any field with an unexpected shape is left out instead of failing.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PROFILES_DIR } from './constants.mjs';

const PLANS = { claude_max: 'Max', claude_pro: 'Pro', claude_team: 'Team', claude_enterprise: 'Enterprise' };

function readConfig(dir) {
  try {
    const config = JSON.parse(readFileSync(join(dir, '.claude.json'), 'utf8'));
    return config && typeof config === 'object' ? config : {};
  } catch {
    return {};
  }
}

function percent(window) {
  const value = window?.utilization;
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : null;
}

// A window whose reset time has passed starts again from zero.
function hasReset(window, now) {
  const resetsAt = typeof window?.resets_at === 'string' ? Date.parse(window.resets_at) : NaN;
  return Number.isFinite(resetsAt) && resetsAt <= now;
}

// Claude Code keeps usage in an undocumented cache; it may change or disappear.
function usage(cached, account, now = Date.now()) {
  if (!cached || typeof cached !== 'object') return null;
  if (typeof cached.accountUuid === 'string' && typeof account.accountUuid === 'string'
    && cached.accountUuid !== account.accountUuid) return null;
  const windows = { fiveHour: cached.utilization?.five_hour, weekly: cached.utilization?.seven_day };
  const reset = { fiveHour: false, weekly: false };
  const values = {};
  for (const [key, window] of Object.entries(windows)) {
    values[key] = percent(window);
    if (values[key] !== null && hasReset(window, now)) [values[key], reset[key]] = [0, true];
  }
  if (values.fiveHour === null && values.weekly === null) return null;
  const savedAt = Number.isFinite(cached.fetchedAtMs) ? cached.fetchedAtMs : null;
  return { fiveHour: values.fiveHour, weekly: values.weekly, savedAt, reset };
}

// Usage fetched in this run, by profile name. It wins over the saved cache.
const live = new Map();
const USAGE_URL = 'https://api.anthropic.com/api/oauth/usage';
const FRESH_MS = 60_000;

// Claude Code stores each config folder's sign-in under a keychain item named
// after the folder path; elsewhere, or without a keychain, in .credentials.json.
function keychainService(dir) {
  return `Claude Code-credentials-${createHash('sha256').update(dir).digest('hex').slice(0, 8)}`;
}

function readKeychain(dir) {
  return new Promise(resolve => {
    execFile('security', ['find-generic-password', '-s', keychainService(dir), '-w'], { timeout: 1000 },
      (err, stdout) => resolve(err ? null : stdout));
  });
}

async function readCredentials(dir) {
  const fromKeychain = process.platform === 'darwin' ? await readKeychain(dir) : null;
  return fromKeychain ?? readFile(join(dir, '.credentials.json'), 'utf8').catch(() => null);
}

// An expired token is skipped, not refreshed: refreshing could sign Claude Code out.
function accessToken(raw, now) {
  try {
    const oauth = JSON.parse(raw)?.claudeAiOauth;
    if (typeof oauth?.accessToken !== 'string' || !oauth.accessToken) return null;
    if (Number.isFinite(oauth.expiresAt) && oauth.expiresAt <= now + FRESH_MS) return null;
    return oauth.accessToken;
  } catch {
    return null;
  }
}

// Asks the usage API for each signed-in profile at once. Anything slow or failing
// keeps the saved value, so the screen never waits more than timeoutMs.
export async function refreshUsage(names, { read = readCredentials, request = fetch, timeoutMs = 1500 } = {}) {
  const now = Date.now();
  const signal = AbortSignal.timeout(timeoutMs);
  const due = names.filter(name => !(now - (live.get(name)?.fetchedAtMs ?? 0) < FRESH_MS)
    && readConfig(join(PROFILES_DIR, name)).oauthAccount);
  const fetchOne = async name => {
    try {
      const token = accessToken(await read(join(PROFILES_DIR, name)), now);
      if (!token || signal.aborted) return;
      const response = await request(USAGE_URL, {
        headers: { Authorization: `Bearer ${token}`, 'anthropic-beta': 'oauth-2025-04-20' }, signal,
      });
      const utilization = response.ok ? await response.json() : null;
      if (utilization && typeof utilization === 'object' && !signal.aborted) {
        live.set(name, { utilization, fetchedAtMs: Date.now() });
      }
    } catch { /* keep the saved value */ }
  };
  let timer;
  const deadline = new Promise(resolve => { timer = setTimeout(resolve, timeoutMs); });
  await Promise.race([Promise.all(due.map(fetchOne)), deadline]);
  clearTimeout(timer);
}

export function accountInfo(name) {
  const dir = join(PROFILES_DIR, name);
  const config = readConfig(dir);
  const account = config.oauthAccount && typeof config.oauthAccount === 'object' ? config.oauthAccount : {};
  let lastUsed = null;
  try { lastUsed = statSync(join(dir, 'history.jsonl')).mtimeMs; } catch { /* never used */ }
  return {
    email: typeof account.emailAddress === 'string' && account.emailAddress ? account.emailAddress : null,
    plan: Object.hasOwn(PLANS, account.organizationType) ? PLANS[account.organizationType] : null,
    usage: usage(live.get(name) ?? config.cachedUsageUtilization, account),
    lastUsed,
  };
}
