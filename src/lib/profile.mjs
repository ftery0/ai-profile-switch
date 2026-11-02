import {
  existsSync, mkdirSync, rmSync, symlinkSync, copyFileSync, writeFileSync,
  readFileSync, lstatSync, statSync, readlinkSync, readdirSync, realpathSync,
  mkdtempSync, renameSync, chmodSync,
} from 'node:fs';
import { join, resolve, dirname, basename, relative, isAbsolute, sep } from 'node:path';
import {
  HOME, DEFAULT_CLAUDE_DIR, IS_WINDOWS, PROFILES_DIR, SHARED_DIR,
  PROFILE_NAME_REGEX, PROFILE_NAME_MAX_LENGTH, RESERVED_NAMES,
  SHARED_FILES, SHARED_DIRS, PROFILE_FILES, PROFILE_DIRS,
} from './constants.mjs';
import { createHash } from 'node:crypto';
import { addProfileToMeta, removeProfileFromMeta, readMeta, writeMeta } from './config.mjs';
import { userError, warn } from './ui.mjs';
import { t } from './i18n.mjs';

export function pathExists(path) {
  try { lstatSync(path); return true; } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return false;
    throw err;
  }
}

export function createLink(target, link, isDir, copySource = resolve(dirname(link), target)) {
  if (pathExists(link)) return;
  if (IS_WINDOWS && isDir) {
    symlinkSync(resolve(dirname(link), target), link, 'junction');
    return;
  }
  try {
    symlinkSync(target, link, isDir ? 'dir' : 'file');
  } catch (err) {
    if (!IS_WINDOWS || isDir || !['EPERM', 'ENOTSUP'].includes(err.code)) throw err;
    copyFileSync(copySource, link);
    warn(t('profile.copiedInstead', { link }));
    warn(t('profile.devMode'));
  }
}

export function validateProfileName(name) {
  if (!name) return t('profile.empty');
  if (name.length > PROFILE_NAME_MAX_LENGTH) {
    return t('profile.tooLong', { max: PROFILE_NAME_MAX_LENGTH });
  }
  if (RESERVED_NAMES.includes(name)) return t('profile.reserved', { name });
  if (IS_WINDOWS && /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name)) {
    return t('profile.reservedWindows', { name });
  }
  if (!PROFILE_NAME_REGEX.test(name)) return t('profile.invalidName');
  return null;
}

export function profileDir(name) {
  return join(PROFILES_DIR, name);
}

export function profileExists(name) {
  return existsSync(profileDir(name));
}

export function ensureShared() {
  mkdirSync(SHARED_DIR, { recursive: true });
  for (const file of SHARED_FILES) {
    const path = join(SHARED_DIR, file);
    if (!pathExists(path)) writeFileSync(path, '{}');
  }
  for (const dir of SHARED_DIRS) mkdirSync(join(SHARED_DIR, dir), { recursive: true });
}

export function createProfile(name, shareSettings = true) {
  const error = validateProfileName(name);
  if (error) throw new Error(error);
  readMeta();
  const dir = profileDir(name);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  if (shareSettings) {
    ensureShared();
    for (const file of SHARED_FILES) createLink(join('..', '_shared', file), join(dir, file), false);
    for (const entry of SHARED_DIRS) createLink(join('..', '_shared', entry), join(dir, entry), true);
  }
  for (const entry of PROFILE_DIRS) mkdirSync(join(dir, entry), { recursive: true });
  addProfileToMeta(name);
}

export function assertRegisteredProfile(name) {
  const error = validateProfileName(name);
  if (error) throw new Error(error);
  const meta = readMeta();
  if (!meta.profiles.includes(name)) {
    throw userError(t('profile.notFound', { name }), [
      ...(meta.profiles.length ? [{ label: t('hint.profiles'), text: meta.profiles.join(', ') }] : []),
      { label: t('hint.create'), command: `cpf add ${name}` },
    ]);
  }
  const dir = profileDir(name);
  if (!pathExists(dir)) throw new Error(t('profile.missingDir', { name }));
  const entry = lstatSync(dir);
  if (entry.isSymbolicLink() || !entry.isDirectory()) throw new Error(t('profile.notDirectory', { name }));
  return meta;
}

export function removeProfile(name) {
  assertRegisteredProfile(name);
  rmSync(profileDir(name), { recursive: true, force: true });
  removeProfileFromMeta(name);
}

