import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
const css = fs.readFileSync(new URL('web-port/styles.css', root), 'utf8');
const app = fs.readFileSync(new URL('web-port/app.js', root), 'utf8');

test('header keeps only the brand on the left and three compact actions on the right', () => {
  assert.match(html, /<h1 class="brand-title">Nonogram<\/h1>/);
  assert.match(html, /class="header-actions"[\s\S]*brand-heart[\s\S]*id="shareButton"[\s\S]*id="settingsButton"/);
  assert.doesNotMatch(html, /class="points-balance"/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto/);
});

test('points are plain text and the clear-grid control sits at the leading edge of the puzzle header', () => {
  assert.match(html, /id="clearBoardButton"/);
  assert.match(html, /id="pointsBalance"/);
  assert.match(html, /class="points-line"/);
  assert.match(app, /board\.reset\(\)/);
  assert.match(app, /Grid cleared\./);
  assert.match(app, /clearBoardButton'\)\.disabled/);
});

test('heart uses a bright accent and bottom toolbar has three spacious round controls', () => {
  assert.match(css, /--heart:\s*#ff5f91/i);
  assert.match(css, /\.brand-heart svg[\s\S]*fill:\s*var\(--heart\)/);
  assert.match(css, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /\.tool-button[\s\S]*border-radius:\s*50%/);
});
