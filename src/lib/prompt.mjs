import { createInterface, emitKeypressEvents } from 'node:readline';
import { PassThrough } from 'node:stream';
import { color, cursorControl, displayWidth, sym } from './ui.mjs';
import { t } from './i18n.mjs';

function rl() {
  return createInterface({ input: process.stdin, output: process.stdout });
}

function readKeys(onKey) {
  const input = process.stdin;
  const wasRaw = Boolean(input.isRaw);
  const wasFlowing = input.readableFlowing === true;
  // Keep readline's decoder off stdin so it cannot consume later text prompts.
  const keys = new PassThrough();
  emitKeypressEvents(keys);
  keys.on('keypress', onKey);
  const onData = chunk => keys.write(chunk);
  input.on('data', onData);
  if (!wasRaw) input.setRawMode(true);
  input.resume();

  return () => {
    input.removeListener('data', onData);
    keys.removeListener('keypress', onKey);
    keys.destroy();
    if (!wasRaw) input.setRawMode(false);
    if (wasFlowing) input.resume();
    else input.pause();
  };
}

// hint is shown only while asking, such as "now: side · empty to cancel".
export async function text(message, defaultVal, hint) {
  const suffix = hint ? `  ${color.dim(hint)}` : defaultVal !== undefined ? color.dim(` (${defaultVal})`) : '';
  const r = rl();
  const cursor = cursorControl();
  return new Promise((resolve) => {
    r.question(`${color.cyan(sym.step)}  ${message}${suffix}\n${color.dim(sym.rail)}  ${color.dim(sym.arrow)} `, (answer) => {
      r.close();
      const result = answer.trim() || defaultVal || '';
      // Replace 2-line prompt with single completed line: ◇ message … answer
      if (cursor.enabled) {
        process.stdout.write(`${cursor.up(2)}\r${cursor.clearLine}${color.green(sym.stepDone)}  ${message} ${color.dim(sym.dots)} ${result ? color.cyan(result) : color.dim(t('prompt.cancelled'))}\n${cursor.clearDown}`);
      }
      resolve(result);
    });
  });
}

export async function number(message, defaultVal) {
  const val = await text(message, defaultVal?.toString());
  const n = parseInt(val, 10);
  if (isNaN(n) || n < 1) return defaultVal ?? 1;
  return n;
}

export async function confirm(message, defaultVal = true) {
  if (!process.stdin.isTTY) {
    return defaultVal;
  }

  return new Promise((resolve) => {
    let selected = defaultVal;
    const cursor = cursorControl();

    const render = (final = false) => {
      const prefix = final ? color.green(sym.stepDone) : color.cyan(sym.step);
      const sep = final ? color.dim(` ${sym.dots} `) : color.dim(` ${sym.arrow} `);
      const no  = !selected ? color.cyan(t('prompt.no'))  : color.dim(t('prompt.no'));
      const yes =  selected ? color.cyan(t('prompt.yes')) : color.dim(t('prompt.yes'));
      const answer = final ? (selected ? yes : no) : `${no} ${color.dim('/')} ${yes}`;
      process.stdout.write(`\r${cursor.clearLine}${prefix}  ${message}${sep}${answer}`);
    };

    render();

    const stop = readKeys((character, key) => {
      if (key.name === 'left' || key.name === 'right' || key.name === 'tab') {
        selected = !selected;
        render();
      } else if (character === 'y' || character === 'Y') {
        selected = true;
        render();
      } else if (character === 'n' || character === 'N') {
        selected = false;
        render();
      } else if (key.name === 'return' || key.name === 'enter' || key.name === 'escape') {
        if (key.name === 'escape') selected = false;
        stop();
        render(true);
        process.stdout.write('\n');
        resolve(selected);
      } else if (key.ctrl && key.name === 'c') {
        stop();
        process.stdout.write('\n');
        process.exit(0);
      }
    });
  });
}