// Checks a rename without changing anything, so callers can warn only when it can go ahead.
export function checkRename(oldName, newName) {
  const meta = assertRegisteredProfile(oldName);
  const error = validateProfileName(newName);
  if (error) throw new Error(error);
  if (oldName !== newName && (meta.profiles.includes(newName) || pathExists(profileDir(newName)))) {
    throw userError(t('profile.exists', { name: newName }), [
      { label: t('hint.profiles'), text: meta.profiles.join(', ') },
      { label: t('hint.otherName'), command: `cpf rename ${oldName} ${newName}-2` },
    ]);
  }
  return meta;
}

export function renameProfile(oldName, newName) {
  const meta = checkRename(oldName, newName);
  if (oldName === newName) return false;
  const oldDir = profileDir(oldName);
  const newDir = profileDir(newName);

  renameSync(oldDir, newDir);
  try {
    writeMeta({
      ...meta,
      profiles: meta.profiles.map(name => name === oldName ? newName : name),
      activeProfile: meta.activeProfile === oldName ? newName : meta.activeProfile,
    });
  } catch (err) {
    try {
      if (pathExists(oldDir)) throw new Error(`Original path is now occupied: ${oldDir}`);
      renameSync(newDir, oldDir);
    } catch (rollbackError) {
      throw new Error(`Profile rename rollback failed. Profile data is preserved at ${newDir}. Restore it to ${oldDir} before continuing.`, {
        cause: new AggregateError([err, rollbackError]),
      });
    }
    throw err;
  }
  return true;
}

export function listProfiles() {
  return readMeta().profiles;
}

export function migrationSource(sourceDir) {
  const directory = resolve(sourceDir);
  const configured = process.env.CLAUDE_CONFIG_DIR;
  const useRootConfig = directory === resolve(DEFAULT_CLAUDE_DIR)
    && (!configured || directory !== resolve(configured));
  return {
    directory,
    userConfig: useRootConfig ? join(HOME, '.claude.json') : join(directory, '.claude.json'),
  };
}

export function canonicalPath(path) {
  if (pathExists(path)) return realpathSync(path);
  return join(canonicalPath(dirname(path)), basename(path));
}

function pathsOverlap(left, right) {
  const distance = relative(left, right);
  return distance === '' || (distance !== '..' && !distance.startsWith(`..${sep}`) && !isAbsolute(distance));
}

export function linkTarget(path) {
  return resolve(realpathSync(dirname(path)), readlinkSync(path));
}

export function copyEntry(source, destination) {
  const info = lstatSync(source);
  if (info.isSymbolicLink()) {
    const target = linkTarget(source);
    const kind = existsSync(source) && statSync(source).isDirectory() ? 'dir' : 'file';
    createLink(target, destination, kind === 'dir');
  } else if (info.isDirectory()) {
    mkdirSync(destination, { recursive: true, mode: info.mode & 0o777 });
    for (const entry of readdirSync(source)) copyEntry(join(source, entry), join(destination, entry));
  } else if (info.isFile()) {
    copyFileSync(source, destination);
  } else {
    throw new Error(`Unsupported migration entry: ${source}`);
  }
}

export function identicalEntries(source, destination) {
  let from = lstatSync(source);
  let to = lstatSync(destination);
  if (from.isSymbolicLink() && to.isSymbolicLink() && linkTarget(source) === linkTarget(destination)) return true;
  if (from.isSymbolicLink()) {
    if (!existsSync(source)) return false;
    from = statSync(source);
  }
  if (to.isSymbolicLink()) {
    if (!existsSync(destination)) return false;
    to = statSync(destination);
  }
  if (from.isFile() && to.isFile()) return readFileSync(source).equals(readFileSync(destination));
  if (!from.isDirectory() || !to.isDirectory()) return false;
  const entries = readdirSync(source).sort();
  const existing = readdirSync(destination).sort();
  return entries.length === existing.length && entries.every((entry, index) =>
    entry === existing[index] && identicalEntries(join(source, entry), join(destination, entry)));
}

export function emptyEntry(path) {
  const info = lstatSync(path);
  if (info.isSymbolicLink()) return false;
  if (info.isDirectory()) return readdirSync(path).length === 0;
  if (!info.isFile()) return false;
  const content = readFileSync(path, 'utf8').trim();
  return content === '' || (path.endsWith('.json') && content === '{}');
}

