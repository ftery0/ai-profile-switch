import './helpers/home.mjs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const choices = ['work', 'personal', 'omlx', 'work2'];
const promptURL = new URL('../src/lib/prompt.mjs', import.meta.url).href;
const shellURL = new URL('../src/commands/shell.mjs', import.meta.url).href;

// Isolate terminal detection and HOME while exercising public prompts with real
// stream chunks. No fixture invokes Claude or touches the user's profile data.
function runPicker({ keys = ['\x1b[B', '\r'], stdinTTY = true, stdoutTTY = false, outputTTY = true,
  noColor = false, term = 'xterm-256color', shell = false, initial = 0,
  raw = false, flowing = false, confirm = false, defaultOutput = false, sequence = false, accounts = {}, status = 0, columns = 0, rows = 0 } = {}) {
  const env = { ...process.env, TERM: term };
  delete env.FORCE_COLOR;
  if (noColor) env.NO_COLOR = '1';
  else delete env.NO_COLOR;
  if (shell) {
    const home = mkdtempSync(join(process.env.TMPDIR, 'picker-home-'));
    const profiles = join(home, '.claude-profiles');
    for (const name of choices) mkdirSync(join(profiles, name), { recursive: true });
    for (const [name, config] of Object.entries(accounts)) writeFileSync(join(profiles, name, '.claude.json'), JSON.stringify(config));
    writeFileSync(join(profiles, 'meta.json'), JSON.stringify({
      version: 1, activeProfile: 'work', shareSettings: true, profiles: choices,
    }));
    env.HOME = home;
    env.USERPROFILE = home;
  }
  const select = `mod.select('Select a profile:', ${JSON.stringify(choices)}, { ${defaultOutput ? '' : 'output: process.stderr,'} initial: ${initial} })`;
  const exercise = sequence ? `
    async function menu(promise, chunks) {
      await feed(chunks);
      const value = await promise;
      assert.equal(input.isRaw, ${raw});
      assert.equal(input.readableFlowing, ${flowing});
      assert.equal(input.listenerCount('keypress'), 1);
      assert.ok(input.listeners('data').includes(existingData));
      return value;
    }
    assert.equal(await menu(${select}, ['\\x1b[B\\r']), 'personal');
    assert.deepEqual(input.listeners('data'), listeners);
    assert.equal(await menu(${select}, ['\\x1b[A\\r']), 'work2');
    assert.deepEqual(input.listeners('data'), listeners);
    const name = mod.text('Profile name');
    await feed(['second-account\\r']);
    assert.equal(await name, 'second-account');
    const afterText = input.listeners('data');
    assert.equal(await menu(${select}, ['\\x1b[B\\x1b[B\\r']), 'omlx');
    assert.deepEqual(input.listeners('data'), afterText);
    assert.equal(await menu(mod.confirm('Continue?', false), ['y\\r']), true);
    assert.deepEqual(input.listeners('data'), afterText);
    const count = mod.number('Count', 1);
    await feed(['3\\r']);
    assert.equal(await count, 3);
    assert.ok(input.listeners('data').includes(existingData));
    process.stdout.write('sequence-complete\\n');
  ` : `
    const result = ${shell ? "mod.shell(['pick', '--print'])" : confirm ? "mod.confirm('Continue?', false)" : select};
    await feed(${JSON.stringify(keys)});
    const value = await result;
    assert.deepEqual(input.listeners('data'), listeners, 'prompt must remove only its own data listener');
    assert.deepEqual(input.listeners('keypress'), keyListeners, 'prompt must not leave a keypress listener on stdin');
    assert.equal(input.isRaw, ${raw}, 'original raw mode must be restored');
    assert.equal(input.readableFlowing, ${flowing}, 'original input flow must be restored');
    assert.equal(input.readableEncoding, encoding, 'prompt must preserve input encoding');
    assert.deepEqual(rawModes, ${stdinTTY && !raw ? '[true, false]' : '[]'});
    ${shell ? '' : "process.stdout.write(JSON.stringify({ value }) + '\\n');"}
  `;
  const script = `
    import assert from 'node:assert/strict';
    import { PassThrough } from 'node:stream';
    const input = new PassThrough();
    const rawModes = [];
    input.isTTY = ${stdinTTY};
    input.isRaw = ${raw};
    input.setRawMode = value => { rawModes.push(value); input.isRaw = value; };
    const existingData = () => {};
    input.on('data', existingData);
    input.on('keypress', () => {});
    input.${flowing ? 'resume' : 'pause'}();
    Object.defineProperty(process, 'stdin', { value: input });
    Object.defineProperty(process.stdout, 'isTTY', { value: ${stdoutTTY} });
    Object.defineProperty(process.stderr, 'isTTY', { value: ${outputTTY} });
    ${columns ? `Object.defineProperty(process.stderr, 'columns', { value: ${columns} });` : ''}
    ${rows ? `Object.defineProperty(process.stderr, 'rows', { value: ${rows} });` : ''}
    const listeners = input.listeners('data');
    const keyListeners = input.listeners('keypress');
    const encoding = input.readableEncoding;
    async function feed(chunks) {
      for (const chunk of chunks) {
        input.write(chunk);
        await new Promise(setImmediate);
      }
    }
    const mod = await import(${JSON.stringify(shell ? shellURL : promptURL)});
    ${exercise}
    input.destroy();
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    env, encoding: 'utf8', timeout: 5000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, status, result.stderr);
  return result;
}

function assertRedraw(output) {
  // Four choices, the key help line and the closing rail.
  assert.ok(output.includes('\x1b[6A'), 'arrow navigation must return to the existing menu rows');
  assert.ok(output.includes('\x1b[2K'), 'redraw must erase previous choice lines');
  assert.ok(output.includes('\x1b[7A'), 'Enter must return to the prompt heading');
  assert.ok(output.includes('\x1b[0J'), 'Enter must erase remaining menu rows');
}

describe('profile picker terminal output', () => {
  it('redraws terminal stderr when stdout is captured', () => {
    const result = runPicker();
    assert.deepEqual(JSON.parse(result.stdout), { value: 'personal' });
    assertRedraw(result.stderr);
  });

  it('counts wrapped lines when it redraws a narrow window', () => {
    // At 30 columns the key help line takes two rows with Unicode or plain Windows
    // symbols alike, so the menu is 7 rows tall.
    const result = runPicker({ columns: 30 });
    assert.ok(result.stderr.includes('\x1b[7A'), 'arrow navigation must go back over the wrapped row too');
    assert.ok(result.stderr.includes('\x1b[8A'), 'Enter must return to the heading above the wrapped rows');
  });

  it('keeps cursor control enabled with NO_COLOR', () => {
    const result = runPicker({ stdoutTTY: true, noColor: true });
    assertRedraw(result.stderr);
    assert.doesNotMatch(result.stderr, /\x1b\[[0-9;]*m/, 'NO_COLOR must suppress color sequences');
  });

  it('redraws the default stdout output with NO_COLOR', () => {
    const result = runPicker({ stdoutTTY: true, noColor: true, defaultOutput: true });
    assertRedraw(result.stdout);
    assert.doesNotMatch(result.stdout, /\x1b\[[0-9;]*m/);
    assert.ok(result.stdout.endsWith('{"value":"personal"}\n'));
    assert.equal(result.stderr, '');
  });

  it('keeps shell pick --print stdout limited to the selected profile', () => {
    const result = runPicker({ shell: true });
    assert.equal(result.stdout, 'personal\n');
    // Each profile has a name row, a detail row and a spacer, then key help and the closing rail.
    assert.ok(result.stderr.includes('\x1b[14A'), 'arrow navigation must return to the existing menu rows');
    assert.ok(result.stderr.includes('\x1b[15A'), 'Enter must return to the prompt heading');
    // stdout is captured by the shell, so color follows the terminal on stderr.
    assert.match(result.stderr, /\x1b\[36m/);
    const text = result.stderr.replace(/\x1b\[[0-9;]*m/g, '');
    assert.match(text, /Which profile do you want to use\?/);
    assert.match(text, /Not signed in yet/);
    assert.match(text, /Starting with personal/);
    assert.match(text, /Opening Claude Code/);
  });

  it('does not emit terminal commands for TERM=dumb', () => {
    const result = runPicker({ term: 'dumb' });
    assert.deepEqual(JSON.parse(result.stdout), { value: 'personal' });
    assert.doesNotMatch(result.stderr, /\x1b\[/);
  });

  it('does not emit terminal commands when the menu output is piped', () => {
    const result = runPicker({ outputTTY: false });
    assert.deepEqual(JSON.parse(result.stdout), { value: 'personal' });
    assert.doesNotMatch(result.stderr, /\x1b\[/);
  });

  it('selects the initial choice without rendering for noninteractive input', () => {
    const result = runPicker({ stdinTTY: false, initial: 2, keys: [] });
    assert.deepEqual(JSON.parse(result.stdout), { value: 'omlx' });
    assert.equal(result.stderr, '');
  });

  it('picks a profile at once with its number key', () => {
    const result = runPicker({ shell: true, keys: ['3'] });
    assert.equal(result.stdout, 'omlx\n');
  });

  it('shows the email, plan and usage Claude saved for each profile', () => {
    const accounts = {
      work: {
        oauthAccount: { emailAddress: 'kim@company.test', organizationType: 'claude_max' },
        cachedUsageUtilization: { fetchedAtMs: Date.now() - 12 * 60000, utilization: { five_hour: { utilization: 28 }, seven_day: { utilization: 86.4 } } },
      },
      personal: { oauthAccount: { emailAddress: 'me@mail.test', organizationType: 'claude_pro' } },
    };
    const result = runPicker({ shell: true, accounts });
    assert.match(result.stderr, /kim@company\.test · Max/);
    assert.match(result.stderr, /5-hour \S+  28%/);
    assert.match(result.stderr, /Weekly \S+  86%/);
    assert.match(result.stderr, /12 minutes ago/);
    assert.match(result.stderr, /me@mail\.test · Pro/);
    assert.match(result.stderr, /No usage saved yet/);
    assert.match(result.stderr, /in use/);
  });

  describe('in a window shorter than the menu', () => {
    // Every profile signed in: two detail lines and a blank rail under each, 18 rows in all.
    const account = email => ({
      oauthAccount: { emailAddress: email, organizationType: 'claude_max' },
      cachedUsageUtilization: { fetchedAtMs: Date.now(), utilization: { five_hour: { utilization: 0 }, seven_day: { utilization: 26 } } },
    });
    const accounts = Object.fromEntries(choices.map(name => [name, account(`${name}@mail.test`)]));
    const ups = output => [...output.matchAll(/\x1b\[(\d+)A/g)].map(match => Number(match[1]));

    it('shows details only under the selected profile', () => {
      const result = runPicker({ shell: true, accounts, rows: 12, keys: ['\x1b[B', '\x1b[B', '\x1b[B', '\x1b[A', '\r'] });
      assert.equal(result.stdout, 'omlx\n');
      // The cursor never has to go above the window, so nothing piles up in the scrollback.
      assert.ok(Math.max(...ups(result.stderr)) < 12, ups(result.stderr).join(','));
      const firstFrame = result.stderr.slice(0, result.stderr.search(/\x1b\[\d+A/));
      assert.match(firstFrame, /work@mail\.test/);
      assert.doesNotMatch(firstFrame, /personal@mail\.test/);
    });

    it('shows only the profiles around the selection when even that is too tall', () => {
      const result = runPicker({ shell: true, accounts, rows: 10, keys: ['\x1b[B', '\x1b[B', '\x1b[B', '\r'] });
      assert.equal(result.stdout, 'work2\n');
      assert.ok(Math.max(...ups(result.stderr)) < 10, ups(result.stderr).join(','));
      assert.match(result.stderr, /2 more below/);
      assert.match(result.stderr, /2 more above/);
    });
  });

  it('cancels with Esc and prints nothing on stdout', () => {
    const result = runPicker({ shell: true, keys: ['\x1b'], status: 130 });
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /cancelled/);
  });

  it('returns null on Esc for a plain menu', () => {
    const result = runPicker({ keys: ['\x1b'] });
    assert.deepEqual(JSON.parse(result.stdout), { value: null });
  });

  it('returns null on Ctrl-C and restores raw mode and listeners', () => {
    const result = runPicker({ keys: ['\x1b[B', '\x03'] });
    assert.deepEqual(JSON.parse(result.stdout), { value: null });
  });
});

describe('prompt keyboard chunks and cleanup', () => {
  it('handles multiple arrows and Enter in one input chunk', () => {
    const result = runPicker({ keys: ['\x1b[B\x1b[B\r'] });
    assert.deepEqual(JSON.parse(result.stdout), { value: 'omlx' });
  });

  it('handles arrow escape sequences split between input chunks', () => {
    const result = runPicker({ keys: ['\x1b', '[', 'B', '\x1b[', 'B', '\r'] });
    assert.deepEqual(JSON.parse(result.stdout), { value: 'omlx' });
  });

  it('handles y and Enter in one confirmation chunk', () => {
    const result = runPicker({ confirm: true, keys: ['y\r'] });
    assert.ok(result.stdout.endsWith('{"value":true}\n'));
  });

  it('preserves an existing raw and flowing input mode', () => {
    const result = runPicker({ raw: true, flowing: true, keys: ['\x1b[B\r'] });
    assert.deepEqual(JSON.parse(result.stdout), { value: 'personal' });
  });

  it('supports repeated menus, text, confirmation and number prompts', () => {
    const result = runPicker({ sequence: true, stdoutTTY: true, noColor: true });
    assert.ok(result.stdout.endsWith('sequence-complete\n'));
  });
});
