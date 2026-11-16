import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
const app = fs.readFileSync(new URL('web-port/app.js', root), 'utf8');
const css = fs.readFileSync(new URL('web-port/styles.css', root), 'utf8');

test('all six named palettes are available and persisted independently of game progress', () => {
  const palettes = [...html.matchAll(/data-theme-choice="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(palettes, ['lavender', 'ocean', 'rose', 'forest', 'midnight', 'amoled']);
  assert.match(app, /prasannaone\.nonogram\.theme\.v1/);
  assert.match(app, /storage\.setItem\(THEME_KEY, theme\)/);
  assert.match(app, /document\.documentElement\.dataset\.theme = theme/);
  assert.match(html, /data-theme="lavender"/);
  for (const palette of palettes.filter(name => name !== 'lavender')) assert.match(css, new RegExp(`data-theme="${palette}"`));
});

test('sharing uses the native share sheet and falls back to copying the current game URL', () => {
  assert.match(html, /id="shareButton"/);
  assert.match(app, /navigator\.share\(shareData\)/);
  assert.match(app, /navigator\.clipboard\.writeText\(shareData\.url\)/);
  assert.match(app, /window\.prompt\('Copy this link to share the game:'/);
});

test('about dialog includes a short game introduction and the exact repository link', () => {
  assert.match(html, /A little logic, one square at a time/);
  assert.match(html, /picture-logic puzzle/);
  assert.match(html, /https:\/\/github\.com\/PrasannaOne\/Nonogram/);
});

test('themes provide distinct light, dark and true-black surfaces', () => {
  assert.match(html, /data-theme="lavender"/);
  assert.match(css, /data-theme="midnight"/);
  assert.match(css, /data-theme="amoled"/);
  assert.match(css, /--bg: #000000/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /transition: background-color \.09s linear/);
});


test('palette body copy and primary actions meet readable contrast ratios', () => {
  const blocks = {
    lavender: css.split(':root[data-theme="ocean"]')[0],
    ocean: css.split(':root[data-theme="ocean"]')[1].split(':root[data-theme="rose"]')[0],
    rose: css.split(':root[data-theme="rose"]')[1].split(':root[data-theme="forest"]')[0],
    forest: css.split(':root[data-theme="forest"]')[1].split(':root[data-theme="midnight"]')[0],
    midnight: css.split(':root[data-theme="midnight"]')[1].split(':root[data-theme="amoled"]')[0],
    amoled: css.split(':root[data-theme="amoled"]')[1].split('* {')[0]
  };
  const luminance = hex => {
    const rgb = [0, 2, 4].map(offset => parseInt(hex.slice(1 + offset, 3 + offset), 16) / 255);
    const linear = rgb.map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
  };
  const contrast = (a, b) => {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + .05) / (dark + .05);
  };
  for (const [name, block] of Object.entries(blocks)) {
    const values = Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(match => [match[1], match[2]]));
    assert.ok(contrast(values.ink, values.bg) >= 7, `${name}: primary text contrast`);
    assert.ok(contrast(values.muted, values.bg) >= 4.5, `${name}: supporting text contrast`);
    assert.ok(contrast(values['accent-ink'], values['surface-soft']) >= 4.5, `${name}: action contrast`);
    assert.ok(contrast(values['hero-title'], values.bg) >= 3, `${name}: large title contrast`);
  }
});
