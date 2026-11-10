import { spawn, execFileSync } from 'node:child_process';
import { accessSync, constants, statSync } from 'node:fs';
import { constants as osConstants } from 'node:os';
import { join, delimiter } from 'node:path';
import { getActiveProfile, setActiveProfile } from '../lib/config.mjs';
import { HOME, IS_WINDOWS } from '../lib/constants.mjs';
import { installAllShells } from '../lib/shell.mjs';
import { listProfiles, profileDir, assertRegisteredProfile } from '../lib/profile.mjs';
import { color, colorFor, intro, meter, outro, success, sym, userError, warn } from '../lib/ui.mjs';
import { accountInfo, refreshUsage } from '../lib/account.mjs';
import { relativeTime, t } from '../lib/i18n.mjs';
import { syncShared } from '../lib/shared.mjs';
import { reportConflicts } from './share.mjs';
import * as prompt from '../lib/prompt.mjs';
import { scheduleSelfUpdate } from '../lib/self-update.mjs';

export async function shell(argv = []) {
  const [subcommand, ...args] = argv;
  switch (subcommand) {
    case 'launch': {
      let profile;
      let forwarded = args;
      if (args[0] === '--profile') {
        if (!args[1] || args[2] !== '--') throw new Error('Expected shell launch --profile <name> -- <args>');
        profile = args[1];
        forwarded = args.slice(3);
      }
      await launch(forwarded, profile);
      return;
    }
    case 'use':
      if (args.length !== 1) throw new Error('Usage: cpf <profile-name>');
      useProfile(args[0]);
      return;
    case 'pick':
      if (args.length && (args.length !== 1 || args[0] !== '--print')) throw new Error('Usage: shell pick [--print]');
      await pickProfile(args[0] === '--print');
      return;
    case 'refresh':
      if (args.length) throw new Error('Usage: shell refresh');
      installAllShells();
      success(t('shell.refreshed'));
      return;
    default:
      throw new Error('Usage: shell <launch|use|pick|refresh>');
  }
}

async function launch(args, selected) {
  const profile = selected ?? await selectProfile({ launching: true });
  if (!profile) {
    process.exitCode = 130;
    return;
  }
  assertRegisteredProfile(profile);
  const bin = resolveClaudeBinary();
  if (!bin) {
    console.error(`${t('launch.notFound')} ${t('launch.install')} https://code.claude.com/docs/en/setup`);
    process.exitCode = 127;
    return;
  }
  scheduleSelfUpdate();
  if (getActiveProfile() !== profile) setActiveProfile(profile);
  // Sharing is a convenience; a broken link must not stop Claude from starting.
  try { reportConflicts(syncShared([profile])); } catch (err) { warn(t('launch.sharedFailed', { message: err.message })); }
  // The picker already told a person which account starts; logs still get a plain line.
  if (!process.stderr.isTTY) process.stderr.write(`[ai-profile-switch] Profile: ${profile}\n`);
  const cmd = bin.endsWith('.js') ? process.execPath : bin;
  const childArgs = bin.endsWith('.js') ? [bin, ...args] : args;
  const result = await new Promise(resolve => {
    const child = spawn(cmd, childArgs, {
      stdio: 'inherit', shell: false,
      env: { ...process.env, CLAUDE_CONFIG_DIR: profileDir(profile) },
    });
    let interrupted;
    const onInt = () => { interrupted = 'SIGINT'; child.kill('SIGINT'); };
    const onTerm = () => { interrupted = 'SIGTERM'; child.kill('SIGTERM'); };
    process.on('SIGINT', onInt);
    process.on('SIGTERM', onTerm);
    const cleanup = () => {
      process.removeListener('SIGINT', onInt);
      process.removeListener('SIGTERM', onTerm);
    };
    child.once('error', err => {
      cleanup();
      console.error(t('launch.startFailed', { message: err.message }));
      resolve(1);
    });
    child.once('close', (code, signal) => {
      cleanup();
      resolve(interrupted ? 128 + osConstants.signals[interrupted] : code ?? (128 + (osConstants.signals[signal] ?? 1)));
    });
  });
  process.exitCode = result;
}

function useProfile(name) {
  assertRegisteredProfile(name);
  if (getActiveProfile() !== name) setActiveProfile(name);
  success(t('use.switched', { profile: name }));
}

// The claude shell function runs `pick --print` and then launches the printed profile.
async function pickProfile(printOnly) {
  const profile = await selectProfile({ launching: printOnly });
  if (!profile) {
    process.exitCode = 130;
    return;
  }
  if (getActiveProfile() !== profile) setActiveProfile(profile);
  if (printOnly) process.stdout.write(profile + '\n');
}

