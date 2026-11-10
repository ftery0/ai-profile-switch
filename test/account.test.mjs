import './helpers/home.mjs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROFILES_DIR } from '../src/lib/constants.mjs';
import { accountInfo, refreshUsage } from '../src/lib/account.mjs';

function profile(name, config) {
  const dir = join(PROFILES_DIR, name);
  mkdirSync(dir, { recursive: true });
  if (config !== undefined) writeFileSync(join(dir, '.claude.json'), typeof config === 'string' ? config : JSON.stringify(config));
  return dir;
}

describe('account info', () => {
  it('reads the email, plan, usage and last use', () => {
    const dir = profile('full', {
      oauthAccount: { accountUuid: 'a', emailAddress: 'kim@company.test', organizationType: 'claude_max' },
      cachedUsageUtilization: {
        accountUuid: 'a', fetchedAtMs: 1000,
        utilization: { five_hour: { utilization: 28.4 }, seven_day: { utilization: 140 } },
      },
    });
    writeFileSync(join(dir, 'history.jsonl'), '{}\n');
    const info = accountInfo('full');
    assert.equal(info.email, 'kim@company.test');
    assert.equal(info.plan, 'Max');
    assert.deepEqual(info.usage, { fiveHour: 28, weekly: 100, savedAt: 1000, reset: { fiveHour: false, weekly: false } });
    assert.equal(typeof info.lastUsed, 'number');
  });

  it('returns empty fields for a profile that never signed in', () => {
    profile('fresh');
    assert.deepEqual(accountInfo('fresh'), { email: null, plan: null, usage: null, lastUsed: null });
  });

  it('survives a broken or unexpected file', () => {
    for (const [name, config] of [['broken', '{not json'], ['array', []], ['number', 5], ['null', 'null']]) {
      profile(name, config);
      assert.deepEqual(accountInfo(name), { email: null, plan: null, usage: null, lastUsed: null }, name);
    }
  });

  it('hides fields whose shape changed', () => {
    profile('changed', {
      oauthAccount: { emailAddress: 42, organizationType: 'claude_future' },
      cachedUsageUtilization: { utilization: { five_hour: { utilization: '28' }, seven_day: null } },
    });
    assert.deepEqual(accountInfo('changed'), { email: null, plan: null, usage: null, lastUsed: null });
  });

  it('keeps one usage window when the other is missing', () => {
    profile('partial', { cachedUsageUtilization: { utilization: { seven_day: { utilization: 61 } } } });
    assert.deepEqual(accountInfo('partial').usage, { fiveHour: null, weekly: 61, savedAt: null, reset: { fiveHour: false, weekly: false } });
  });

  it('drops usage saved for a different account', () => {
    profile('switched', {
      oauthAccount: { accountUuid: 'new', emailAddress: 'me@mail.test' },
      cachedUsageUtilization: { accountUuid: 'old', utilization: { five_hour: { utilization: 90 } } },
    });
    assert.equal(accountInfo('switched').usage, null);
  });

  it('does not change the file it reads', () => {
    const dir = profile('untouched', { oauthAccount: { emailAddress: 'a@b.test' } });
    const before = readFileSync(join(dir, '.claude.json'), 'utf8');
    accountInfo('untouched');
    assert.equal(readFileSync(join(dir, '.claude.json'), 'utf8'), before);
  });

  it('shows a window whose reset time passed as zero', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const future = new Date(Date.now() + 3_600_000).toISOString();
    profile('stale', { cachedUsageUtilization: { utilization: {
      five_hour: { utilization: 70, resets_at: past }, seven_day: { utilization: 40, resets_at: future },
    } } });
    const { usage } = accountInfo('stale');
    assert.deepEqual([usage.fiveHour, usage.weekly], [0, 40]);
    assert.deepEqual(usage.reset, { fiveHour: true, weekly: false });
  });
});

const signedIn = { oauthAccount: { accountUuid: 'u', emailAddress: 'me@mail.test' } };
const token = (expiresAt = Date.now() + 3_600_000) => JSON.stringify({ claudeAiOauth: { accessToken: 'tok', expiresAt } });
const reply = body => async () => ({ ok: true, json: async () => body });

describe('live usage', () => {
  it('replaces the saved value with the fetched one', async () => {
    profile('live-ok', { ...signedIn, cachedUsageUtilization: { utilization: { seven_day: { utilization: 4 } } } });
    let sent;
    await refreshUsage(['live-ok'], {
      read: async () => token(),
      request: async (url, options) => { sent = options.headers; return reply({ seven_day: { utilization: 5 } })(); },
    });
    assert.equal(sent.Authorization, 'Bearer tok');
    const { usage } = accountInfo('live-ok');
    assert.equal(usage.weekly, 5);
    assert.ok(Date.now() - usage.savedAt < 5000);
  });

  it('keeps the saved value when the token expired, the request fails or is slow', async () => {
    const saved = { ...signedIn, cachedUsageUtilization: { utilization: { seven_day: { utilization: 4 } } } };
    for (const name of ['live-expired', 'live-error', 'live-bad', 'live-slow']) profile(name, saved);
    let asked = 0;
    const started = Date.now();
    await Promise.all([
      refreshUsage(['live-expired'], { read: async () => token(Date.now() - 1), request: async () => { asked++; return reply({})(); } }),
      refreshUsage(['live-error'], { read: async () => token(), request: async () => { throw new Error('offline'); } }),
      refreshUsage(['live-bad'], { read: async () => token(), request: async () => ({ ok: false, json: async () => ({}) }) }),
      refreshUsage(['live-slow'], { read: async () => token(), request: () => new Promise(() => {}), timeoutMs: 50 }),
    ]);
    assert.equal(asked, 0);
    assert.ok(Date.now() - started < 1000);
    for (const name of ['live-expired', 'live-error', 'live-bad', 'live-slow']) assert.equal(accountInfo(name).usage.weekly, 4, name);
  });

  it('skips profiles that never signed in', async () => {
    profile('live-fresh');
    let read = 0;
    await refreshUsage(['live-fresh'], { read: async () => { read++; return token(); }, request: reply({}) });
    assert.equal(read, 0);
  });
});
