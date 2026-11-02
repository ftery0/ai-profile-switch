import './helpers/home.mjs';
import { beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs, {
  appendFileSync, closeSync, existsSync, lstatSync, mkdirSync, mkdtempSync, openSync,
  readFileSync, readlinkSync, readdirSync, renameSync, rmSync, writeFileSync, writeSync,
} from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { DEFAULT_CLAUDE_DIR, HOME, IS_WINDOWS, META_FILE, PROFILES_DIR, SHARED_DIR } from '../src/lib/constants.mjs';
import { createProfile, migrateDir, profileDir } from '../src/lib/profile.mjs';

const cli = fileURLToPath(new URL('../bin/cli.mjs', import.meta.url));

function write(path, data) {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, data, { mode: 0o600 });
}

function snapshot(path) {
  let entry;
  try { entry = lstatSync(path); } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
  if (entry.isSymbolicLink()) return { link: readlinkSync(path) };
  const mode = entry.mode & 0o777;
  if (entry.isFile()) return { mode, bytes: readFileSync(path).toString('hex') };
  return { mode, entries: Object.fromEntries(readdirSync(path).sort().map(name => [name, snapshot(join(path, name))])) };
}

function source() {
  write(join(HOME, '.claude.json'), '{"fixture":"default account"}');
  mkdirSync(DEFAULT_CLAUDE_DIR, { recursive: true });
  return DEFAULT_CLAUDE_DIR;
}

function stages() {
  return readdirSync(PROFILES_DIR).filter(name => name.startsWith('.migration-'));
}

// POSIX moves a folder with an open file in it; Windows and WSL1 refuse.
function canMoveFolderWithOpenFile() {
  const folder = mkdtempSync(join(HOME, 'open-file-probe-'));
  const moved = `${folder}-moved`;
  const fd = openSync(join(folder, 'held'), 'a');
  try {
    renameSync(folder, moved);
    return true;
  } catch (err) {
    if (!['EPERM', 'EACCES', 'EBUSY'].includes(err.code)) throw err;
    return false;
  } finally {
    closeSync(fd);
    rmSync(folder, { recursive: true, force: true });
    rmSync(moved, { recursive: true, force: true });
  }
}

const CAN_MOVE_OPEN_FOLDER = canMoveFolderWithOpenFile();

function restoreMocks() {
  mock.restoreAll();
  syncBuiltinESMExports();
}

beforeEach(() => {
  for (const name of readdirSync(HOME)) rmSync(join(HOME, name), { recursive: true, force: true });
  delete process.env.CLAUDE_CONFIG_DIR;
});