export function accountSummary({ email, plan }) {
  return [email, plan].filter(Boolean).join(' · ');
}

export function usageLine({ usage }) {
  if (!usage) return color.dim(t('account.noUsage'));
  const parts = [];
  const reset = key => (usage.reset?.[key] ? ` ${color.dim(t('account.reset'))}` : '');
  if (usage.fiveHour !== null) parts.push(`${t('account.fiveHour')} ${meter(usage.fiveHour)}${reset('fiveHour')}`);
  if (usage.weekly !== null) parts.push(`${t('account.weekly')} ${meter(usage.weekly)}${reset('weekly')}`);
  if (usage.savedAt) parts.push(color.dim(t('account.savedAt', { time: relativeTime(usage.savedAt) })));
  return parts.join('   ');
}

// One picker row per profile: name, in use or last used, then account and usage lines.
export function profileChoices(profiles, active) {
  const width = Math.max(...profiles.map(name => name.length));
  return profiles.map(name => profileChoice(name, active, width));
}

function profileChoice(name, active, width) {
  const account = accountInfo(name);
  const hint = name === active
    ? color.green(`${sym.bulletOn} ${t('picker.inUse')}`)
    : account.lastUsed ? color.dim(relativeTime(account.lastUsed)) : '';
  const summary = accountSummary(account);
  const details = summary
    ? [color.dim(summary), usageLine(account)]
    : [color.dim(t('account.notSignedIn'))];
  return { label: name.padEnd(width), value: name, hint, details, summary };
}

async function selectProfile({ launching = false } = {}) {
  const profiles = listProfiles();
  if (!profiles.length) {
    throw userError(t('profiles.none'), [
      { label: t('hint.add'), command: 'cpf add work' },
      { label: t('hint.setup'), command: 'npx ai-profile-switch@latest init' },
    ]);
  }
  const active = getActiveProfile();
  const output = process.stderr;
  colorFor(output);
  if (!process.stdin.isTTY || profiles.length === 1) {
    const selected = active ?? profiles[0];
    assertRegisteredProfile(selected);
    if (launching && output.isTTY) {
      const summary = accountSummary(accountInfo(selected));
      output.write(`${color.green(sym.stepDone)}  ${t('picker.starting', { profile: color.bold(selected) })}${summary ? `  ${color.dim(summary)}` : ''}\n`);
    }
    return selected;
  }
  await refreshUsage(profiles);
  const choices = profileChoices(profiles, active);
  intro('ai-profile-switch', '', output);
  const selected = await prompt.select(t('picker.question'), choices, {
    output, initial: profiles.indexOf(active), numbered: true,
    done: name => {
      const { summary } = choices.find(choice => choice.value === name);
      const message = t(launching ? 'picker.starting' : 'picker.switched', { profile: color.bold(name) });
      return `${message}${summary ? `  ${color.dim(summary)}` : ''}`;
    },
  });
  outro(selected && launching ? t('launch.opening') : '', output);
  if (selected) assertRegisteredProfile(selected);
  return selected;
}

// Declared below; the Windows resolver test runs that part on its own.
export { resolveClaudeBinary };

function executable(file) {
  try {
    accessSync(file, IS_WINDOWS ? constants.F_OK : constants.X_OK);
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

function resolveClaudeBinary() {
  const names = IS_WINDOWS ? ['claude.exe'] : ['claude'];
  for (const directory of (process.env.PATH ?? '').split(delimiter).filter(Boolean)) {
    for (const name of names) {
      const file = join(directory, name);
      if (executable(file)) return file;
    }
  }
  const binName = IS_WINDOWS ? 'claude.exe' : 'claude';
  const native = [join(HOME, '.local/bin', binName), join(HOME, '.claude/local', binName)];
  if (!IS_WINDOWS) native.push('/opt/homebrew/bin/claude', '/usr/local/bin/claude');
  const found = native.find(executable);
  if (found) return found;
  try {
    const npmRoot = execFileSync(IS_WINDOWS ? 'npm.cmd' : 'npm', ['root', '-g'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000, shell: IS_WINDOWS,
    }).trim();
    const candidates = IS_WINDOWS ? ['bin/claude.exe', 'cli.js'] : ['bin/claude', 'cli.js'];
    return candidates
      .map(file => join(npmRoot, '@anthropic-ai/claude-code', file))
      .find(file => executable(file) || (file.endsWith('.js') && executable(process.execPath) && exists(file))) ?? null;
  } catch {
    return null;
  }
}

function exists(file) {
  try { accessSync(file); return statSync(file).isFile(); } catch { return false; }
}
