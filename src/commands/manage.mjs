import * as prompt from '../lib/prompt.mjs';
import { readMeta } from '../lib/config.mjs';
import { color, displayWidth, error, intro, sym, warn } from '../lib/ui.mjs';
import { accountInfo, refreshUsage } from '../lib/account.mjs';
import { HOME } from '../lib/constants.mjs';
import { LANGUAGE_NAMES, language as currentLanguage, relativeTime, t } from '../lib/i18n.mjs';
import { checkRename, profileDir } from '../lib/profile.mjs';
import { add } from './add.mjs';
import { list } from './list.mjs';
import { login } from './login.mjs';
import { accountSummary, profileChoices, usageLine } from './shell.mjs';
import { use } from './use.mjs';
import { remove } from './remove.mjs';
import { rename } from './rename.mjs';
import { share } from './share.mjs';
import { language } from './language.mjs';

function help() {
  console.log(t('manage.help'));
}

export async function manage(args = []) {
  if (args.some(arg => ['--help', '-h'].includes(arg))) {
    help();
    return;
  }
  if (args.length === 1 && args[0] === '--list') return list();
  if (args[0] === 'share') return share(args.slice(1));
  if (args[0] === 'language') return language(args.slice(1));
  if (args.length === 1 && !args[0].startsWith('-')) return use(args[0]);
  if (args.length > 0) {
    const [command, ...names] = args;
    const operations = { add: [1, add], remove: [1, remove], rename: [2, rename], login: [1, login] };
    const operation = Object.hasOwn(operations, command) ? operations[command] : undefined;
    if (!operation || names.length !== operation[0] || names.some(name => name.startsWith('-'))) {
      throw new Error(t('manage.invalid'));
    }
    return operation[1](...names);
  }
  if (!process.stdin.isTTY) {
    help();
    return;
  }

  const start = readMeta().activeProfile;
  const email = start ? accountInfo(start).email : null;
  intro('ai-profile-switch', start ? t('menu.current', { name: [start, email].filter(Boolean).join(' · ') }) : '');
  while (true) {
    const meta = readMeta();
    const item = (value, hint) => ({ label: t(`menu.${value}`), value, hint: hint && color.dim(hint) });
    const languageItem = item('language', LANGUAGE_NAMES[currentLanguage()]);
    const actions = meta.profiles.length
      ? [item('use'), item('manage', t('menu.manageHint')), item('add'), item('share'), languageItem, item('exit')]
      : [item('add'), languageItem, item('exit')];
    const action = await prompt.select(t('menu.question'), actions);
    if (!action || action === 'exit') return;
    try {
      if (action === 'share') {
        await share();
      } else if (action === 'language') {
        await language();
      } else if (action === 'add') {
        const name = await prompt.text(t('menu.addName'));
        if (name) await add(name);
      } else if (action === 'use') {
        const name = await pickProfile(t('menu.usePick'), meta);
        if (name) await use(name);
      } else {
        await manageProfiles();
      }
    } catch (err) {
      error(err.message, err.hints);
    }
  }
}

async function pickProfile(question, meta) {
  await refreshUsage(meta.profiles);
  return prompt.select(question, profileChoices(meta.profiles, meta.activeProfile), {
    initial: Math.max(0, meta.profiles.indexOf(meta.activeProfile)), numbered: true, back: true,
  });
}

// Pick a profile, then act on it from its detail screen until Back.
async function manageProfiles() {
  while (true) {
    const meta = readMeta();
    if (!meta.profiles.length) return;
    const name = await pickProfile(t('menu.managePick'), meta);
    if (!name) return;
    let current = name;
    while (current) {
      try {
        current = await profileDetail(current);
      } catch (err) {
        error(err.message, err.hints);
      }
    }
  }
}

function detailLines(name) {
  const account = accountInfo(name);
  const rows = [
    [t('detail.account'), accountSummary(account) || color.dim(t('account.notSignedIn'))],
    ...(account.email ? [[t('detail.usage'), account.usage ? usageLine(account) : color.dim(t('detail.noUsage'))]] : []),
    [t('detail.lastUsed'), account.lastUsed ? relativeTime(account.lastUsed) : color.dim(t('detail.never'))],
    [t('detail.folder'), color.dim(shortPath(profileDir(name)))],
  ];
  const width = Math.max(...rows.map(([label]) => displayWidth(label)));
  return [...rows.map(([label, value]) => `${color.dim(label)}${' '.repeat(width - displayWidth(label) + 2)}${value}`), ''];
}

function shortPath(path) {
  return path.startsWith(HOME) ? `~${path.slice(HOME.length)}` : path;
}

// Returns the profile to show again, or null to go back to the list.
async function profileDetail(name) {
  const title = t('detail.title', { name });
  const action = await prompt.select(color.bold(title), [
    { label: t('detail.use'), value: 'use' },
    { label: t('detail.rename'), value: 'rename' },
    { label: t('detail.login'), value: 'login', hint: color.dim(t('detail.loginHint')) },
    { label: t('detail.remove'), value: 'remove', hint: color.dim(t('menu.removeHint')) },
    { label: t('detail.back'), value: 'back' },
  ], { body: detailLines(name), back: true });
  if (!action || action === 'back') return null;
  if (action === 'use') {
    await use(name);
    return name;
  }
  if (action === 'remove') {
    await remove(name);
    return readMeta().profiles.includes(name) ? name : null;
  }
  if (action === 'rename') {
    warn(t('rename.closeSessions', { name }));
    const newName = await prompt.text(t('rename.newName'), undefined, t('rename.newNameHint', { name }));
    if (!newName || newName === name) return name;
    checkRename(name, newName);
    if (!await prompt.confirm(t('rename.confirm', { old: name, new: newName }), false)) return name;
    await rename(name, newName, { warned: true });
    return newName;
  }
  const account = accountSummary(accountInfo(name));
  console.log(`${color.dim(sym.rail)}  ${color.dim(t('login.current'))} ${account || color.dim(t('account.notSignedIn'))}`);
  console.log(`${color.dim(sym.rail)}  ${color.dim(t('login.onlyThis'))}`);
  console.log(`${color.dim(sym.rail)}  ${color.dim(t('login.browser'))}`);
  console.log(`${color.dim(sym.rail)}  ${color.dim(t('login.closeSessions', { name }))}`);
  if (await prompt.confirm(t('login.confirm', { name }), false)) await login(name, { explained: true });
  return name;
}