describe('migration data coverage and recovery backups', () => {
  it('imports default account checkpoints and customizations without changing the original', () => {
    const path = source();
    const entries = [
      ['file-history/session/file@v1', Buffer.from([0, 10, 255])],
      ['keybindings.json', '{"bindings":[]}'],
      ['output-styles/focus.md', '# focus style'],
      ['agent-memory/custom/MEMORY.md', '# persistent subagent memory'],
      ['workflows/custom.js', 'export default () => {};'],
      ['themes/custom.json', '{"name":"fixture"}'],
      ['tasks/list/task.json', '{"subject":"fixture task"}'],
      ['projects/project/session.jsonl', '{"type":"user"}\n'],
      ['history.jsonl', '{"display":"fixture prompt"}\n'],
    ];
    for (const [entry, contents] of entries) write(join(path, entry), contents);
    const original = snapshot(path);
    const { backupPath } = migrateDir(path, 'work', false);
    assert.equal(backupPath, null, 'a fresh destination needs no recovery backup');
    assert.deepEqual(snapshot(path), original);
    for (const [entry] of entries) {
      assert.deepEqual(readFileSync(join(profileDir('work'), entry)), readFileSync(join(path, entry)), entry);
    }
    assert.equal(readFileSync(join(profileDir('work'), '.claude.json'), 'utf8'), '{"fixture":"default account"}');
    assert.deepEqual(stages(), []);
  });

  it('points copied plugin indexes at the profile, not the source folder', () => {
    const path = source();
    const plugins = join(path, 'plugins');
    const installed = {
      version: 2,
      plugins: { 'lsp@market': [{ scope: 'user', installPath: join(plugins, 'cache', 'market', 'lsp', '1.0.0') }] },
    };
    const marketplaces = {
      market: { source: { source: 'github', repo: 'owner/market' }, installLocation: join(plugins, 'marketplaces', 'market') },
      elsewhere: { installLocation: join(HOME, 'elsewhere', 'plugins') },
    };
    write(join(plugins, 'installed_plugins.json'), JSON.stringify(installed));
    write(join(plugins, 'known_marketplaces.json'), JSON.stringify(marketplaces));
    write(join(plugins, 'cache', 'market', 'lsp', '1.0.0', 'plugin.json'), '{}');
    const original = snapshot(path);

    migrateDir(path, 'work', false);

    const copied = join(profileDir('work'), 'plugins');
    const read = name => JSON.parse(readFileSync(join(copied, name), 'utf8'));
    assert.equal(read('installed_plugins.json').plugins['lsp@market'][0].installPath,
      join(copied, 'cache', 'market', 'lsp', '1.0.0'));
    assert.equal(read('known_marketplaces.json').market.installLocation, join(copied, 'marketplaces', 'market'));
    assert.equal(read('known_marketplaces.json').elsewhere.installLocation, join(HOME, 'elsewhere', 'plugins'),
      'paths outside the source plugins folder stay as they are');
    assert.deepEqual(snapshot(path), original, 'the source indexes are not rewritten');
  });

  it('retains the original shared and profile data with a private path mapping', () => {
    createProfile('work');
    write(join(profileDir('work'), '.credentials.json'), '{"fixture":"original credential"}');
    write(join(profileDir('work'), 'history.jsonl'), 'original history\n');
    const oldProfile = snapshot(profileDir('work'));
    const oldShared = snapshot(SHARED_DIR);
    const path = source();
    write(join(path, 'settings.json'), '{"theme":"dark"}');
    const { backupPath } = migrateDir(path, 'work');
    assert.ok(backupPath && existsSync(backupPath));
    const info = JSON.parse(readFileSync(join(backupPath, 'backup-info.json'), 'utf8'));
    assert.equal(info.profile, 'work');
    assert.equal(info.source, path);
    assert.deepEqual(info.backups.map(item => item.original), [SHARED_DIR, profileDir('work')]);
    assert.deepEqual(snapshot(info.backups[0].backup), oldShared);
    assert.deepEqual(snapshot(info.backups[1].backup), oldProfile);
    assert.deepEqual(info.backups.map(item => basename(item.backup)), ['backup-0', 'backup-1']);
    if (!IS_WINDOWS) {
      assert.equal(lstatSync(backupPath).mode & 0o777, 0o700);
      assert.equal(lstatSync(join(backupPath, 'backup-info.json')).mode & 0o777, 0o600);
    }
    assert.equal(readFileSync(join(SHARED_DIR, 'settings.json'), 'utf8'), '{"theme":"dark"}');
  });

  it('keeps a late write through an existing file descriptor recoverable, or refuses while the file is held open', () => {
    createProfile('work', false);
    const history = join(profileDir('work'), 'history.jsonl');
    write(history, 'original history\n');
    const fd = openSync(history, 'a');
    try {
      if (!CAN_MOVE_OPEN_FOLDER) {
        assert.throws(() => migrateDir(source(), 'work', false), /Migration destination is in use/);
        assert.equal(readFileSync(history, 'utf8'), 'original history\n');
        assert.deepEqual(stages(), []);
        return;
      }
      const { backupPath } = migrateDir(source(), 'work', false);
      writeSync(fd, 'late session write\n');
      assert.equal(readFileSync(history, 'utf8'), 'original history\n');
      const info = JSON.parse(readFileSync(join(backupPath, 'backup-info.json'), 'utf8'));
      assert.equal(readFileSync(join(info.backups[0].backup, 'history.jsonl'), 'utf8'), 'original history\nlate session write\n');
    } finally {
      closeSync(fd);
    }
  });

  it('warns about running sessions and prints the recovery backup path in the CLI', () => {
    createProfile('work');
    const result = spawnSync(process.execPath, [cli, 'migrate', 'work', '--from', source()], {
      env: process.env, encoding: 'utf8', timeout: 10000,
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /Close Claude sessions using the source or destination/);
    assert.match(result.stdout, /Previous destination data backup:/);
    const backups = stages();
    assert.equal(backups.length, 1);
    assert.ok(result.stdout.includes(join(PROFILES_DIR, backups[0])));
  });
});

describe('migration concurrent destination changes', () => {
  it('aborts if the destination history changes while staging and keeps the new history', () => {
    createProfile('work');
    const history = join(profileDir('work'), 'history.jsonl');
    write(history, 'original history\n');
    const meta = readFileSync(META_FILE);
    const path = source();
    const copy = fs.copyFileSync;
    let changed = false;
    mock.method(fs, 'copyFileSync', (from, to, ...args) => {
      const result = copy(from, to, ...args);
      if (from === history && !changed) {
        changed = true;
        appendFileSync(history, 'concurrent session write\n');
      }
      return result;
    });
    syncBuiltinESMExports();
    try {
      assert.throws(() => migrateDir(path, 'work'), /destination changed while preparing/);
    } finally { restoreMocks(); }
    assert.equal(readFileSync(history, 'utf8'), 'original history\nconcurrent session write\n');
    assert.deepEqual(readFileSync(META_FILE), meta);
    assert.equal(existsSync(join(profileDir('work'), '.claude.json')), false);
    assert.deepEqual(stages(), []);
  });

  it('aborts if shared settings change while staging and preserves every profile link', () => {
    createProfile('work');
    createProfile('personal');
    const settings = join(SHARED_DIR, 'settings.json');
    const path = source();
    const copy = fs.copyFileSync;
    let changed = false;
    mock.method(fs, 'copyFileSync', (from, to, ...args) => {
      const result = copy(from, to, ...args);
      if (from === settings && !changed) {
        changed = true;
        writeFileSync(settings, '{"fixture":"concurrent setting"}');
      }
      return result;
    });
    syncBuiltinESMExports();
    try {
      assert.throws(() => migrateDir(path, 'work'), /destination changed while preparing/);
    } finally { restoreMocks(); }
    assert.equal(readFileSync(settings, 'utf8'), '{"fixture":"concurrent setting"}');
    if (lstatSync(join(profileDir('work'), 'settings.json')).isSymbolicLink()) {
      assert.equal(readFileSync(join(profileDir('work'), 'settings.json'), 'utf8'), '{"fixture":"concurrent setting"}');
      assert.equal(readFileSync(join(profileDir('personal'), 'settings.json'), 'utf8'), '{"fixture":"concurrent setting"}');
    }
    assert.equal(existsSync(join(profileDir('work'), '.claude.json')), false);
    assert.deepEqual(stages(), []);
  });

  it('rolls back a change between the final check and moving the original profile', () => {
    createProfile('work');
    const target = profileDir('work');
    const history = join(target, 'history.jsonl');
    write(history, 'original history\n');
    const shared = snapshot(SHARED_DIR);
    const meta = readFileSync(META_FILE);
    const path = source();
    const rename = fs.renameSync;
    let changed = false;
    mock.method(fs, 'renameSync', (from, to) => {
      if (from === target && !changed) {
        changed = true;
        appendFileSync(history, 'last moment session write\n');
      }
      return rename(from, to);
    });
    syncBuiltinESMExports();
    try {
      assert.throws(() => migrateDir(path, 'work'), /destination changed before replacement/);
    } finally { restoreMocks(); }
    assert.equal(readFileSync(history, 'utf8'), 'original history\nlast moment session write\n');
    assert.deepEqual(readFileSync(META_FILE), meta);
    assert.deepEqual(snapshot(SHARED_DIR), shared);
    assert.deepEqual(stages(), []);
  });
});