function validateJson(source) {
  if (!source.endsWith('.json')) return;
  let value;
  try { value = JSON.parse(readFileSync(source, 'utf8').replace(/^\uFEFF/, '')); } catch {
    throw new Error(`Invalid JSON in migration source: ${source}`);
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Expected a JSON object in migration source: ${source}`);
  }
}

// Claude Code saves absolute paths in its plugin indexes. Copied as they are, a profile would keep
// loading plugins from the source folder and break once that folder is removed.
const PLUGIN_INDEXES = ['installed_plugins.json', 'known_marketplaces.json'];

function repointPlugins(plugins, sourceDir, targetDir) {
  if (!pathExists(plugins) || !lstatSync(plugins).isDirectory()) return;
  const to = join(targetDir, 'plugins');
  const prefixes = [...new Set([join(sourceDir, 'plugins'), join(canonicalPath(sourceDir), 'plugins')])];
  const move = value => {
    if (typeof value === 'string') {
      const from = prefixes.find(prefix => value === prefix
        || value.startsWith(prefix + sep) || value.startsWith(prefix + '/'));
      return from ? to + value.slice(from.length) : value;
    }
    if (Array.isArray(value)) return value.map(move);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, move(item)]));
    }
    return value;
  };
  for (const name of PLUGIN_INDEXES) {
    const path = join(plugins, name);
    if (!pathExists(path) || !lstatSync(path).isFile()) continue;
    const text = readFileSync(path, 'utf8');
    let index;
    try { index = JSON.parse(text); } catch { continue; }
    const moved = JSON.stringify(move(index), null, 2);
    if (moved !== JSON.stringify(index, null, 2)) writeFileSync(path, moved + '\n');
  }
}

function stageEntry(source, destination) {
  if (!pathExists(source)) return;
  if (pathExists(destination)) {
    if (identicalEntries(source, destination) || emptyEntry(source)) return;
    if (!emptyEntry(destination)) throw new Error(`Migration conflict: ${destination}`);
    rmSync(destination, { recursive: true, force: true });
  }
  copyEntry(source, destination);
}

function migrationFingerprint(path) {
  const hash = createHash('sha256');
  const visit = current => {
    const entry = lstatSync(current);
    hash.update(JSON.stringify([
      relative(path, current), entry.mode, entry.dev, entry.ino, entry.mtimeMs,
      // Moving the root into a backup changes its ctime without changing its data.
      current === path ? null : entry.ctimeMs,
    ]));
    if (entry.isSymbolicLink()) hash.update(readlinkSync(current));
    else if (entry.isDirectory()) {
      for (const name of readdirSync(current).sort()) visit(join(current, name));
    } else if (entry.isFile()) hash.update(readFileSync(current));
  };
  try {
    visit(path);
    return hash.digest('hex');
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return null;
    throw err;
  }
}

function prepareMigration(source, profileName, shareSettings, stage) {
  const target = profileDir(profileName);
  const stagedProfile = join(stage, 'profile');
  const stagedShared = join(stage, '_shared');
  for (const [current, staged] of [[target, stagedProfile], [SHARED_DIR, stagedShared]]) {
    if (current === SHARED_DIR && !shareSettings) continue;
    if (pathExists(current)) {
      if (!lstatSync(current).isDirectory()) throw new Error(`Migration target must be a directory: ${current}`);
      copyEntry(current, staged);
    } else mkdirSync(staged, { mode: 0o700 });
  }
  for (const file of PROFILE_FILES) {
    const from = file === '.claude.json' ? source.userConfig : join(source.directory, file);
    if (!pathExists(from)) continue;
    validateJson(from);
    const destination = join(stagedProfile, file);
    if (file === '.claude.json' || file === '.credentials.json') {
      if (pathExists(destination) && !emptyEntry(destination)
        && !readFileSync(from).equals(readFileSync(destination))) {
        throw new Error(`Migration conflict: ${join(target, file)}`);
      }
      if (pathExists(destination)) rmSync(destination, { force: true });
      writeFileSync(destination, readFileSync(from), { mode: 0o600 });
    } else stageEntry(from, destination);
  }
  for (const entry of PROFILE_DIRS) {
    stageEntry(join(source.directory, entry), join(stagedProfile, entry));
    if (!pathExists(join(stagedProfile, entry))) mkdirSync(join(stagedProfile, entry));
  }
  repointPlugins(join(stagedProfile, 'plugins'), source.directory, target);
  for (const entry of [...SHARED_FILES, ...SHARED_DIRS]) {
    const shared = shareSettings ? stagedShared : stagedProfile;
    const from = join(source.directory, entry);
    if (pathExists(from)) validateJson(from);
    stageEntry(from, join(shared, entry));
    if (!shareSettings) continue;
    const isDir = SHARED_DIRS.includes(entry);
    if (!pathExists(join(shared, entry))) {
      if (isDir) mkdirSync(join(shared, entry));
      else writeFileSync(join(shared, entry), '{}');
    }
    const link = join(stagedProfile, entry);
    if (pathExists(link)) {
      const original = join(target, entry);
      const linkedShared = lstatSync(link).isSymbolicLink()
        && canonicalPath(linkTarget(link)) === canonicalPath(join(SHARED_DIR, entry));
      if (!linkedShared && !identicalEntries(link, join(shared, entry)) && !emptyEntry(link)) {
        throw new Error(`Migration conflict: ${original}`);
      }
      rmSync(link, { recursive: true, force: true });
    }
    const linkPath = IS_WINDOWS ? join(SHARED_DIR, entry) : join('..', '_shared', entry);
    createLink(linkPath, link, isDir, join(shared, entry));
  }
  chmodSync(stagedProfile, 0o700);
  return shareSettings
    ? [[stagedShared, SHARED_DIR], [stagedProfile, target]]
    : [[stagedProfile, target]];
}

// Windows and WSL1 refuse to move a folder while a running session keeps a file in it open.
function moveAside(destination, backup) {
  try {
    renameSync(destination, backup);
  } catch (err) {
    if (!['EPERM', 'EACCES', 'EBUSY'].includes(err.code)) throw err;
    throw new Error(`Migration destination is in use: ${destination}. Close Claude sessions using the source and destination, then retry.`, { cause: err });
  }
}

export function migrateDir(sourceDir, profileName, shareSettings = true) {
  const error = validateProfileName(profileName);
  if (error) throw new Error(error);
  readMeta();
  const source = migrationSource(sourceDir);
  if (!existsSync(source.directory) && !existsSync(source.userConfig)) {
    throw new Error(`Claude configuration not found: ${source.directory}`);
  }
  if (existsSync(source.directory) && !statSync(source.directory).isDirectory()) {
    throw new Error(`Migration source must be a directory: ${source.directory}`);
  }
  const from = canonicalPath(source.directory);
  for (const path of [profileDir(profileName), ...(shareSettings ? [SHARED_DIR] : [])]) {
    const to = canonicalPath(path);
    if (pathsOverlap(from, to) || pathsOverlap(to, from)) {
      throw new Error(`Migration source and target overlap: ${source.directory} and ${path}`);
    }
  }
  const originals = [profileDir(profileName), ...(shareSettings ? [SHARED_DIR] : [])];
  const fingerprints = new Map(originals.map(path => [path, migrationFingerprint(path)]));
  mkdirSync(PROFILES_DIR, { recursive: true });
  const stage = mkdtempSync(join(PROFILES_DIR, '.migration-'));
  chmodSync(stage, 0o700);
  const published = [];
  let cleanup = true;
  try {
    const entries = prepareMigration(source, profileName, shareSettings, stage);
    const backups = entries.flatMap(([, destination], index) => pathExists(destination)
      ? [{ original: destination, backup: join(stage, `backup-${index}`) }] : []);
    if (backups.length) {
      writeFileSync(join(stage, 'backup-info.json'), JSON.stringify({
        profile: profileName, source: source.directory, backups,
      }, null, 2) + '\n', { mode: 0o600 });
    }
    for (const destination of originals) {
      if (migrationFingerprint(destination) !== fingerprints.get(destination)) {
        throw new Error(`Migration destination changed while preparing: ${destination}. Close Claude sessions using the source and destination, then retry.`);
      }
    }
    for (const [staged, destination] of entries) {
      const backup = join(stage, `backup-${published.length}`);
      const hadOriginal = pathExists(destination);
      if (hadOriginal) moveAside(destination, backup);
      published.push({ destination, backup, hadOriginal });
      if (hadOriginal && migrationFingerprint(backup) !== fingerprints.get(destination)) {
        throw new Error(`Migration destination changed before replacement: ${destination}. Close Claude sessions using the source and destination, then retry.`);
      }
      renameSync(staged, destination);
    }
    addProfileToMeta(profileName);
    if (backups.length) cleanup = false;
    return { backupPath: backups.length ? stage : null };
  } catch (err) {
    const rollbackErrors = [];
    for (const { destination, backup, hadOriginal } of published.reverse()) {
      try {
        rmSync(destination, { recursive: true, force: true });
        if (hadOriginal) renameSync(backup, destination);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length > 0) {
      cleanup = false;
      throw new Error(`Migration rollback failed. Original backups were preserved in ${stage}. Restore them before continuing.`, { cause: err });
    }
    throw err;
  } finally {
    if (cleanup) rmSync(stage, { recursive: true, force: true });
  }
}