// Choices are strings or { label, value, hint, details }. hint sits after the label,
// details are extra dim lines under it. numbered adds 1-9 keys that pick at once.
// body lines sit between the question and the choices; back says Esc goes back.
export async function select(message, choices, {
  output = process.stdout, initial = 0, numbered = false, done, body = [], back = false,
} = {}) {
  const items = choices.map(choice => (typeof choice === 'string' ? { label: choice, value: choice } : choice));
  return new Promise((resolve) => {
    let selected = Math.max(0, Math.min(initial, items.length - 1));
    let height = 0;
    let top = 0;
    const cursor = cursorControl(output);
    const rail = color.dim(sym.rail);
    const indent = ' '.repeat(numbered ? 5 : 2);
    const keys = numbered && items.length > 1 && items.length <= 9
      ? t(back ? 'prompt.keysNumberedBack' : 'prompt.keysNumbered', { arrows: sym.arrows, max: items.length })
      : t(back ? 'prompt.keysBack' : 'prompt.keys', { arrows: sym.arrows });

    // The choices from index from up to to, with details under the ones detailed(i) picks.
    const rows = (detailed = () => true, from = 0, to = items.length) => {
      const lines = [];
      if (from > 0) lines.push(`${rail}  ${color.dim(t('prompt.moreAbove', { count: from }))}`);
      items.slice(from, to).forEach((item, offset) => {
        const i = from + offset;
        const number = numbered ? `${i + 1}  ` : '';
        const head = i === selected
          ? color.cyan(`${sym.cursor} ${number}${item.label}`)
          : `  ${numbered ? `${color.dim(String(i + 1))}  ` : ''}${item.label}`;
        lines.push(`${rail}  ${head}${item.hint ? `  ${item.hint}` : ''}`);
        if (!detailed(i) || !item.details?.length) return;
        for (const detail of item.details) lines.push(`${rail}  ${indent}${detail}`);
        lines.push(rail);
      });
      if (to < items.length) lines.push(`${rail}  ${color.dim(t('prompt.moreBelow', { count: items.length - to }))}`);
      lines.push(`${rail}  ${color.dim(keys)}`, color.dim(sym.railEnd));
      return lines;
    };

    // A line wider than the window wraps, so count the screen rows it really takes.
    const screenRows = lines => lines.reduce((sum, line) => sum
      + Math.max(1, Math.ceil(displayWidth(line) / (output.columns || Infinity))), 0);
    const header = [`${color.cyan(sym.step)}  ${message}`, ...body.map(line => `${rail}  ${line}`)];

    // The cursor can't move up past the top of the window, so a menu taller than the window
    // can't be redrawn in place: every redraw would push another copy of its first rows into
    // the scrollback. It shrinks to fit instead: details only under the selected choice, then
    // only the choices around it. The row under the menu is where the cursor waits.
    const fits = lines => screenRows(header) + screenRows(lines) < (output.rows || Infinity);
    const layout = () => {
      const full = rows();
      if (fits(full)) return full;
      const shown = (from, to) => rows(i => i === selected, from, to);
      if (fits(shown(0, items.length))) return shown(0, items.length);
      const end = from => {
        let to = Math.max(from, selected) + 1;
        while (to < items.length && fits(shown(from, to + 1))) to++;
        return to;
      };
      top = Math.min(top, selected);
      while (top < selected && !fits(shown(top, end(top)))) top++;
      return shown(top, end(top));
    };

    const render = () => {
      if (height) output.write(cursor.up(height));
      const lines = layout();
      for (const line of lines) output.write(`${cursor.clearLine}${line}\n`);
      // A shorter menu than last time leaves old rows below it.
      output.write(cursor.clearDown);
      height = screenRows(lines);
    };

    const finish = (value, summary) => {
      stop();
      if (cursor.enabled) {
        output.write(`${cursor.up(height + screenRows(header))}\r${cursor.clearLine}${summary}\n${cursor.clearDown}`);
      }
      resolve(value);
    };

    const pick = () => {
      const item = items[selected];
      const summary = done ? done(item.value) : `${message} ${color.dim(sym.dots)} ${color.cyan(item.label.trim())}`;
      finish(item.value, `${color.green(sym.stepDone)}  ${summary}`);
    };

    if (!process.stdin.isTTY) {
      // Non-interactive: pick the initial choice without rendering the menu
      resolve(items[selected].value);
      return;
    }

    for (const line of header) output.write(`${line}\n`);
    render();

    const stop = readKeys((character, key) => {
      if (key.name === 'up') {
        selected = (selected - 1 + items.length) % items.length;
        render();
      } else if (key.name === 'down') {
        selected = (selected + 1) % items.length;
        render();
      } else if (numbered && /^[1-9]$/.test(character ?? '') && Number(character) <= items.length) {
        selected = Number(character) - 1;
        pick();
      } else if (key.name === 'return' || key.name === 'enter') {
        pick();
      } else if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
        finish(null, `${color.dim(sym.stepDone)}  ${message} ${color.dim(t('prompt.cancelled'))}`);
      }
    });
  });
}
